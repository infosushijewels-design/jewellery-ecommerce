import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { getPublicStoreSettings } from '@/lib/supabase/public';
import { clientIpHash, recentCount } from '@/lib/requestGuard';
import {
  OTP_LIMITS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  generateOtp,
  guestOrdersQuery,
  hashOtp,
  parseGuestIdentifier,
} from '@/lib/guestAccess';
import { otpEmailSubject, renderOtpEmail } from '@/lib/guestOtpEmail';

/**
 * POST { identifier }   — an email address or an Indian mobile number
 *
 * Emails a 6-digit code to the address used at checkout. The answer is the SAME whether or not orders exist for
 * that email / number (so this form cannot be used to find out who has shopped here); the code is only sent when
 * there is something to see. A number is never texted — we have no SMS service — the code goes to the email on
 * the orders placed with that number.
 *
 * Limits: one code per minute per email/number, 5 per hour per email/number, 10 per hour per visitor, 300 per
 * hour for the whole site. Over a limit → 429 with how long to wait.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { identifier?: unknown } | null;
  const identity = parseGuestIdentifier(body?.identifier);
  if (!identity) {
    return NextResponse.json({ success: false, error: 'Enter the email address or 10-digit mobile number you ordered with.' }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin || !process.env.RESEND_API_KEY) {
    console.error('Guest OTP unavailable: SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY is not set.');
    return NextResponse.json({ success: false, error: 'Order lookup is temporarily unavailable. Please try again later.' }, { status: 503 });
  }

  // ---- rate limits (every request is logged in guest_otps, matched or not)
  const ipHash = clientIpHash(request, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const [recentForThis, hourForThis, hourForIp, hourAll] = await Promise.all([
    recentCount(admin, 'guest_otps', { column: 'identifier', value: identity.value }, 1),
    recentCount(admin, 'guest_otps', { column: 'identifier', value: identity.value }, 60),
    ipHash ? recentCount(admin, 'guest_otps', { column: 'ip_hash', value: ipHash }, 60) : Promise.resolve(0),
    recentCount(admin, 'guest_otps', null, 60),
  ]);
  if (recentForThis >= 1) {
    return NextResponse.json(
      { success: false, error: `Please wait ${OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP.`, retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS },
      { status: 429, headers: { 'Retry-After': String(OTP_RESEND_COOLDOWN_SECONDS) } }
    );
  }
  if (hourForThis >= OTP_LIMITS.perIdentifierPerHour || hourForIp >= OTP_LIMITS.perIpPerHour || hourAll >= OTP_LIMITS.globalPerHour) {
    return NextResponse.json(
      { success: false, error: 'Too many OTP requests. Please try again in an hour.', retryAfterSeconds: 3600 },
      { status: 429, headers: { 'Retry-After': '3600' } }
    );
  }

  // ---- is there anything to show? Where should the code go?
  let target: string | null = null;
  try {
    const { data } = await guestOrdersQuery(admin, identity).order('created_at', { ascending: false }).limit(1);
    const address = (data?.[0]?.shipping_address ?? null) as { email?: string } | null;
    const candidate = identity.kind === 'email' ? identity.value : address?.email?.trim().toLowerCase();
    if (data && data.length > 0 && candidate) target = candidate;
  } catch (err) {
    console.error('Guest OTP: order lookup failed:', err);
  }

  const code = target ? generateOtp() : null;
  const codeHash = code ? hashOtp(code, identity) : null;
  const { error: logError } = await admin.from('guest_otps').insert({
    identifier: identity.value,
    kind: identity.kind,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
    ip_hash: ipHash,
  });
  if (logError) {
    console.error('Guest OTP: could not store the code:', logError.message);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  if (target && code) {
    try {
      const settings = await getPublicStoreSettings();
      const { html, text } = renderOtpEmail(code, {
        storeName: settings.store.name || 'Sushi Jewels',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@sushijewels.com',
      });
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Sushi Jewels <orders@sushijewels.in>',
        to: [target],
        subject: otpEmailSubject(),
        html,
        text,
      });
      if (error) console.error('Guest OTP email rejected by Resend:', error);
    } catch (err) {
      console.error('Guest OTP email failed:', err);
    }
  }

  return NextResponse.json({
    success: true,
    message:
      identity.kind === 'email'
        ? "We've sent a verification code to your email address."
        : 'If there are orders for this number, a verification code has been emailed to the address used at checkout.',
    expiresInMinutes: OTP_TTL_MINUTES,
    resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  });
}
