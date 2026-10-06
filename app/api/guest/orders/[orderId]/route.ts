import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { SESSION_COOKIE, guestOrdersQuery, readSessionToken, toPublicOrder } from '@/lib/guestAccess';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_RE = /^[A-Za-z0-9]{1,8}-[0-9]{3,12}$/;

/**
 * GET — one order, by id or order number, but only if it belongs to the email / mobile this browser verified.
 * The ownership check is part of the database query itself (the order must match the verified identity), so an
 * order that is someone else's, or does not exist, gets the identical "not found".
 */
export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const id = decodeURIComponent(orderId).trim();
  const byId = UUID_RE.test(id);
  if (!byId && !NUMBER_RE.test(id)) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const identity = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!identity) return NextResponse.json({ error: 'Please verify with a code to see your orders.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const admin = createServiceRoleClient();
  if (!admin) return NextResponse.json({ error: 'Order lookup is temporarily unavailable.' }, { status: 503 });

  const { data, error } = await guestOrdersQuery(admin, identity)
    .eq(byId ? 'id' : 'order_number', byId ? id.toLowerCase() : id.toUpperCase())
    .maybeSingle();
  if (error) {
    console.error('Guest order lookup failed:', error.message);
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (!data) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  return NextResponse.json({ order: toPublicOrder(data as unknown as Record<string, unknown>) }, { headers: { 'Cache-Control': 'no-store' } });
}
