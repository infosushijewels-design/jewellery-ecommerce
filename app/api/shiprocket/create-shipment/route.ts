import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createShiprocketOrder } from '@/lib/shiprocket';
import type { FullOrder } from '@/lib/supabase/orderService';

/**
 * Admin-only: creates a Shiprocket shipment for one of our orders and saves
 * the resulting AWB/tracking info back onto the order row.
 *
 * Auth: uses the cookie-based server client so RLS (`is_admin()`) enforces
 * who can read/update orders — this route double-checks the role too, so it
 * can return a clean 403 instead of a confusing empty result from RLS.
 */
export async function POST(request: Request) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const orderQuery = supabase.from('orders').select('*, items:order_items(*)');
    const { data: orderRow, error: orderError } = isUuid
      ? await orderQuery.eq('id', orderId).maybeSingle()
      : await orderQuery.eq('order_number', orderId).maybeSingle();

    if (orderError || !orderRow) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orderRow as FullOrder;

    // Idempotent: a shipment already exists for this order — return it rather
    // than creating a duplicate with Shiprocket.
    if (order.awb_code) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        shiprocketOrderId: order.shiprocket_order_id,
        shipmentId: order.shiprocket_shipment_id,
        awbCode: order.awb_code,
        courierName: order.courier_name,
        trackingUrl: order.tracking_url,
      });
    }

    const result = await createShiprocketOrder(order);

    if (!result.configured) {
      return NextResponse.json({ error: 'Shiprocket is not set up yet — add credentials in Admin → Settings → Shipping.' }, { status: 400 });
    }
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    const trackingUrl = result.data.awbCode ? `https://shiprocket.co/tracking/${result.data.awbCode}` : null;

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        shiprocket_order_id: result.data.shiprocketOrderId,
        shiprocket_shipment_id: result.data.shipmentId,
        awb_code: result.data.awbCode,
        courier_name: result.data.courierName,
        tracking_url: trackingUrl,
        shipment_status: result.data.awbCode ? 'AWB Assigned' : 'Order Created',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      // The shipment was created on Shiprocket's side even though saving it here failed —
      // surface both pieces of information so the admin isn't left guessing.
      console.error('Shiprocket shipment created but failed to save on the order:', updateError);
      return NextResponse.json(
        { error: `Shipment created (AWB ${result.data.awbCode || 'pending'}) but could not be saved: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shiprocketOrderId: result.data.shiprocketOrderId,
      shipmentId: result.data.shipmentId,
      awbCode: result.data.awbCode,
      courierName: result.data.courierName,
      trackingUrl,
    });
  } catch (err) {
    console.error('create-shipment route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
