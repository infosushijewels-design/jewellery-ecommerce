import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { mergeStoreSettings } from '@/lib/storeSettings';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // store_settings is public-readable (the storefront needs it), so the
    // ordinary cookie-based client is fine here even for a guest checkout.
    const supabase = await createClient();
    const { data: storeSettingsRow } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();
    const settings = mergeStoreSettings(storeSettingsRow?.settings);
    if (!settings.payments.onlineEnabled) {
      return NextResponse.json({ error: 'Online payments are currently disabled.' }, { status: 400 });
    }

    // razorpay_credentials holds a secret key, so its RLS only allows an
    // authenticated *admin* to read it — a guest checking out isn't one.
    // Reading it here needs the service role key, which bypasses RLS; see
    // lib/supabase/serviceRole.ts for why, and SUPABASE_SERVICE_ROLE_KEY in
    // .env.local for the one-time setup this depends on.
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot read Razorpay credentials.');
      return NextResponse.json({ error: 'Online payments are not configured yet.' }, { status: 400 });
    }
    const { data: credentials, error: credentialsError } = await serviceClient
      .from('razorpay_credentials')
      .select('key_id, key_secret')
      .eq('id', 1)
      .maybeSingle();

    if (credentialsError || !credentials?.key_id || !credentials?.key_secret) {
      return NextResponse.json({ error: 'Online payments are not configured yet.' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: credentials.key_id,
      key_secret: credentials.key_secret,
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
      keyId: credentials.key_id, // Need to send keyId back for the frontend to initialize
    });
  } catch (err: any) {
    console.error('Razorpay Error:', err);
    return NextResponse.json({ error: 'Could not create payment order.' }, { status: 500 });
  }
}
