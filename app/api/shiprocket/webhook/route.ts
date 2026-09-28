import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Receives shipment status updates FROM Shiprocket's servers — there is no
 * logged-in user on this request at all, so it can't use the cookie-based
 * server client (RLS would block every read/write). Updating `orders`
 * therefore needs the Supabase **service role key**, which bypasses RLS
 * entirely. This is a highly sensitive secret:
 *   - Add it to .env.local (and your host's env vars) as SUPABASE_SERVICE_ROLE_KEY.
 *   - NEVER prefix it with NEXT_PUBLIC_ — that would ship it to every browser.
 *   - Get it from Supabase Dashboard → Project Settings → API → service_role.
 * Until that key is set, this route responds 500 without crashing the build
 * (same lazy-init pattern as the Resend routes).
 *
 * Also set SHIPROCKET_WEBHOOK_SECRET to whatever you configure as the
 * "secret" in Shiprocket's dashboard (Settings → API → Webhooks) — Shiprocket
 * echoes it back on every call so we can confirm the request really came
 * from them and not an outsider who guessed this URL.
 */
export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    const providedSecret = request.headers.get('x-api-key') || request.headers.get('x-webhook-secret');
    if (!configuredSecret || providedSecret !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot apply Shiprocket webhook update.');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const awbCode = (body.awb || body.awb_code) as string | undefined;
    const rawStatus = (body.current_status || body.shipment_status || body.status) as string | undefined;
    if (!awbCode || !rawStatus) {
      return NextResponse.json({ error: 'Missing awb or status in payload' }, { status: 400 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Shiprocket's status text varies by courier; only act on the two states
    // that matter to our own order lifecycle. Everything else still updates
    // shipment_status (shown as the raw tracking text) without touching the
    // order's main status.
    const normalized = rawStatus.toLowerCase();
    const mappedStatus = normalized.includes('deliver') ? 'delivered' : normalized.includes('transit') || normalized.includes('shipped') || normalized.includes('picked') ? 'shipped' : null;

    const { data: updatedOrders, error } = await supabaseAdmin
      .from('orders')
      .update({
        shipment_status: rawStatus,
        ...(mappedStatus ? { status: mappedStatus } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('awb_code', awbCode)
      // Never let a webhook resurrect a cancelled order.
      .neq('status', 'cancelled')
      .select('id, order_number, shipping_address, status');

    if (error) {
      console.error('Shiprocket webhook: failed to update order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!updatedOrders?.length) {
      // Not necessarily a problem — Shiprocket retries webhooks, and an AWB
      // that doesn't match any order (yet, or ever) isn't our fault.
      return NextResponse.json({ success: true, matched: false });
    }

    // Best-effort: send the existing shipped/delivered email. Never let this
    // fail the webhook response — Shiprocket only cares that we returned 2xx.
    if (mappedStatus === 'shipped' || mappedStatus === 'delivered') {
      const order = updatedOrders[0];
      const address = order.shipping_address as { full_name?: string; email?: string } | null;
      if (address?.email) {
        const origin = new URL(request.url).origin;
        fetch(`${origin}/api/send-status-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber: order.order_number,
            email: address.email,
            firstName: address.full_name?.split(' ')[0] || '',
            status: mappedStatus,
          }),
        }).catch((err) => console.error('Shiprocket webhook: failed to trigger status email', err));
      }
    }

    return NextResponse.json({ success: true, matched: true, ordersUpdated: updatedOrders.length });
  } catch (err) {
    console.error('shiprocket webhook route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
