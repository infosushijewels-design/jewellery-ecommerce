import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { mergeStoreSettings } from '@/lib/storeSettings';
import { parseOrderRequest } from '@/lib/orderPayload';
import { priceOrder, toPaise, type CatalogProduct } from '@/lib/orderPricing';

/**
 * Places an order. The browser sends only WHICH products, HOW MANY and the delivery details; the server:
 *   1. prices the cart from the catalogue and the store settings (the browser can't change what it pays);
 *   2. saves the order (status "placed", payment "pending") and its items — for guests and signed-in
 *      customers alike;
 *   3. for online payment, creates the Razorpay order for exactly the server-calculated total and links it to
 *      the order. The order is marked paid later, by /api/razorpay/verify-payment, once Razorpay confirms it.
 * The customer's identity comes from their session, never from the request body.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = parseOrderRequest(body);
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  const request_ = parsed.data;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot save orders.');
    return NextResponse.json({ success: false, error: 'Orders are temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }

  // Who is ordering comes from the session cookie; guests simply have no user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Abandoned online checkouts (never paid within an hour) give their stock back before we look at stock.
  const { error: staleError } = await admin.rpc('cancel_stale_online_orders', { p_minutes: 60 });
  if (staleError) console.error('Could not release stale unpaid orders:', staleError);

  // ---- 1. price the cart from the catalogue ----
  const { data: settingsRow } = await admin.from('store_settings').select('settings').eq('id', 1).maybeSingle();
  const settings = mergeStoreSettings(settingsRow?.settings);

  const productIds = Array.from(new Set(request_.items.map((i) => i.productId)));
  const { data: productRows, error: productsError } = await admin.from('products').select('id, title, price, stock, image_url').in('id', productIds);
  if (productsError) {
    console.error('Could not load products to price the order:', productsError);
    return NextResponse.json({ success: false, error: 'We could not price your order. Please try again.' }, { status: 500 });
  }
  const catalog = new Map<string, CatalogProduct>(
    (productRows ?? []).map((p: { id: string; title: string; price: number | string; stock: number | null; image_url: string | null }) => [
      p.id,
      { id: p.id, title: p.title, price: Number(p.price), stock: Number(p.stock ?? 0), image_url: p.image_url },
    ])
  );
  const priced = priceOrder(request_.items, catalog, settings, request_.paymentMethod);
  if (!priced.ok) return NextResponse.json({ success: false, error: priced.error }, { status: 400 });
  const order = priced.order;

  // Online payment needs the gateway keys: fail before saving anything if they aren't there.
  let gateway: { key_id: string; key_secret: string } | null = null;
  if (request_.paymentMethod === 'online') {
    const { data: credentials } = await admin.from('razorpay_credentials').select('key_id, key_secret').eq('id', 1).maybeSingle();
    if (!credentials?.key_id || !credentials?.key_secret) {
      return NextResponse.json({ success: false, error: 'Online payments are not configured yet.' }, { status: 503 });
    }
    gateway = credentials;
  }

  // ---- 2. save the order ----
  const rawPrefix = settings.orders.numberPrefix.trim().toUpperCase();
  const prefix = /^[A-Z0-9]{1,6}$/.test(rawPrefix) ? rawPrefix : 'SJ';

  const orderId = randomUUID();
  // Secret for the customer's tracking link (/orders/<number>?t=<token>): lets a guest open the order on any device.
  const trackingToken = randomUUID().replace(/-/g, '');
  let orderNumber = '';
  let created = false;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    // order_number is UNIQUE: on the rare clash, try again with a different number.
    orderNumber = `${prefix}-${String(Date.now() + attempt * 7919 + Math.floor(Math.random() * 1000)).slice(-6)}`;
    const { error } = await admin.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      tracking_token: trackingToken,
      user_id: userId,
      status: 'placed',
      subtotal: order.subtotal,
      tax: order.tax,
      shipping_fee: order.shippingFee,
      total: order.total,
      payment_method: request_.paymentMethod,
      payment_status: 'pending',
      shipping_address: {
        full_name: request_.shipping.fullName,
        email: request_.shipping.email,
        phone: request_.shipping.phone,
        address: request_.shipping.address,
        city: request_.shipping.city,
        state: request_.shipping.state,
        pincode: request_.shipping.pincode,
      },
      notes: request_.notes,
    });
    if (!error) {
      created = true;
    } else if (error.code !== '23505') {
      console.error('Failed to save order:', error);
      return NextResponse.json({ success: false, error: 'We could not save your order. Please try again.' }, { status: 500 });
    }
  }
  if (!created) {
    return NextResponse.json({ success: false, error: 'We could not save your order. Please try again.' }, { status: 500 });
  }

  const removeOrder = async (why: string) => {
    const { error: cleanupError } = await admin.from('orders').delete().eq('id', orderId);
    if (cleanupError) console.error(`Could not remove the incomplete order ${orderId} (${why}):`, cleanupError);
  };

  const { error: itemsError } = await admin.from('order_items').insert(
    order.lines.map((line) => ({
      order_id: orderId,
      product_id: line.productId,
      title: line.title,
      image_url: line.imageUrl,
      price: line.price,
      quantity: line.quantity,
      metal: line.metal,
      size: line.size,
    }))
  );
  if (itemsError) {
    console.error('Failed to save order items — removing the order so none is left without items:', itemsError);
    await removeOrder('items failed');
    return NextResponse.json({ success: false, error: 'We could not save your order. Please try again.' }, { status: 500 });
  }

  // Take the stock for these items. This is atomic and safe against two buyers at once: if any item has just run
  // out, nothing is taken and the order is removed. (Removing an order that holds stock gives it back.)
  const { error: reserveError } = await admin.rpc('reserve_order_stock', { p_order_id: orderId });
  if (reserveError) {
    await removeOrder('stock could not be reserved');
    if (reserveError.code === 'P0001') {
      return NextResponse.json(
        { success: false, error: 'Sorry, one of the items in your bag has just sold out. Please review your bag and try again.' },
        { status: 409 }
      );
    }
    console.error('Could not reserve stock:', reserveError);
    return NextResponse.json({ success: false, error: 'We could not save your order. Please try again.' }, { status: 500 });
  }

  const summary = { subtotal: order.subtotal, tax: order.tax, shippingFee: order.shippingFee, total: order.total, items: order.lines };

  // ---- 3. online payment: open a Razorpay order for exactly this total and link it ----
  if (gateway) {
    try {
      const razorpay = new Razorpay({ key_id: gateway.key_id, key_secret: gateway.key_secret });
      const rzpOrder = await razorpay.orders.create({
        amount: toPaise(order.total),
        currency: 'INR',
        receipt: orderNumber,
        // internal_order_id is the key the Razorpay webhook handler looks for to find our order.
        notes: { internal_order_id: orderId, order_id: orderId, order_number: orderNumber },
      });
      const { error: linkError } = await admin.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', orderId);
      if (linkError) throw linkError;

      return NextResponse.json(
        {
          success: true,
          orderId,
          orderNumber,
          trackingToken,
          order: summary,
          razorpay: { id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, keyId: gateway.key_id },
        },
        { status: 201 }
      );
    } catch (err) {
      console.error('Could not start the Razorpay payment:', err);
      await removeOrder('payment could not be started');
      return NextResponse.json({ success: false, error: 'We could not start the payment. Please try again.' }, { status: 502 });
    }
  }

  return NextResponse.json({ success: true, orderId, orderNumber, trackingToken, order: summary }, { status: 201 });
}
