import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

/**
 * Verifies a Razorpay Checkout success callback before the order is ever
 * marked "paid". Razorpay's `handler` on the client fires whenever the
 * checkout modal reports success — but that's just client-side JavaScript,
 * which a browser's dev tools can call directly without any real payment
 * happening. The `razorpay_signature` Razorpay returns is an HMAC-SHA256 of
 * `order_id|payment_id` using the account's secret key; only Razorpay (who
 * has that secret) could have produced a signature that matches, so
 * checking it here is what actually proves the payment is genuine.
 */
export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Missing payment details' }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot verify Razorpay payment.');
      return NextResponse.json({ verified: false, error: 'Payment verification is not configured' }, { status: 500 });
    }
    const { data: credentials } = await serviceClient.from('razorpay_credentials').select('key_secret').eq('id', 1).maybeSingle();
    if (!credentials?.key_secret) {
      return NextResponse.json({ verified: false, error: 'Payment verification is not configured' }, { status: 500 });
    }

    const isValid = Razorpay.validateWebhookSignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature, credentials.key_secret);

    if (!isValid) {
      console.error('Razorpay signature mismatch', { razorpay_order_id, razorpay_payment_id });
      return NextResponse.json({ verified: false, error: 'Payment could not be verified' }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error('verify-payment route error:', err);
    return NextResponse.json({ verified: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
