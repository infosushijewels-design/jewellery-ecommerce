import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { validateNewsletterEmail } from '@/lib/formValidation';
import { clientIpHash, isBotSubmission, recentCount } from '@/lib/requestGuard';

/** Most sign-ups one visitor / the whole shop can make per hour. */
const LIMITS = { perIp: 5, global: 300 };

/**
 * Subscribes an email address to the newsletter ("Join the Inner Circle" in the footer).
 *
 * The form used to say "Subscribed!" without keeping anything. Now the address is stored (lower-cased, one row per
 * address) for the shop owner to see in Admin → Newsletter. Bots are ignored quietly, one visitor can only sign up
 * a handful of addresses per hour, and signing up an address that is already on the list simply succeeds again —
 * the answer is the same either way, so the form can't be used to find out who is subscribed.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (isBotSubmission({ honeypot: body.website, startedAt: body.startedAt }, Date.now(), 1500)) {
    return NextResponse.json({ success: true });
  }

  const emailInput = typeof body.email === 'string' ? body.email.slice(0, 300) : '';
  const emailError = validateNewsletterEmail(emailInput);
  if (emailError) return NextResponse.json({ success: false, error: emailError }, { status: 400 });
  const email = emailInput.trim().toLowerCase();

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot save newsletter sign-ups.');
    return NextResponse.json({ success: false, error: 'Sign-up is temporarily unavailable. Please try again later.' }, { status: 503 });
  }

  const ipHash = clientIpHash(request, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  const [fromIp, overall] = await Promise.all([
    ipHash ? recentCount(admin, 'newsletter_subscribers', { column: 'ip_hash', value: ipHash }, 60) : Promise.resolve(0),
    recentCount(admin, 'newsletter_subscribers', null, 60),
  ]);
  if (fromIp >= LIMITS.perIp || overall >= LIMITS.global) {
    return NextResponse.json({ success: false, error: 'Too many sign-ups right now. Please try again in a little while.' }, { status: 429 });
  }

  const { error } = await admin
    .from('newsletter_subscribers')
    .upsert({ email, source: 'website_footer', ip_hash: ipHash }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) {
    console.error('Failed to save newsletter subscriber:', error);
    return NextResponse.json({ success: false, error: 'Sorry, we could not sign you up. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
