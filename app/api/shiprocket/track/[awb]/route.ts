import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackShipment } from '@/lib/shiprocket';

/**
 * Admin-only for now: returns live Shiprocket tracking for an AWB number.
 * Not exposed to customers yet — doing that safely means first checking the
 * requester actually owns the order for this AWB (via /orders/[id]), which
 * isn't wired up here. Keeping this route admin-gated avoids leaking one
 * customer's shipment status to another via a guessed AWB number.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ awb: string }> }) {
  try {
    const { awb } = await params;
    if (!awb) {
      return NextResponse.json({ error: 'awb is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const result = await trackShipment(awb);

    if (!result.configured) {
      return NextResponse.json({ error: 'Shiprocket is not set up yet — add credentials in Admin → Settings → Shipping.' }, { status: 400 });
    }
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, ...result.data });
  } catch (err) {
    console.error('track route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
