import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { refundOrderPayment } from '@/lib/refunds';
import { logAudit } from '@/lib/audit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin action: refund an online payment, in full or in part.
 *   POST { orderId, amount?, reason? }      (amount in rupees; omit to refund everything refundable)
 *
 * Only a signed-in admin with "Orders → edit" permission may do this (Super Admins always can). The permission is
 * checked by the database itself (has_permission), using the caller's own session.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  if (!UUID_RE.test(orderId)) return NextResponse.json({ success: false, error: 'Invalid order.' }, { status: 400 });
  const amount = body.amount === undefined || body.amount === null ? undefined : Number(body.amount);
  if (amount !== undefined && !Number.isFinite(amount)) return NextResponse.json({ success: false, error: 'Enter a valid refund amount.' }, { status: 400 });
  const reason = typeof body.reason === 'string' ? body.reason : null;

  // Who is asking, and are they allowed?
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });
  const { data: allowed, error: permissionError } = await supabase.rpc('has_permission', { p_module: 'orders', p_action: 'edit' });
  if (permissionError) console.error('Refund: permission check failed:', permissionError);
  if (allowed !== true) return NextResponse.json({ success: false, error: 'You do not have permission to refund orders.' }, { status: 403 });

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot refund.');
    return NextResponse.json({ success: false, error: 'Refunds are not configured yet.' }, { status: 503 });
  }
  const { data: credentials } = await admin.from('razorpay_credentials').select('key_id, key_secret').eq('id', 1).maybeSingle();
  if (!credentials?.key_id || !credentials?.key_secret) {
    return NextResponse.json({ success: false, error: 'Razorpay is not configured yet.' }, { status: 503 });
  }

  const razorpay = new Razorpay({ key_id: credentials.key_id, key_secret: credentials.key_secret });
  const result = await refundOrderPayment({ admin, razorpay }, { orderId, amount, reason, actorId: user.id });
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  await logAudit(admin, {
    adminId: user.id,
    action: 'refund',
    resourceType: 'order',
    resourceId: orderId,
    details: { amount: result.refund.amount, razorpayRefundId: result.refund.razorpayRefundId, reason: reason?.slice(0, 200) ?? null, paymentStatus: result.order.paymentStatus },
  });
  return NextResponse.json({ success: true, refund: result.refund, order: result.order });
}
