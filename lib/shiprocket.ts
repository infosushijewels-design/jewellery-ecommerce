/**
 * Server-only Shiprocket integration helper.
 *
 * Credentials live in public.shiprocket_credentials (migration 015) — a
 * table with NO public read policy, unlike store_settings, because it holds
 * a password. Never import this file from a Client Component; it always
 * reads through the cookie-based server Supabase client, so it only works
 * inside Route Handlers / Server Components / Server Actions.
 *
 * Every exported function returns `{ configured: false }` instead of
 * throwing when Shiprocket hasn't been set up in Admin → Settings yet, so
 * callers can show "Shiprocket not set up yet — add credentials in
 * Settings" without a try/catch. Once configured, real failures (bad
 * credentials, Shiprocket API errors, network issues) come back as
 * `{ configured: true, success: false, error }` for the same reason —
 * exactly one place to check, no exceptions to remember to catch.
 */
import { createClient } from '@/lib/supabase/server';
import type { FullOrder } from '@/lib/supabase/orderService';

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

// Refresh a little before the ~10-day token actually expires, to be safe.
const TOKEN_LIFETIME_MS = 9 * 24 * 60 * 60 * 1000;

export type ShiprocketOutcome<T> =
  | { configured: false }
  | { configured: true; success: true; data: T }
  | { configured: true; success: false; error: string };

interface ShiprocketCredentials {
  email: string;
  password: string;
  pickupLocationName: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

// Module-scope cache. On serverless hosts each cold start gets its own cache
// (so this is a best-effort optimization, not a guarantee) — correctness
// never depends on it, since a missing/expired entry just re-authenticates.
let tokenCache: TokenCache | null = null;

async function getCredentials(): Promise<ShiprocketCredentials | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shiprocket_credentials')
    .select('enabled, email, password, pickup_location_name')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.enabled || !data.email?.trim() || !data.password?.trim() || !data.pickup_location_name?.trim()) return null;

  return { email: data.email, password: data.password, pickupLocationName: data.pickup_location_name };
}

/** Cheap check for UI gating (e.g. greying out a "Create Shipment" button) — no login call. */
export async function isShiprocketConfigured(): Promise<boolean> {
  return (await getCredentials()) !== null;
}

/** Logs in (or reuses a cached token) and returns a bearer token for the other calls below. */
export async function getShiprocketToken(): Promise<ShiprocketOutcome<string>> {
  const credentials = await getCredentials();
  if (!credentials) return { configured: false };

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) {
    return { configured: true, success: true, data: tokenCache.token };
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.token) {
      const message = body?.message || `Shiprocket login failed (HTTP ${res.status})`;
      return { configured: true, success: false, error: message };
    }

    tokenCache = { token: body.token, expiresAt: now + TOKEN_LIFETIME_MS };
    return { configured: true, success: true, data: tokenCache.token };
  } catch (err) {
    return { configured: true, success: false, error: err instanceof Error ? err.message : 'Could not reach Shiprocket' };
  }
}

/** Wraps a Shiprocket API call so a 401 (expired/invalid token) retries once with a fresh login. */
async function shiprocketFetch(path: string, init: RequestInit, credentials: ShiprocketCredentials): Promise<Response> {
  const tokenResult = await getShiprocketToken();
  if (!tokenResult.configured || !tokenResult.success) {
    throw new Error(!tokenResult.configured ? 'Shiprocket is not configured' : tokenResult.error);
  }

  const call = (token: string) =>
    fetch(`${SHIPROCKET_BASE}${path}`, {
      ...init,
      headers: { ...init.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

  let res = await call(tokenResult.data);
  if (res.status === 401) {
    // Token was cached but Shiprocket rejected it — drop the cache and log in again once.
    tokenCache = null;
    const retryResult = await getShiprocketToken();
    if (!retryResult.configured || !retryResult.success) {
      throw new Error(!retryResult.configured ? 'Shiprocket is not configured' : retryResult.error);
    }
    res = await call(retryResult.data);
  }
  void credentials; // reserved for future use (e.g. multi-account support)
  return res;
}

export interface ShiprocketShipmentResult {
  shiprocketOrderId: string;
  shipmentId: string;
  awbCode: string | null;
  courierName: string | null;
}

// Fallback for line items with no matching product row (e.g. a deleted
// product, or a custom item) — a single small jewellery piece.
const DEFAULT_ITEM_WEIGHT_KG = 0.1;
const DEFAULT_PACKAGE_DIMENSIONS = { lengthCm: 10, breadthCm: 10, heightCm: 5 };

/**
 * Sums real per-product weight across the order's line items and takes the
 * largest single product's box dimensions (a reasonable stand-in for "the
 * items get packed into one box roughly that size"). Items without a
 * matching product row (custom items, deleted products) fall back to
 * DEFAULT_ITEM_WEIGHT_KG each, and the whole order falls back to
 * DEFAULT_PACKAGE_DIMENSIONS if nothing could be matched at all.
 */
async function estimatePackageForOrder(order: FullOrder) {
  const productIds = Array.from(new Set(order.items.map((i) => i.product_id).filter((id): id is string => !!id)));

  let products: { id: string; length_cm: number; breadth_cm: number; height_cm: number; weight_kg: number }[] = [];
  if (productIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase.from('products').select('id, length_cm, breadth_cm, height_cm, weight_kg').in('id', productIds);
    products = data || [];
  }
  const byId = new Map(products.map((p) => [p.id, p]));

  let weightKg = 0;
  let lengthCm = 0;
  let breadthCm = 0;
  let heightCm = 0;
  let matchedAny = false;

  for (const item of order.items) {
    const product = item.product_id ? byId.get(item.product_id) : undefined;
    if (product) {
      matchedAny = true;
      weightKg += product.weight_kg * item.quantity;
      lengthCm = Math.max(lengthCm, product.length_cm);
      breadthCm = Math.max(breadthCm, product.breadth_cm);
      heightCm = Math.max(heightCm, product.height_cm);
    } else {
      weightKg += DEFAULT_ITEM_WEIGHT_KG * item.quantity;
    }
  }

  return {
    weightKg: weightKg > 0 ? weightKg : DEFAULT_ITEM_WEIGHT_KG,
    lengthCm: matchedAny ? lengthCm : DEFAULT_PACKAGE_DIMENSIONS.lengthCm,
    breadthCm: matchedAny ? breadthCm : DEFAULT_PACKAGE_DIMENSIONS.breadthCm,
    heightCm: matchedAny ? heightCm : DEFAULT_PACKAGE_DIMENSIONS.heightCm,
  };
}

/**
 * Creates a Shiprocket order (and, if a courier auto-assigns, an AWB) from
 * one of our orders. Package weight/dimensions are estimated from the
 * ordered products' `length_cm`/`breadth_cm`/`height_cm`/`weight_kg`
 * (migration 016; all default to a small jewellery box until an admin sets
 * real values) — pass `packageOptions` to override the estimate outright.
 */
export async function createShiprocketOrder(
  order: FullOrder,
  packageOptions?: { weightKg?: number; lengthCm?: number; breadthCm?: number; heightCm?: number }
): Promise<ShiprocketOutcome<ShiprocketShipmentResult>> {
  const credentials = await getCredentials();
  if (!credentials) return { configured: false };

  const estimate = await estimatePackageForOrder(order);

  const address = order.shipping_address as {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  const [firstName, ...rest] = (address.full_name || 'Customer').trim().split(/\s+/);

  const payload = {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().slice(0, 16).replace('T', ' '),
    pickup_location: credentials.pickupLocationName,
    billing_customer_name: firstName,
    billing_last_name: rest.join(' ') || '.',
    billing_address: address.address,
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state,
    billing_country: 'India',
    billing_email: address.email,
    billing_phone: address.phone.replace(/\D/g, '').slice(-10),
    shipping_is_billing: true,
    order_items: order.items.map((item) => ({
      name: item.title,
      sku: item.product_id || item.id,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.subtotal,
    length: packageOptions?.lengthCm ?? estimate.lengthCm,
    breadth: packageOptions?.breadthCm ?? estimate.breadthCm,
    height: packageOptions?.heightCm ?? estimate.heightCm,
    weight: packageOptions?.weightKg ?? estimate.weightKg,
  };

  try {
    const res = await shiprocketFetch('/orders/create/adhoc', { method: 'POST', body: JSON.stringify(payload) }, credentials);
    const body = await res.json().catch(() => null);

    if (!res.ok || body?.status_code === 0 || !body?.order_id) {
      const message = body?.message || (typeof body?.errors === 'object' ? JSON.stringify(body.errors) : `Shiprocket rejected the order (HTTP ${res.status})`);
      return { configured: true, success: false, error: message };
    }

    return {
      configured: true,
      success: true,
      data: {
        shiprocketOrderId: String(body.order_id),
        shipmentId: String(body.shipment_id),
        awbCode: body.awb_code ? String(body.awb_code) : null,
        courierName: body.courier_name || null,
      },
    };
  } catch (err) {
    return { configured: true, success: false, error: err instanceof Error ? err.message : 'Could not reach Shiprocket' };
  }
}

export interface ShiprocketTrackingResult {
  status: string;
  currentLocation: string | null;
  courierName: string | null;
  checkpoints: { status: string; location: string | null; timestamp: string | null }[];
}

/** Looks up live tracking for a shipment by its AWB (airway bill) number. */
export async function trackShipment(awbCode: string): Promise<ShiprocketOutcome<ShiprocketTrackingResult>> {
  const credentials = await getCredentials();
  if (!credentials) return { configured: false };

  try {
    const res = await shiprocketFetch(`/courier/track/awb/${encodeURIComponent(awbCode)}`, { method: 'GET' }, credentials);
    const body = await res.json().catch(() => null);
    const trackData = body?.tracking_data;

    if (!res.ok || !trackData || trackData.error) {
      const message = trackData?.error || body?.message || `Could not fetch tracking (HTTP ${res.status})`;
      return { configured: true, success: false, error: message };
    }

    const activities: Array<{ status?: string; location?: string; date?: string }> = trackData.shipment_track_activities || [];

    return {
      configured: true,
      success: true,
      data: {
        status: trackData.shipment_status || trackData.current_status || 'Unknown',
        currentLocation: activities[0]?.location || null,
        courierName: trackData.courier_name || null,
        checkpoints: activities.map((a) => ({ status: a.status || '', location: a.location || null, timestamp: a.date || null })),
      },
    };
  } catch (err) {
    return { configured: true, success: false, error: err instanceof Error ? err.message : 'Could not reach Shiprocket' };
  }
}
