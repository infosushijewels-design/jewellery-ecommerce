/**
 * Server-side pricing of an order. The browser only says WHICH products and HOW MANY; every price, the tax,
 * the shipping fee and the total are worked out here from the catalogue and the store settings, so a
 * customer can no longer change what they pay by editing the request. Pure functions: no network, no env.
 */
import { shippingFeeFor, type StoreSettings } from '@/lib/storeSettings';

export interface CatalogProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  image_url: string | null;
}

export interface RequestedLine {
  productId: string;
  quantity: number;
  metal: string | null;
  size: string | null;
}

export interface PricedLine {
  productId: string;
  title: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  metal: string | null;
  size: string | null;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
}

export type PricingResult = { ok: true; order: PricedOrder } | { ok: false; error: string };

/** Rupees to 2 decimals (the orders table stores NUMERIC(10,2)). */
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Razorpay wants whole paise. */
export const toPaise = (rupees: number) => Math.round(rupees * 100);

export function priceOrder(
  requested: RequestedLine[],
  catalog: Map<string, CatalogProduct>,
  settings: StoreSettings,
  paymentMethod: 'cod' | 'online'
): PricingResult {
  if (requested.length === 0) return { ok: false, error: 'Your bag is empty.' };

  // Stock is checked per product across all of its lines (e.g. two sizes of the same ring).
  const wanted = new Map<string, number>();
  for (const line of requested) wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity);

  for (const [productId, quantity] of wanted) {
    const product = catalog.get(productId);
    if (!product || !(Number(product.price) > 0)) {
      return { ok: false, error: 'An item in your bag is no longer available. Please remove it and try again.' };
    }
    if (product.stock <= 0) return { ok: false, error: `${product.title} is sold out. Please remove it from your bag.` };
    if (quantity > product.stock) {
      return { ok: false, error: `Only ${product.stock} of ${product.title} ${product.stock === 1 ? 'is' : 'are'} left. Please reduce the quantity.` };
    }
  }

  const lines: PricedLine[] = requested.map((line) => {
    const product = catalog.get(line.productId) as CatalogProduct;
    return {
      productId: product.id,
      title: product.title,
      imageUrl: product.image_url,
      price: round2(Number(product.price)),
      quantity: line.quantity,
      metal: line.metal,
      size: line.size,
    };
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const tax = round2(subtotal * (settings.commerce.gstRate / 100));
  const shippingFee = round2(shippingFeeFor(subtotal, settings));
  const total = round2(subtotal + tax + shippingFee);

  // Store rules from Admin → Settings, enforced here as well as on the checkout screen.
  const { minOrderValue } = settings.orders;
  if (minOrderValue > 0 && subtotal < minOrderValue) {
    return { ok: false, error: `The minimum order value is ₹${minOrderValue.toLocaleString('en-IN')}.` };
  }
  const { codEnabled, codMaxOrderValue, onlineEnabled } = settings.payments;
  if (paymentMethod === 'cod' && !(codEnabled && (codMaxOrderValue <= 0 || total <= codMaxOrderValue))) {
    return { ok: false, error: 'Cash on delivery is not available for this order. Please choose online payment.' };
  }
  if (paymentMethod === 'online' && !onlineEnabled) {
    return { ok: false, error: 'Online payments are currently disabled. Please choose cash on delivery.' };
  }

  return { ok: true, order: { lines, subtotal, tax, shippingFee, total } };
}
