import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getPublicStoreSettings } from '@/lib/supabase/public';
import {
  generateOrderEmailHtml,
  generateOrderEmailText,
  orderEmailSubject,
  type OrderEmailAudience,
  type OrderEmailBrand,
  type OrderEmailData,
  type OrderEmailItem,
} from '@/lib/orderEmails';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ITEMS = 50;

const isMoney = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e9;
const optText = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Validates the untrusted JSON posted by the checkout page. Everything is length/type-checked here
 * and HTML-escaped again in the template, so a crafted request can't inject markup into an email.
 */
function parseOrderPayload(raw: unknown): { ok: true; data: OrderEmailData } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid request.' };
  const b = raw as Record<string, unknown>;

  const orderId = optText(b.orderId, 100);
  if (!orderId) return { ok: false, error: 'Missing order id.' };

  const email = typeof b.email === 'string' ? b.email.trim() : '';
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: 'A valid customer email is required.' };

  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > MAX_ITEMS) return { ok: false, error: 'Order items are required.' };
  const items: OrderEmailItem[] = [];
  for (const entry of b.items) {
    const it = (entry ?? {}) as Record<string, unknown>;
    const title = optText(it.title, 200);
    const quantity = it.quantity;
    if (!title || !isMoney(it.price) || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return { ok: false, error: 'Invalid order item.' };
    }
    items.push({ title, price: it.price, quantity, metal: optText(it.metal, 100), size: optText(it.size, 50) });
  }

  if (!isMoney(b.total)) return { ok: false, error: 'Invalid order total.' };

  return {
    ok: true,
    data: {
      orderId,
      orderNumber: optText(b.orderNumber, 60),
      customerName: optText(b.firstName, 100) ?? optText(b.customerName, 100) ?? 'Valued Patron',
      customerEmail: email,
      items,
      subtotal: isMoney(b.subtotal) ? b.subtotal : items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      shippingFee: isMoney(b.shippingFee) ? b.shippingFee : null,
      tax: isMoney(b.tax) ? b.tax : null,
      total: b.total,
      paymentMethod: optText(b.paymentMethod, 30),
    },
  };
}

export async function POST(request: Request) {
  // Constructing `new Resend(...)` at module scope throws immediately if the key is missing, which used to
  // crash the entire production build (every route is imported once during `next build`). Creating it lazily,
  // inside the handler, means the app builds and runs fine before Resend credentials exist — this route just
  // answers 503 until they're added.
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set — skipping order confirmation email.');
    return NextResponse.json({ success: false, error: 'Email service is not configured yet.' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = parseOrderPayload(body);
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  const order = parsed.data;

  try {
    // Sender, links and contact details are all configurable — nothing brand-specific is hardcoded below.
    const from = process.env.RESEND_FROM_EMAIL || 'Sushi Jewels <onboarding@resend.dev>';
    const settings = await getPublicStoreSettings();
    const brand: OrderEmailBrand = {
      storeName: settings.store.name || 'Sushi Jewels',
      storeUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sushijewels.in',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@sushijewels.com',
      helpline: settings.contact.phone,
    };

    const send = (to: string, audience: OrderEmailAudience) =>
      resend.emails.send({
        from,
        to: [to],
        subject: orderEmailSubject(order, audience),
        html: generateOrderEmailHtml(order, brand, audience),
        text: generateOrderEmailText(order, brand, audience),
      });

    const adminEmail = process.env.ORDER_ADMIN_EMAIL?.trim();
    const [customerResult, adminResult] = await Promise.allSettled([
      send(order.customerEmail, 'customer'),
      adminEmail ? send(adminEmail, 'admin') : Promise.resolve(null),
    ]);

    // The admin copy is a nice-to-have: log a failure, never fail the customer's confirmation over it.
    if (adminResult.status === 'rejected') console.error('Order admin alert failed:', adminResult.reason);
    else if (adminResult.value?.error) console.error('Order admin alert rejected by Resend:', adminResult.value.error);

    if (customerResult.status === 'rejected') {
      console.error('Send Email Route Error:', customerResult.reason);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
    if (customerResult.value.error) {
      console.error('Resend API Error:', customerResult.value.error);
      return NextResponse.json({ success: false, error: customerResult.value.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: customerResult.value.data });
  } catch (error) {
    console.error('Send Email Route Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
