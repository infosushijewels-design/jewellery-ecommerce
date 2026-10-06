import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  SESSION_COOKIE,
  createSessionToken,
  hashOtp,
  parseGuestIdentifier,
  safeEqualHex,
  sessionCookieOptions,
} from '@/lib/guestAccess';

/**
 * POST { identifier, code }
 *
 * Checks the newest unused code for that email / number. A code is good for 10 minutes, allows 5 wrong guesses and
 * works once. On success an HttpOnly cookie is set that lets this browser read that guest's orders (and only
 * theirs) for a few hours. Wrong, expired, used and never-issued codes all answer with a plain "invalid or
 * expired" (expired is told apart only after the visitor has proved they know a code was sent).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { identifier?: unknown; code?: unknown } | null;
  const identity = parseGuestIdentifier(body?.identifier);
  const code = typeof body?.code === 'string' ? body.code.replace(/\s/g, '') : '';
  if (!identity) return NextResponse.json({ success: false, error: 'Enter the email address or mobile number you ordered with.' }, { status: 400 });
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) {
    return NextResponse.json({ success: false, error: `Enter the ${OTP_LENGTH}-digit code from your email.` }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) return NextResponse.json({ success: false, error: 'Order lookup is temporarily unavailable.' }, { status: 503 });

  const invalid = () => NextResponse.json({ success: false, error: 'Invalid OTP. Please try again.' }, { status: 401 });

  // Newest code that was actually issued for this email / number and has not been used
  const { data: rows, error } = await admin
    .from('guest_otps')
    .select('id, code_hash, attempts, expires_at, consumed_at')
    .eq('identifier', identity.value)
    .eq('kind', identity.kind)
    .not('code_hash', 'is', null)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) {
    console.error('Guest OTP verify: lookup failed:', error.message);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
  const row = rows?.[0];
  if (!row) return invalid();

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ success: false, error: 'Too many incorrect attempts. Please request a new OTP.', needNewCode: true }, { status: 429 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'This OTP has expired. Please request a new OTP.', needNewCode: true }, { status: 410 });
  }

  // Count the guess BEFORE comparing, so racing requests cannot get extra tries. (attempts is only ever raised.)
  const { data: bumped } = await admin
    .from('guest_otps')
    .update({ attempts: row.attempts + 1 })
    .eq('id', row.id)
    .eq('attempts', row.attempts)
    .select('id');
  if (!bumped || bumped.length === 0) return invalid();

  const expected = hashOtp(code, identity);
  if (!expected || !row.code_hash || !safeEqualHex(expected, row.code_hash)) {
    const left = OTP_MAX_ATTEMPTS - (row.attempts + 1);
    return NextResponse.json(
      { success: false, error: left > 0 ? `Invalid OTP. Please try again. (${left} ${left === 1 ? 'try' : 'tries'} left)` : 'Too many incorrect attempts. Please request a new OTP.', needNewCode: left <= 0 },
      { status: 401 }
    );
  }

  // Correct: burn the code (only if nobody else just did), then open the session
  const { data: consumed } = await admin
    .from('guest_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('consumed_at', null)
    .select('id');
  if (!consumed || consumed.length === 0) return invalid();

  const token = createSessionToken(identity);
  if (!token) return NextResponse.json({ success: false, error: 'Order lookup is temporarily unavailable.' }, { status: 503 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
