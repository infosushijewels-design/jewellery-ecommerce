import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { SESSION_COOKIE, guestOrdersQuery, maskEmail, readSessionToken, toPublicOrder } from '@/lib/guestAccess';

/**
 * GET — every order placed without an account for the email / mobile this browser has verified with a code.
 * No verified session → 401 (nothing is revealed). The server never takes an email, mobile or id from the request.
 */
export async function GET() {
  const identity = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!identity) return NextResponse.json({ error: 'Please verify with a code to see your orders.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const admin = createServiceRoleClient();
  if (!admin) return NextResponse.json({ error: 'Order lookup is temporarily unavailable.' }, { status: 503 });

  const { data, error } = await guestOrdersQuery(admin, identity).order('created_at', { ascending: false }).limit(100);
  if (error) {
    console.error('Guest orders lookup failed:', error.message);
    return NextResponse.json({ error: 'We could not load your orders. Please try again.' }, { status: 500 });
  }
  return NextResponse.json(
    {
      verifiedAs: identity.kind === 'email' ? maskEmail(identity.value) : `+91 ******${identity.value.slice(-4)}`,
      orders: (data ?? []).map((row) => toPublicOrder(row as unknown as Record<string, unknown>)),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
