import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_RE = /^[A-Za-z0-9]{1,8}-[0-9]{3,12}$/;
const TOKEN_RE = /^[a-f0-9]{32}$/i;

/**
 * Lets a customer open an order from any device with the secret link from their email:
 *   GET /api/orders/track?id=<order number or id>&token=<tracking token>
 *
 * The database (rightly) lets nobody read an order they don't own, so a guest can't query it directly. Here the
 * server looks the order up by id AND token together; only someone holding the link — which carries a random
 * 128-bit token — gets anything back, and a wrong token looks exactly like a missing order. Only what the
 * tracking page needs is returned (no payment ids, no internal flags, no account id).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') ?? '').trim();
  const token = (searchParams.get('token') ?? '').trim().toLowerCase();

  const byId = UUID_RE.test(id);
  if ((!byId && !NUMBER_RE.test(id)) || !TOKEN_RE.test(token)) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot look up orders by tracking link.');
    return NextResponse.json({ error: 'Order tracking is temporarily unavailable.' }, { status: 503 });
  }

  const { data, error } = await admin
    .from('orders')
    .select(
      'id, order_number, status, subtotal, tax, shipping_fee, total, payment_method, payment_status, shipping_address, notes, created_at, updated_at, items:order_items(id, order_id, product_id, title, image_url, price, quantity, metal, size, created_at)'
    )
    .eq(byId ? 'id' : 'order_number', byId ? id.toLowerCase() : id.toUpperCase())
    .eq('tracking_token', token)
    .maybeSingle();

  if (error) {
    console.error('Order tracking lookup failed:', error);
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (!data) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  // Same shape as the rest of the app expects (FullOrder), with everything private blanked out.
  return NextResponse.json(
    {
      order: {
        ...data,
        user_id: null,
        razorpay_order_id: null,
        razorpay_payment_id: null,
        paid_at: null,
        tracking_token: null,
        stock_reserved: false,
        items: data.items ?? [],
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
