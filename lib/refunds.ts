/**
 * Refunding an online (Razorpay) payment. Server-only: it needs the service-role database client and the
 * Razorpay keys. The route that calls it (/api/admin/orders/refund) is responsible for checking that the caller
 * is allowed to refund; everything about the refund itself is checked here.
 *
 * Order of events (so money is never refunded twice and nothing is lost if a step fails):
 *   1. insert a "pending" row in order_refunds — the database allows only ONE pending refund per order, so a
 *      double click or two admins at once can't refund the same money twice;
 *   2. ask Razorpay to refund the payment (partial or full);
 *   3. record Razorpay's refund id/status and add the amount to the order's refunded_amount, moving its payment
 *      status to "partially_refunded" or "refunded".
 * If Razorpay refuses, the row is kept as "failed" with the reason and the order is left untouched.
 */
import { round2, toPaise } from '@/lib/orderPricing';

export interface RefundDeps {
  /** Service-role Supabase client. */
  admin: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Razorpay SDK instance (only payments.refund is used). */
  razorpay: { payments: { refund: (paymentId: string, params: Record<string, unknown>) => Promise<{ id: string; status?: string; amount?: number }> } };
}

export interface RefundRequest {
  orderId: string;
  /** Rupees. Omit to refund everything that is still refundable. */
  amount?: number;
  reason?: string | null;
  /** The signed-in admin (stored on the refund record). */
  actorId: string | null;
}

export type RefundResult =
  | { ok: true; refund: { id: string; razorpayRefundId: string; amount: number; razorpayStatus: string | null }; order: { id: string; paymentStatus: 'refunded' | 'partially_refunded'; refundedAmount: number; refundable: number } }
  | { ok: false; status: number; error: string };

const MIN_REFUND = 1; // Razorpay refunds are for at least ₹1 (unless less than that is left)

function razorpayMessage(err: unknown): string {
  const e = err as { error?: { description?: string }; message?: string } | null;
  return e?.error?.description || e?.message || 'Razorpay could not process the refund.';
}

export async function refundOrderPayment({ admin, razorpay }: RefundDeps, req: RefundRequest): Promise<RefundResult> {
  const { data: order, error: loadError } = await admin
    .from('orders')
    .select('id, order_number, total, payment_method, payment_status, status, razorpay_payment_id, refunded_amount')
    .eq('id', req.orderId)
    .maybeSingle();
  if (loadError) {
    console.error('Refund: could not load the order:', loadError);
    return { ok: false, status: 500, error: 'Could not load the order.' };
  }
  if (!order) return { ok: false, status: 404, error: 'Order not found.' };

  if (order.payment_method !== 'online' || !order.razorpay_payment_id) {
    return { ok: false, status: 400, error: 'Only orders paid online through Razorpay can be refunded here.' };
  }
  if (order.payment_status === 'refunded') return { ok: false, status: 409, error: 'This order has already been fully refunded.' };
  if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') {
    return { ok: false, status: 409, error: 'Only a paid order can be refunded.' };
  }

  const total = round2(Number(order.total));
  const alreadyRefunded = round2(Number(order.refunded_amount ?? 0));
  const refundable = round2(total - alreadyRefunded);
  if (refundable <= 0) return { ok: false, status: 409, error: 'There is nothing left to refund on this order.' };

  const amount = round2(req.amount === undefined ? refundable : req.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, status: 400, error: 'Enter a valid refund amount.' };
  if (amount > refundable + 0.001) {
    return { ok: false, status: 400, error: `You can refund at most ₹${refundable.toLocaleString('en-IN')} on this order.` };
  }
  if (amount < MIN_REFUND && amount < refundable) {
    return { ok: false, status: 400, error: `The smallest refund is ₹${MIN_REFUND}.` };
  }
  const reason = req.reason?.trim().slice(0, 200) || null;

  // 1. claim the refund (one in flight per order)
  const { data: claimed, error: claimError } = await admin
    .from('order_refunds')
    .insert({ order_id: order.id, razorpay_payment_id: order.razorpay_payment_id, amount, reason, status: 'pending', created_by: req.actorId })
    .select('id')
    .maybeSingle();
  if (claimError) {
    if (claimError.code === '23505') return { ok: false, status: 409, error: 'A refund for this order is already being processed. Please wait a moment.' };
    console.error('Refund: could not record the refund:', claimError);
    return { ok: false, status: 500, error: 'Could not start the refund.' };
  }
  const refundRowId: string = claimed.id;

  // 2. Razorpay
  let rzpRefund: { id: string; status?: string; amount?: number };
  try {
    rzpRefund = await razorpay.payments.refund(order.razorpay_payment_id, {
      amount: toPaise(amount),
      speed: 'normal',
      receipt: `rf_${refundRowId.replace(/-/g, '').slice(0, 24)}`,
      notes: { order_number: order.order_number, ...(reason ? { reason } : {}) },
    });
  } catch (err) {
    const message = razorpayMessage(err);
    console.error('Refund: Razorpay refused the refund:', message);
    await admin.from('order_refunds').update({ status: 'failed', error: message.slice(0, 500) }).eq('id', refundRowId);
    return { ok: false, status: 502, error: `Razorpay could not refund this payment: ${message}` };
  }

  // 3. record it and move the order
  const newRefunded = round2(alreadyRefunded + amount);
  const fully = newRefunded >= total - 0.001;
  const paymentStatus = fully ? ('refunded' as const) : ('partially_refunded' as const);

  const { error: rowError } = await admin
    .from('order_refunds')
    .update({ status: 'processed', razorpay_refund_id: rzpRefund.id, razorpay_status: rzpRefund.status ?? null })
    .eq('id', refundRowId);
  if (rowError) console.error('Refund: Razorpay accepted it but the refund record could not be updated:', rowError, rzpRefund.id);

  const { error: orderError } = await admin
    .from('orders')
    .update({ refunded_amount: newRefunded, payment_status: paymentStatus })
    .eq('id', order.id);
  if (orderError) {
    // The money has been refunded at Razorpay; make this loud so it is reconciled by hand.
    console.error('Refund: REFUNDED AT RAZORPAY BUT THE ORDER COULD NOT BE UPDATED', { orderId: order.id, refundId: rzpRefund.id, amount }, orderError);
    return { ok: false, status: 500, error: `The refund was made at Razorpay (refund ${rzpRefund.id}) but the order could not be updated. Please update it manually.` };
  }

  return {
    ok: true,
    refund: { id: refundRowId, razorpayRefundId: rzpRefund.id, amount, razorpayStatus: rzpRefund.status ?? null },
    order: { id: order.id, paymentStatus, refundedAmount: newRefunded, refundable: round2(total - newRefunded) },
  };
}
