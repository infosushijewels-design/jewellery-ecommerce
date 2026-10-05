import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { normalizeIndianPhone } from '@/lib/checkoutValidation';
import { CONTACT_FIELD_ORDER, firstErrorField, validateContact, type ContactValues } from '@/lib/formValidation';
import { clientIpHash, isBotSubmission, recentCount } from '@/lib/requestGuard';

/** Most messages one visitor / one email address / the whole shop can send per hour. */
const LIMITS = { perIp: 5, perEmail: 3, global: 100 };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/**
 * Saves a message from the Contact page.
 *
 * The form used to insert straight into the database from the browser, with nothing checked beyond "not empty".
 * Now it comes here, where we:
 *   1. ignore bots quietly (a hidden field real visitors never fill, and forms submitted impossibly fast) — they
 *      are told it worked so they don't adapt;
 *   2. validate every field with the same rules the page shows (name, email, phone, category, message length);
 *   3. limit how many messages one visitor, one email address and the whole shop can send per hour;
 *   4. drop an exact repeat of a message already received in the last 24 hours (double clicks, retries);
 *   5. save it with the service role (the database no longer needs to accept anonymous inserts).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (isBotSubmission({ honeypot: body.website, startedAt: body.startedAt })) {
    return NextResponse.json({ success: true });
  }

  const values: ContactValues = {
    name: text(body.name, 200),
    email: text(body.email, 300),
    phone: text(body.phone, 40),
    category: text(body.category, 60),
    message: text(body.message, 5000),
  };
  const errors = validateContact(values);
  const badField = firstErrorField(errors, CONTACT_FIELD_ORDER);
  if (badField) {
    return NextResponse.json({ success: false, error: errors[badField], field: badField, fieldErrors: errors }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot save contact messages.');
    return NextResponse.json({ success: false, error: 'Our message form is temporarily unavailable. Please email or call us instead.' }, { status: 503 });
  }

  const email = values.email.trim().toLowerCase();
  const phone = normalizeIndianPhone(values.phone) as string; // validated above
  const message = values.message.trim();
  const ipHash = clientIpHash(request, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

  const [fromIp, fromEmail, overall] = await Promise.all([
    ipHash ? recentCount(admin, 'contact_inquiries', { column: 'ip_hash', value: ipHash }, 60) : Promise.resolve(0),
    recentCount(admin, 'contact_inquiries', { column: 'email', value: email }, 60),
    recentCount(admin, 'contact_inquiries', null, 60),
  ]);
  if (fromIp >= LIMITS.perIp || fromEmail >= LIMITS.perEmail || overall >= LIMITS.global) {
    return NextResponse.json(
      { success: false, error: 'You have sent several messages in a short time. Please wait a little while before sending another, or call us.' },
      { status: 429 }
    );
  }

  // The exact same message from the same address in the last day (double click, retry): already have it.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: duplicate } = await admin
    .from('contact_inquiries')
    .select('id')
    .eq('email', email)
    .eq('message', message)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle();
  if (duplicate) return NextResponse.json({ success: true, duplicate: true });

  const { error } = await admin.from('contact_inquiries').insert({
    name: values.name.trim(),
    email,
    phone,
    category: values.category,
    message,
    ip_hash: ipHash,
  });
  if (error) {
    console.error('Failed to save contact inquiry:', error);
    return NextResponse.json({ success: false, error: 'Sorry, we could not send your message. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
