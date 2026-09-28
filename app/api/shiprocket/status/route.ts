import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isShiprocketConfigured } from '@/lib/shiprocket';

/**
 * Admin-only: tells the Orders page/drawer whether it's safe to enable the
 * "Create Shipment" button, without exposing the credentials themselves.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ configured: false }, { status: 401 });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ configured: false }, { status: 403 });
    }

    return NextResponse.json({ configured: await isShiprocketConfigured() });
  } catch (err) {
    console.error('shiprocket status route error:', err);
    return NextResponse.json({ configured: false }, { status: 500 });
  }
}
