import { createClient } from './client';
import { Database } from './database.types';
import { isDemoAdminActive } from '@/lib/utils/adminDemoAccess';
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];
type VariantInsert = Database['public']['Tables']['product_variants']['Insert'];

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : '';
}

export interface FullOrder extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  /** Only used for the local copy — the server takes the customer's identity from their session. */
  userId?: string | null;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  /** Only WHICH product and HOW MANY (plus the chosen metal and size): prices are decided by the server. */
  items: {
    productId: string;
    quantity: number;
    metal?: string | null;
    size?: string | null;
  }[];
  paymentMethod: 'cod' | 'online';
  notes?: string;
}

const LOCAL_STORAGE_ORDERS_KEY = 'sushi_jewels_orders_cache';
const GUEST_RECENT_ORDERS_KEY = 'sushi_guest_recent_orders';

// Helper for local storage backup
function getLocalOrders(): FullOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: FullOrder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to cache orders locally:', e);
  }
}

interface GuestOrderRef {
  orderId: string;
  orderNumber: string;
  createdAt: string;
}

// A lightweight index of this device's guest orders, used to look up fresh
// order status directly (even if the full local cache above gets stale).
function getGuestRecentOrders(): GuestOrderRef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_RECENT_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestRecentOrders(refs: GuestOrderRef[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_RECENT_ORDERS_KEY, JSON.stringify(refs));
  } catch (e) {
    console.warn('Failed to save guest recent orders:', e);
  }
}

function addGuestRecentOrder(ref: GuestOrderRef) {
  const existing = getGuestRecentOrders().filter((o) => o.orderId !== ref.orderId);
  saveGuestRecentOrders([ref, ...existing].slice(0, 25));
}

/** What the server worked out for an order (prices come from the catalogue, never from the browser). */
export interface PlacedOrderSummary {
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  items: {
    productId: string;
    title: string;
    imageUrl: string | null;
    price: number;
    quantity: number;
    metal: string | null;
    size: string | null;
  }[];
}

export interface PlacedOrder {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  order?: PlacedOrderSummary;
  /** Secret that lets the customer open this order from any device: /orders/<number>?t=<token>. */
  trackingToken?: string;
  /** Present for online payments: the Razorpay order to open in the payment window. */
  razorpay?: { id: string; amount: number; currency: string; keyId: string };
}

/**
 * Places an order through the server (/api/orders). The server prices the cart from the catalogue, saves the
 * order and its items (for guests and signed-in customers alike) and, for online payments, opens a Razorpay
 * order for exactly the server-calculated total. Online orders stay "pending" until confirmOnlinePayment()
 * succeeds. A copy is kept in this browser so the order can still be opened here (guest tracking).
 * If the server could not save the order, it is NOT reported as placed.
 */
export async function createOrder(input: CreateOrderInput): Promise<PlacedOrder> {
  let response: Response;
  try {
    response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only WHAT and HOW MANY are sent — no prices or totals; the server decides those.
      body: JSON.stringify({
        shippingAddress: input.shippingAddress,
        items: input.items.map((item) => ({ productId: item.productId, quantity: item.quantity, metal: item.metal ?? null, size: item.size ?? null })),
        paymentMethod: input.paymentMethod,
        notes: input.notes,
      }),
    });
  } catch (err) {
    console.error('Network error placing order:', err);
    return { success: false, error: 'Could not reach the server. Please check your connection and try again.' };
  }

  const result = (await response.json().catch(() => null)) as PlacedOrder | null;
  if (!response.ok || !result?.success || !result.orderId || !result.orderNumber || !result.order) {
    return { success: false, error: result?.error || 'We could not save your order. Please try again.' };
  }
  const { orderId, orderNumber, order } = result;

  // Local copy (guest tracking on this device). A storage failure here must never undo a saved order.
  try {
    const createdAt = new Date().toISOString();
    const record: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: input.userId || null,
      status: 'placed',
      subtotal: order.subtotal,
      tax: order.tax,
      shipping_fee: order.shippingFee,
      total: order.total,
      payment_method: input.paymentMethod,
      payment_status: 'pending',
      shipping_address: {
        full_name: input.shippingAddress.fullName,
        email: input.shippingAddress.email,
        phone: input.shippingAddress.phone,
        address: input.shippingAddress.address,
        city: input.shippingAddress.city,
        state: input.shippingAddress.state,
        pincode: input.shippingAddress.pincode,
      },
      notes: input.notes || null,
      razorpay_order_id: result.razorpay?.id ?? null,
      razorpay_payment_id: null,
      paid_at: null,
      tracking_token: result.trackingToken ?? null,
      stock_reserved: false,
      refunded_amount: 0,
      created_at: createdAt,
      updated_at: createdAt,
    };
    const itemRecords: OrderItem[] = order.items.map((item, idx) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${idx}`,
      order_id: orderId,
      product_id: item.productId,
      title: item.title,
      image_url: item.imageUrl,
      price: item.price,
      quantity: item.quantity,
      metal: item.metal,
      size: item.size,
      created_at: createdAt,
    }));
    saveLocalOrders([{ ...record, items: itemRecords }, ...getLocalOrders()]);
    addGuestRecentOrder({ orderId, orderNumber, createdAt });
  } catch (err) {
    console.warn('Could not keep a local copy of the order:', err);
  }

  return result;
}

/**
 * Asks the server to confirm an online payment. The server checks the Razorpay signature, then asks Razorpay
 * for the payment and compares it with the order (same order, INR, authorised/captured, exact amount) before
 * marking the order paid.
 */
export async function confirmOnlinePayment(proof: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    const response = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: proof.razorpayOrderId,
        razorpay_payment_id: proof.razorpayPaymentId,
        razorpay_signature: proof.razorpaySignature,
      }),
    });
    const body = (await response.json().catch(() => null)) as { verified?: boolean; orderId?: string; orderNumber?: string; error?: string } | null;
    if (!response.ok || !body?.verified) return { success: false, error: body?.error || 'Payment could not be verified.' };

    try {
      saveLocalOrders(
        getLocalOrders().map((o) =>
          o.id === body.orderId ? { ...o, payment_status: 'paid' as const, razorpay_payment_id: proof.razorpayPaymentId, paid_at: new Date().toISOString() } : o
        )
      );
    } catch {
      /* the local copy is only a convenience */
    }
    return { success: true, orderId: body.orderId, orderNumber: body.orderNumber };
  } catch (err) {
    console.error('Payment verification error:', err);
    return { success: false, error: 'Payment could not be verified.' };
  }
}

/**
 * Best-effort: claim any guest orders (user_id IS NULL) whose shipping email
 * matches this user's own email, so they permanently become "their" orders.
 * Relies on RLS policies added in migration 005 — silently no-ops if those
 * policies aren't present yet (e.g. migration not applied).
 */
async function claimGuestOrdersByEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string
): Promise<void> {
  try {
    const { data: matches } = await supabase
      .from('orders')
      .select('id')
      .is('user_id', null)
      .eq('shipping_address->>email', email);

    const ids = (matches || []).map((m) => m.id);
    if (ids.length === 0) return;

    await supabase
      .from('orders')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .in('id', ids);
  } catch (e) {
    console.warn('Could not auto-link guest orders by email:', e);
  }
}

/**
 * Claim this user's guest orders (same shipping email) right after sign-in or
 * registration, so they appear under "My Orders" without opening the page first.
 */
export async function linkGuestOrdersForUser(userId: string, email?: string | null): Promise<void> {
  if (!userId || !email) return;
  await claimGuestOrdersByEmail(createClient(), userId, email);
}

/**
 * Fetch all orders for a specific user.
 * - Logged in: fetches the user's own orders from Supabase, auto-linking any
 *   guest orders placed earlier under the same email address.
 * - Guest (no userId): hydrates from this device's local guest order index so
 *   `/orders` is never empty right after a guest checkout.
 */
export async function getUserOrders(userId?: string | null, email?: string | null): Promise<FullOrder[]> {
  if (!userId) {
    const refs = getGuestRecentOrders();
    if (refs.length === 0) return getLocalOrders();

    const hydrated = await Promise.all(refs.map((ref) => getOrderById(ref.orderId)));
    return hydrated
      .filter((o): o is FullOrder => !!o)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const local = getLocalOrders();
  const supabase = createClient();

  try {
    if (email) {
      await claimGuestOrdersByEmail(supabase, userId, email);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !orders || orders.length === 0) {
      return local.filter((o) => !o.user_id || o.user_id === userId);
    }

    return orders.map((o) => ({
      ...o,
      items: o.items || [],
    }));
  } catch {
    return local.filter((o) => !o.user_id || o.user_id === userId);
  }
}

/** Path of the order tracking page; the secret token (when known) lets a guest open it from any device. */
export function orderTrackingPath(identifier: string, trackingToken?: string | null): string {
  return `/orders/${encodeURIComponent(identifier)}${trackingToken ? `?t=${encodeURIComponent(trackingToken)}` : ''}`;
}

/**
 * Fetch single order by its ID or order_number
 */
export async function getOrderById(identifier: string, trackingToken?: string | null): Promise<FullOrder | null> {
  // With the secret from the tracking link, anyone holding the link (a guest, on any device) can open the order.
  if (trackingToken && /^[a-f0-9]{32}$/i.test(trackingToken)) {
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(identifier)}&token=${encodeURIComponent(trackingToken)}`, { cache: 'no-store' });
      if (res.ok) {
        const body = (await res.json()) as { order?: FullOrder };
        if (body.order) return body.order;
      }
    } catch {
      /* fall back to the normal lookup below */
    }
  }

  const local = getLocalOrders();
  const localMatch = local.find((o) => o.id === identifier || o.order_number === identifier);

  const supabase = createClient();
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const query = supabase.from('orders').select('*, items:order_items(*)');
    
    const { data, error } = isUuid 
      ? await query.eq('id', identifier).single() 
      : await query.eq('order_number', identifier).single();

    if (error || !data) {
      return localMatch || null;
    }

    return {
      ...data,
      items: (data as unknown as { items?: OrderItem[] }).items || [],
    };
  } catch {
    return localMatch || null;
  }
}

/**
 * Admin: Fetch all orders across all customers
 */
export async function getAllOrdersAdmin(): Promise<FullOrder[]> {
  const local = getLocalOrders();
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return local;
    }

    // Merge any local-only orders with Supabase orders
    const sbIds = new Set(data.map((d: { id: string }) => d.id));
    const unmergedLocal = local.filter((l) => !sbIds.has(l.id));

    const formattedSb = data.map((o) => ({
      ...o,
      items: (o as unknown as { items?: OrderItem[] }).items || [],
    }));

    return [...formattedSb, ...unmergedLocal];
  } catch {
    return local;
  }
}

/**
 * Admin: Update order status (placed, processing, shipped, delivered, cancelled)
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  // Update local cache
  const local = getLocalOrders();
  const updatedLocal = local.map((o) =>
    o.id === orderId || o.order_number === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
  );
  saveLocalOrders(updatedLocal);

  const supabase = createClient();
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const query = supabase.from('orders').update({ status, updated_at: new Date().toISOString() });
    
    const { error } = isUuid ? await query.eq('id', orderId) : await query.eq('order_number', orderId);
    if (error) {
      console.warn('Error updating status in Supabase:', error.message);
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Admin: Update an order's payment status (pending, paid, failed).
 * Mirrors updateOrderStatus: local cache first, then Supabase (best-effort).
 */
export async function updateOrderPaymentStatus(orderId: string, paymentStatus: Order['payment_status']): Promise<boolean> {
  const local = getLocalOrders();
  saveLocalOrders(
    local.map((o) =>
      o.id === orderId || o.order_number === orderId
        ? { ...o, payment_status: paymentStatus, updated_at: new Date().toISOString() }
        : o
    )
  );

  const supabase = createClient();
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const query = supabase.from('orders').update({ payment_status: paymentStatus, updated_at: new Date().toISOString() });
    const { error } = isUuid ? await query.eq('id', orderId) : await query.eq('order_number', orderId);
    if (error) console.warn('Error updating payment status in Supabase:', error.message);
    return true;
  } catch {
    return true;
  }
}

/**
 * Admin: Fetch statistics for dashboard
 */
export async function getAdminStats() {
  const orders = await getAllOrdersAdmin();
  const supabase = createClient();

  let productsCount = 0;
  try {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    productsCount = count || 0;
  } catch {
    productsCount = 12;
  }

  const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalOrders = orders.length;
  const pendingShipments = orders.filter((o) => o.status === 'placed' || o.status === 'processing').length;
  
  // Unique customers
  const uniqueEmails = new Set(orders.map((o) => o.shipping_address?.email).filter(Boolean));
  const totalCustomers = Math.max(uniqueEmails.size, 1);

  return {
    totalRevenue,
    totalOrders,
    productsCount,
    totalCustomers,
    pendingShipments,
    recentOrders: orders.slice(0, 5),
  };
}

export interface DashboardOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChangePct: number;
  ordersChangePct: number;
  customersChangePct: number;
  productsChangePct: number;
  monthlySales: { label: string; value: number }[];
  recentOrders: FullOrder[];
  topSellingProducts: { id: string; title: string; imageUrl: string; unitsSold: number }[];
  lowStockProducts: { id: string; title: string; stock: number }[];
  categorySales: { name: string; revenue: number; units: number }[];
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Admin: Fetch the full dashboard overview — revenue/orders/customers/products
 * with month-over-month % change, a 6-month sales trend, recent orders,
 * top-selling products (by units sold), and low-stock alerts (stock < 5).
 */
export async function getAdminDashboardOverview(): Promise<DashboardOverview> {
  const supabase = createClient();
  const orders = await getAllOrdersAdmin();

  let products: Product[] = [];
  try {
    const { data } = await supabase.from('products').select('*');
    products = data || [];
  } catch {
    products = [];
  }

  let categories: { id: string; name: string }[] = [];
  try {
    const { data } = await supabase.from('categories').select('id, name');
    categories = data || [];
  } catch {
    categories = [];
  }

  const now = new Date();
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() - 1, 1);

  const isInRange = (dateStr: string, start: Date, end: Date) => {
    const t = new Date(dateStr).getTime();
    return t >= start.getTime() && t < end.getTime();
  };

  const thisMonthOrders = orders.filter((o) => isInRange(o.created_at, thisMonthStart, now));
  const lastMonthOrders = orders.filter((o) => isInRange(o.created_at, lastMonthStart, thisMonthStart));

  const sumRevenue = (list: FullOrder[]) => list.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const uniqueEmailCount = (list: FullOrder[]) =>
    new Set(list.map((o) => o.shipping_address?.email).filter(Boolean)).size;

  const totalRevenue = sumRevenue(orders);
  const totalOrders = orders.length;
  const totalCustomers = uniqueEmailCount(orders);
  const totalProducts = products.length;

  const thisMonthProducts = products.filter((p) => isInRange(p.created_at, thisMonthStart, now)).length;
  const lastMonthProducts = products.filter((p) => isInRange(p.created_at, lastMonthStart, thisMonthStart)).length;

  const revenueChangePct = pctChange(sumRevenue(thisMonthOrders), sumRevenue(lastMonthOrders));
  const ordersChangePct = pctChange(thisMonthOrders.length, lastMonthOrders.length);
  const customersChangePct = pctChange(uniqueEmailCount(thisMonthOrders), uniqueEmailCount(lastMonthOrders));
  const productsChangePct = pctChange(thisMonthProducts, lastMonthProducts);

  // Monthly revenue trend for the last 6 months (oldest first)
  const monthlySales: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthlySales.push({
      label: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
      value: sumRevenue(orders.filter((o) => isInRange(o.created_at, monthStart, monthEnd))),
    });
  }

  // Top-selling products by units sold, aggregated from order line items
  const unitsSoldMap = new Map<string, { title: string; imageUrl: string; unitsSold: number }>();
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const key = item.product_id || item.title;
      const existing = unitsSoldMap.get(key);
      if (existing) {
        existing.unitsSold += item.quantity;
      } else {
        unitsSoldMap.set(key, { title: item.title, imageUrl: item.image_url || '', unitsSold: item.quantity });
      }
    });
  });
  const topSellingProducts = Array.from(unitsSoldMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // Low stock alerts
  const lowStockProducts = products
    .filter((p) => (p.stock ?? 0) < 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .slice(0, 6)
    .map((p) => ({ id: p.id, title: p.title, stock: p.stock ?? 0 }));

  // Revenue split by category (cancelled orders excluded), via product -> category_id
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const categoryByProduct = new Map(
    products.map((p) => [p.id, (p.category_id && categoryNameById.get(p.category_id)) || 'Uncategorised'])
  );
  const categoryMap = new Map<string, { revenue: number; units: number }>();
  orders
    .filter((o) => o.status !== 'cancelled')
    .forEach((o) => {
      (o.items || []).forEach((item) => {
        const name = (item.product_id && categoryByProduct.get(item.product_id)) || 'Uncategorised';
        const entry = categoryMap.get(name) || { revenue: 0, units: 0 };
        entry.revenue += (Number(item.price) || 0) * item.quantity;
        entry.units += item.quantity;
        categoryMap.set(name, entry);
      });
    });
  const categorySales = Array.from(categoryMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueChangePct,
    ordersChangePct,
    customersChangePct,
    productsChangePct,
    monthlySales,
    recentOrders: orders.slice(0, 6),
    topSellingProducts,
    lowStockProducts,
    categorySales,
  };
}

/**
 * Admin: Check if logged in user is admin
 */
export async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const supabase = createClient();

  try {
    // profiles.role is the only source of truth. It is guarded by the
    // guard_profile_privileges trigger (migration 010), so it cannot be set by
    // the client. Never trust the email address or user_metadata here — both
    // are attacker-controlled at sign-up time.
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return false;

    return data.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Admin: Fetch all registered customer profiles
 */
export interface AdminCustomer {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  city: string | null;
  role: string;
  isGuest: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  orders: FullOrder[];
}

/**
 * Admin: Customer directory — registered profiles merged with guest shoppers
 * (checkout emails with no matching profile), each with order history and
 * lifetime spend (cancelled orders excluded).
 */
export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const supabase = createClient();
  const orders = await getAllOrdersAdmin();

  let profiles: Profile[] = [];
  try {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    profiles = data || [];
  } catch {
    profiles = [];
  }

  const summarise = (list: FullOrder[]) => {
    const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = sorted[0];
    return {
      orders: sorted,
      orderCount: sorted.length,
      totalSpent: sorted.filter((o) => o.status !== 'cancelled').reduce((acc, o) => acc + (Number(o.total) || 0), 0),
      lastOrderAt: latest?.created_at || null,
      phone: latest?.shipping_address?.phone || null,
      city: latest?.shipping_address?.city || null,
    };
  };

  const claimed = new Set<string>();
  const registered: AdminCustomer[] = profiles.map((p) => {
    const email = (p.email || '').toLowerCase();
    const own = orders.filter((o) => o.user_id === p.id || (email && o.shipping_address?.email?.toLowerCase() === email));
    own.forEach((o) => claimed.add(o.id));
    return {
      id: p.id,
      email: p.email,
      fullName: p.full_name || own[0]?.shipping_address?.full_name || 'Client',
      role: p.role,
      isGuest: false,
      createdAt: p.created_at,
      ...summarise(own),
    };
  });

  // Guests: group the remaining orders by checkout email
  const guestMap = new Map<string, FullOrder[]>();
  orders
    .filter((o) => !claimed.has(o.id))
    .forEach((o) => {
      const key = (o.shipping_address?.email || 'unknown').toLowerCase();
      guestMap.set(key, [...(guestMap.get(key) || []), o]);
    });
  const guests: AdminCustomer[] = Array.from(guestMap.entries()).map(([email, list]) => {
    const summary = summarise(list);
    const first = summary.orders[summary.orders.length - 1];
    return {
      id: `guest:${email}`,
      email: summary.orders[0]?.shipping_address?.email || email,
      fullName: summary.orders[0]?.shipping_address?.full_name || 'Guest',
      role: 'customer',
      isGuest: true,
      createdAt: first?.created_at || new Date().toISOString(),
      ...summary,
    };
  });

  return [...registered, ...guests];
}

/**
 * Admin: Product management functions with graceful column fallback
 */
export async function adminCreateProduct(product: Record<string, unknown>): Promise<{ success: boolean; id?: string; error?: string }> {
  if (isDemoAdminActive()) {
    return { success: true, id: `demo-product-${Date.now()}` };
  }
  const supabase = createClient();
  try {
    // 1. Try full insert
    const { data, error } = await supabase.from('products').insert(product as ProductInsert).select('id').single();
    if (!error) return { success: true, id: data?.id };

    // 2. If column error (e.g. available_sizes, mrp, stock not in schema yet), fallback to baseline columns
    if (error.message.includes('column') || error.message.includes('schema cache')) {
      const baselinePayload: Record<string, unknown> = {
        title: product.title,
        slug: product.slug,
        price: product.price,
        material: product.material,
        certification: product.certification,
        badge: product.badge,
        image_url: product.image_url,
        category_id: product.category_id,
        collection_id: product.collection_id,
        description: product.description,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
      };
      const { data: retryData, error: retryError } = await supabase.from('products').insert(baselinePayload as ProductInsert).select('id').single();
      if (retryError) return { success: false, error: retryError.message };
      return { success: true, id: retryData?.id };
    }

    return { success: false, error: error.message };
  } catch (e) {
    return { success: false, error: errorMessage(e) || 'Failed to create product' };
  }
}

/**
 * Admin: Fetch all variants (karat, metal color, weight, price override, stock) for a product.
 */
export async function adminGetProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching product variants:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Error fetching product variants:', e);
    return [];
  }
}

/**
 * Admin: Replace all variants for a product with the given list (delete + insert).
 */
export async function adminSaveProductVariants(
  productId: string,
  variants: { sku?: string | null; karat?: string | null; metal_color?: string | null; weight?: number | null; price?: number | null; stock?: number }[]
): Promise<{ success: boolean; error?: string }> {
  if (isDemoAdminActive()) {
    return { success: true };
  }
  const supabase = createClient();
  try {
    const { error: deleteError } = await supabase.from('product_variants').delete().eq('product_id', productId);
    if (deleteError) return { success: false, error: deleteError.message };

    if (variants.length === 0) return { success: true };

    const { error: insertError } = await supabase.from('product_variants').insert(
      variants.map((v) => ({ ...v, product_id: productId })) as VariantInsert[]
    );
    if (insertError) return { success: false, error: insertError.message };

    return { success: true };
  } catch (e) {
    return { success: false, error: errorMessage(e) || 'Failed to save product variants' };
  }
}

export async function adminUpdateProduct(id: string, product: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  if (isDemoAdminActive()) {
    return { success: true };
  }
  const supabase = createClient();
  try {
    const { error } = await supabase.from('products').update(product as ProductUpdate).eq('id', id);
    if (!error) return { success: true };

    // Fallback to baseline columns if column doesn't exist
    if (error.message.includes('column') || error.message.includes('schema cache')) {
      const baselinePayload: Record<string, unknown> = {
        title: product.title,
        slug: product.slug,
        price: product.price,
        material: product.material,
        certification: product.certification,
        badge: product.badge,
        image_url: product.image_url,
        category_id: product.category_id,
        collection_id: product.collection_id,
        description: product.description,
        is_featured: product.is_featured,
        is_new_arrival: product.is_new_arrival,
      };
      const { error: retryError } = await supabase.from('products').update(baselinePayload as ProductUpdate).eq('id', id);
      if (retryError) return { success: false, error: retryError.message };
      return { success: true };
    }

    return { success: false, error: error.message };
  } catch (e) {
    return { success: false, error: errorMessage(e) || 'Failed to update product' };
  }
}

export async function adminDeleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: errorMessage(e) || 'Failed to delete product' };
  }
}

/**
 * Seeds two realistic demo orders into this device's guest order cache the
 * first time there are none, so tracking/stepper/admin views have something
 * to show immediately. Purely local (localStorage) — never written to
 * Supabase — and a no-op if any guest orders already exist on this device.
 */
export function seedDemoOrdersIfEmpty(): void {
  if (typeof window === 'undefined') return;
  if (getGuestRecentOrders().length > 0 || getLocalOrders().length > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const demoOrders: FullOrder[] = [
    {
      id: 'demo-order-necklace',
      order_number: 'SJ-849201',
      user_id: null,
      status: 'processing',
      subtotal: 125000,
      tax: 3750,
      shipping_fee: 0,
      total: 128750,
      payment_method: 'online',
      payment_status: 'paid',
      shipping_address: {
        full_name: 'Aisha Khan',
        email: 'aisha.khan@example.com',
        phone: '9876543210',
        address: '12 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
      },
      notes: null,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      paid_at: null,
      tracking_token: null,
      stock_reserved: false,
      refunded_amount: 0,
      created_at: new Date(now - 2 * day).toISOString(),
      updated_at: new Date(now - 1 * day).toISOString(),
      items: [
        {
          id: 'demo-item-necklace',
          order_id: 'demo-order-necklace',
          product_id: null,
          title: 'Royal Nizam Emerald Necklace',
          image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
          price: 125000,
          quantity: 1,
          metal: '22K Yellow Gold',
          size: null,
          created_at: new Date(now - 2 * day).toISOString(),
        },
      ],
    },
    {
      id: 'demo-order-ring',
      order_number: 'SJ-732845',
      user_id: null,
      status: 'delivered',
      subtotal: 45000,
      tax: 1350,
      shipping_fee: 0,
      total: 46350,
      payment_method: 'cod',
      payment_status: 'paid',
      shipping_address: {
        full_name: 'Rohan Mehta',
        email: 'rohan.mehta@example.com',
        phone: '9123456780',
        address: '45 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
      },
      notes: null,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      paid_at: null,
      tracking_token: null,
      stock_reserved: false,
      refunded_amount: 0,
      created_at: new Date(now - 12 * day).toISOString(),
      updated_at: new Date(now - 5 * day).toISOString(),
      items: [
        {
          id: 'demo-item-ring',
          order_id: 'demo-order-ring',
          product_id: null,
          title: 'Classic Solitaire Diamond Ring',
          image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
          price: 45000,
          quantity: 1,
          metal: '18K White Gold',
          size: '14',
          created_at: new Date(now - 12 * day).toISOString(),
        },
      ],
    },
  ];

  saveLocalOrders(demoOrders);
  saveGuestRecentOrders(
    demoOrders.map((o) => ({ orderId: o.id, orderNumber: o.order_number, createdAt: o.created_at }))
  );
}

/**
 * Admin CRM: everything a customer has done besides ordering — wishlist,
 * enquiries, reviews and internal staff notes. Sections whose tables don't
 * exist yet (migrations 009/013) simply come back empty.
 */
export interface CustomerActivity {
  wishlist: { id: string; title: string; slug: string; imageUrl: string; price: number; material: string; addedAt: string }[];
  inquiries: { id: string; category: string | null; message: string; status: string; created_at: string; admin_notes: string | null }[];
  reviews: { id: string; rating: number; title: string | null; comment: string | null; status: string; created_at: string; productTitle: string }[];
  notes: { id: string; note: string; author_email: string | null; created_at: string }[];
}

const EMPTY_ACTIVITY: CustomerActivity = { wishlist: [], inquiries: [], reviews: [], notes: [] };

export async function getCustomerActivity(email: string, userId?: string | null): Promise<CustomerActivity> {
  const supabase = createClient();
  const activity: CustomerActivity = { ...EMPTY_ACTIVITY, wishlist: [], inquiries: [], reviews: [], notes: [] };
  const lowerEmail = email.toLowerCase();

  // Wishlist (registered customers only)
  if (userId) {
    try {
      const { data: items } = await supabase
        .from('wishlist_items')
        .select('id, product_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const productIds = (items || []).map((i) => i.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, title, slug, image_url, price, material')
          .in('id', productIds);
        const byId = new Map((products || []).map((p) => [p.id, p]));
        activity.wishlist = (items || [])
          .map((i) => {
            const p = byId.get(i.product_id);
            return p
              ? {
                  id: p.id,
                  title: p.title,
                  slug: p.slug,
                  imageUrl: p.image_url,
                  price: Number(p.price),
                  material: p.material,
                  addedAt: i.created_at,
                }
              : null;
          })
          .filter((w): w is CustomerActivity['wishlist'][number] => !!w);
      }
    } catch {
      /* wishlist unavailable */
    }
  }

  try {
    const { data } = await supabase
      .from('contact_inquiries')
      .select('id, category, message, status, created_at, admin_notes')
      .ilike('email', lowerEmail)
      .order('created_at', { ascending: false });
    activity.inquiries = data || [];
  } catch {
    /* migration 009 not applied */
  }

  try {
    let query = supabase
      .from('product_reviews')
      .select('id, rating, title, comment, status, created_at, product_id')
      .order('created_at', { ascending: false });
    query = userId ? query.or(`reviewer_email.ilike.${lowerEmail},user_id.eq.${userId}`) : query.ilike('reviewer_email', lowerEmail);
    const { data: reviews } = await query;

    const productIds = (reviews || []).map((r) => r.product_id).filter(Boolean);
    let titles = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await supabase.from('products').select('id, title').in('id', productIds);
      titles = new Map((products || []).map((p) => [p.id, p.title]));
    }
    activity.reviews = (reviews || []).map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      created_at: r.created_at,
      productTitle: titles.get(r.product_id) || 'Deleted product',
    }));
  } catch {
    /* migration 009 not applied */
  }

  try {
    const { data } = await supabase
      .from('customer_notes')
      .select('id, note, author_email, created_at')
      .ilike('customer_email', lowerEmail)
      .order('created_at', { ascending: false });
    activity.notes = data || [];
  } catch {
    /* migration 013 not applied */
  }

  return activity;
}

/** Adds an internal note against a customer (admin only, enforced by RLS). */
export async function addCustomerNote(email: string, note: string, customerUserId?: string | null): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const author = auth?.user;
    if (!author) return { success: false, error: 'Sign in with an admin account to add notes.' };

    const { error } = await supabase.from('customer_notes').insert({
      customer_email: email.toLowerCase(),
      customer_user_id: customerUserId && !customerUserId.startsWith('guest:') ? customerUserId : null,
      note: note.trim(),
      author_id: author.id,
      author_email: author.email,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save the note';
    if (/does not exist|schema cache/i.test(message)) {
      return { success: false, error: 'Run migration 013_customer_crm.sql in Supabase to enable staff notes.' };
    }
    return { success: false, error: message };
  }
}

/** Deletes an internal note. */
export async function deleteCustomerNote(id: string): Promise<boolean> {
  try {
    const { error } = await createClient().from('customer_notes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
