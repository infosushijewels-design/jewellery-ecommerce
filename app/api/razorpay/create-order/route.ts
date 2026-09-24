import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { mergeStoreSettings } from '@/lib/storeSettings';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Store settings not found' }, { status: 500 });
    }

    const settings = mergeStoreSettings(data.settings);
    const { razorpayKeyId, razorpayKeySecret } = settings.payments;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({ error: 'Online payments are currently disabled.' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Razorpay amount is in paise (multiply INR by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      keyId: razorpayKeyId, // Need to send keyId back for the frontend to initialize
    });
  } catch (err: any) {
    console.error('Razorpay Error:', err);
    return NextResponse.json({ error: 'Could not create payment order.' }, { status: 500 });
  }
}
