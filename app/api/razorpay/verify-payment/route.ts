import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { toPaise } from '@/lib/orderPricing';

/**
 * Marks an order paid — only once Razorpay itself confirms the payment.
 *
 * Razorpay Checkout's `handler` fires from client-side JavaScript, which anyone could call from dev tools
 * without paying. So "paid" is decided here, in three steps:
 *   1. the signature (HMAC of `order_id|payment_id` with the account's secret) proves the ids came from
 *      Razorpay;
 *   2. the order is found by its Razorpay order id — it was created by /api/orders for the server-priced total;
 *   3. the payment is fetched from Razorpay and must belong to that order, be in INR, be authorised/captured
 *      and be for exactly the order total. Only then is the order marked paid.
 * A payment id can be attached to only one order (UNIQUE column), and repeating a verification is harmless.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ verified: false, error: 'Invalid request.' }, { status: 400 });
  }

  const rzpOrderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';
  if (!/^order_[A-Za-z0-9]{6,40}$/.test(rzpOrderId) || !/^pay_[A-Za-z0-9]{6,40}$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return NextResponse.json({ verified: false, error: 'Missing or invalid payment details' }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot verify Razorpay payment.');
    return NextResponse.json({ verified: false, error: 'Payment verification is not configured' }, { status: 500 });
  }
  const { data: credentials } = await admin.from('razorpay_credentials').select('key_id, key_secret').eq('id', 1).maybeSingle();
  if (!credentials?.key_id || !credentials?.key_secret) {
    return NextResponse.json({ verified: false, error: 'Payment verification is not configured' }, { status: 500 });
  }

  // 1. signature
  if (!Razorpay.validateWebhookSignature(`${rzpOrderId}|${paymentId}`, signature, credentials.key_secret)) {
    console.error('Razorpay signature mismatch', { rzpOrderId, paymentId });
    return NextResponse.json({ verified: false, error: 'Payment could not be verified' }, { status: 400 });
  }

  // 2. the order this payment is for
  const { data: order } = await admin
    .from('orders')
    .select('id, order_number, total, status, payment_status, razorpay_payment_id')
    .eq('razorpay_order_id', rzpOrderId)
    .maybeSingle();
  if (!order) {
    console.error('Verified payment for an unknown order', { rzpOrderId, paymentId });
    return NextResponse.json({ verified: false, error: 'No order found for this payment' }, { status: 404 });
  }

  // Already marked paid: the same payment again is fine (e.g. a retry), a different payment is not.
  if (order.payment_status === 'paid') {
    if (order.razorpay_payment_id === paymentId) {
      return NextResponse.json({ verified: true, orderId: order.id, orderNumber: order.order_number });
    }
    console.error('A second payment was offered for an already-paid order', { orderId: order.id, paymentId });
    return NextResponse.json({ verified: false, error: 'This order has already been paid' }, { status: 409 });
  }

  // An unpaid online order is cancelled (and its stock released) after an hour. A payment that arrives after that
  // can't be attached to it: the customer is told, and an admin can refund the payment from the order screen.
  if (order.status === 'cancelled') {
    console.error('Payment arrived for an expired/cancelled order', { orderId: order.id, paymentId });
    return NextResponse.json(
      { verified: false, error: 'This order expired before the payment was completed. If money was debited it will be refunded — please contact support with your payment ID.' },
      { status: 409 }
    );
  }

  // 3. ask Razorpay what really happened
  try {
    const razorpay = new Razorpay({ key_id: credentials.key_id, key_secret: credentials.key_secret });
    const payment = await razorpay.payments.fetch(paymentId);
    const good =
      payment.order_id === rzpOrderId &&
      payment.currency === 'INR' &&
      (payment.status === 'captured' || payment.status === 'authorized') &&
      Number(payment.amount) === toPaise(Number(order.total));
    if (!good) {
      console.error('Razorpay payment does not match the order', {
        orderId: order.id,
        paymentId,
        paymentOrderId: payment.order_id,
        status: payment.status,
        amount: payment.amount,
        expected: toPaise(Number(order.total)),
      });
      return NextResponse.json({ verified: false, error: 'Payment could not be verified' }, { status: 400 });
    }
  } catch (err) {
    console.error('Could not fetch the payment from Razorpay:', err);
    return NextResponse.json({ verified: false, error: 'Payment could not be verified' }, { status: 502 });
  }

  const { data: updated, error: updateError } = await admin
    .from('orders')
    .update({ payment_status: 'paid', razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('payment_status', 'pending')
    .select('id');
  if (updateError) {
    // 23505: this payment id is already attached to another order.
    const duplicate = updateError.code === '23505';
    console.error('Could not mark the order paid:', updateError);
    return NextResponse.json(
      { verified: false, error: duplicate ? 'This payment was already used for another order' : 'Payment received but the order could not be updated' },
      { status: duplicate ? 409 : 500 }
    );
  }
  if (!updated?.length) {
    // Lost a race with a parallel verification of the same payment: that is fine, report the current state.
    const { data: current } = await admin.from('orders').select('payment_status, razorpay_payment_id').eq('id', order.id).maybeSingle();
    if (current?.payment_status === 'paid' && current.razorpay_payment_id === paymentId) {
      return NextResponse.json({ verified: true, orderId: order.id, orderNumber: order.order_number });
    }
    return NextResponse.json({ verified: false, error: 'Payment could not be verified' }, { status: 409 });
  }

  return NextResponse.json({ verified: true, orderId: order.id, orderNumber: order.order_number });
}
