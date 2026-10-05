/**
 * Validation for the order the checkout posts to /api/orders. Pure functions (no network, no env) so the
 * rules are easy to test. The browser is untrusted: it only says WHICH products and HOW MANY, plus the
 * delivery details. It never supplies prices, totals or a payment status — the server works those out
 * (see lib/orderPricing.ts) — so any such fields in the request are simply ignored.
 */
import { normalizeIndianPhone, validateCheckout, type CheckoutField } from '@/lib/checkoutValidation';
import type { RequestedLine } from '@/lib/orderPricing';

export interface ParsedOrder {
  shipping: { fullName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string };
  items: RequestedLine[];
  paymentMethod: 'cod' | 'online';
  /** The customer's own note. */
  notes: string | null;
}

export type ParseResult = { ok: true; data: ParsedOrder } | { ok: false; error: string };

export const MAX_ORDER_ITEMS = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export function parseOrderRequest(raw: unknown): ParseResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid request.' };
  const b = raw as Record<string, unknown>;

  // ---- delivery details: the same rules the checkout form enforces ----
  const s = (b.shippingAddress ?? {}) as Record<string, unknown>;
  const fullName = text(s.fullName, 101) ?? '';
  const [first = '', ...rest] = fullName.split(/\s+/);
  const values = {
    email: typeof s.email === 'string' ? s.email : '',
    phone: typeof s.phone === 'string' ? s.phone : '',
    firstName: first,
    lastName: rest.join(' '),
    address: typeof s.address === 'string' ? s.address : '',
    city: typeof s.city === 'string' ? s.city : '',
    state: typeof s.state === 'string' ? s.state : '',
    pincode: typeof s.pincode === 'string' ? s.pincode : '',
  };
  const problems = validateCheckout(values);
  const firstProblem = (Object.keys(problems) as CheckoutField[])[0];
  if (firstProblem) return { ok: false, error: problems[firstProblem] as string };
  const phone = normalizeIndianPhone(values.phone);
  if (!phone) return { ok: false, error: 'Enter a valid 10-digit mobile number.' };

  // ---- items: product + quantity (+ the chosen metal and size) ----
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > MAX_ORDER_ITEMS) {
    return { ok: false, error: 'Your order has no valid items.' };
  }
  const items: RequestedLine[] = [];
  for (const entry of b.items) {
    const it = (entry ?? {}) as Record<string, unknown>;
    const quantity = it.quantity;
    if (typeof it.productId !== 'string' || !UUID_RE.test(it.productId) || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return { ok: false, error: 'One of the items in your bag is invalid. Please remove it and try again.' };
    }
    items.push({ productId: it.productId.toLowerCase(), quantity, metal: text(it.metal, 100), size: text(it.size, 50) });
  }

  if (b.paymentMethod !== 'cod' && b.paymentMethod !== 'online') return { ok: false, error: 'Invalid payment method.' };

  return {
    ok: true,
    data: {
      shipping: {
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email.trim(),
        phone,
        address: values.address.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        pincode: values.pincode.trim(),
      },
      items,
      paymentMethod: b.paymentMethod,
      notes: text(b.notes, 1000),
    },
  };
}
