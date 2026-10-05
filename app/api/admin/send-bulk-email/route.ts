import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { getPublicStoreSettings } from '@/lib/supabase/public';
import { logAudit } from '@/lib/audit';
import { BULK_AUDIENCE_LABELS, BULK_CHUNK_SIZE, renderBulkEmail, validateBulkEmail, type BulkAudience } from '@/lib/bulkEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Admin action: send a promotional / update email to many people.
 *
 *   POST { action: 'count',  audience }                       -> { total }
 *   POST { action: 'test',   audience, subject, message }     -> sends ONE copy to the signed-in admin
 *   POST { action: 'send',   audience, subject, message, chunk }
 *          sends chunk number `chunk` (0, 1, 2…) of BULK_CHUNK_SIZE recipients -> { sent, failed, total, done }
 *
 * The page calls 'send' once per chunk, so no single request runs long (important on serverless hosting) and the
 * admin sees progress. Recipients are ordered by email so the chunks line up. Each person gets their own email
 * (nobody sees anyone else's address).
 *
 * Audiences:
 *   subscribers — people who signed up in the website footer and are still subscribed
 *   customers   — every registered customer account in `profiles` (admins are never included)
 *
 * Only a signed-in admin with "Contact Inquiries → edit" permission (the section Newsletter belongs to) may use
 * this; the permission is checked by the database with the caller's own session.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
  const action = body.action;
  const audience = body.audience as BulkAudience;
  if (action !== 'count' && action !== 'test' && action !== 'send') return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  if (audience !== 'subscribers' && audience !== 'customers') return NextResponse.json({ success: false, error: 'Choose who to send to.' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });
  const { data: allowed, error: permissionError } = await supabase.rpc('has_permission', { p_module: 'inquiries', p_action: 'edit' });
  if (permissionError) console.error('Bulk email: permission check failed:', permissionError);
  if (allowed !== true) return NextResponse.json({ success: false, error: 'You do not have permission to send emails.' }, { status: 403 });

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot send bulk email.');
    return NextResponse.json({ success: false, error: 'Bulk email is not configured yet.' }, { status: 503 });
  }

  /** One page of recipients (lower-cased, de-duplicated, valid addresses only) plus the total count. */
  async function recipients(from: number, to: number) {
    const query =
      audience === 'subscribers'
        ? admin!.from('newsletter_subscribers').select('email', { count: 'exact' }).eq('status', 'subscribed')
        : admin!.from('profiles').select('email', { count: 'exact' }).eq('role', 'customer');
    const { data, count, error } = await query.order('email').range(from, to);
    if (error) throw error;
    const emails = [...new Set((data || []).map((r: { email: string | null }) => (r.email || '').trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)))];
    return { emails, total: count ?? emails.length };
  }

  try {
    if (action === 'count') {
      const { total } = await recipients(0, 0);
      return NextResponse.json({ success: true, total });
    }

    const checked = validateBulkEmail(body.subject, body.message);
    if (!checked.ok) return NextResponse.json({ success: false, error: checked.error }, { status: 400 });

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: 'Email service is not configured yet.' }, { status: 503 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || 'Sushi Jewels <orders@sushijewels.in>';
    const settings = await getPublicStoreSettings();
    const brand = {
      storeName: settings.store.name || 'Sushi Jewels',
      storeUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sushijewels.in',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@sushijewels.com',
    };
    const { html, text } = renderBulkEmail({ subject: checked.subject, message: checked.message, brand, audience });
    const headers = { 'List-Unsubscribe': `<mailto:${brand.supportEmail}?subject=unsubscribe>` };

    if (action === 'test') {
      if (!user.email) return NextResponse.json({ success: false, error: 'Your account has no email address.' }, { status: 400 });
      const { error } = await resend.emails.send({ from, to: [user.email], subject: `[Test] ${checked.subject}`, html, text, headers });
      if (error) {
        console.error('Bulk email test rejected by Resend:', error);
        return NextResponse.json({ success: false, error: 'The email service rejected the test email.' }, { status: 502 });
      }
      return NextResponse.json({ success: true, sentTo: user.email });
    }

    // action === 'send'
    const chunk = Number(body.chunk);
    if (!Number.isInteger(chunk) || chunk < 0 || chunk > 10000) return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    const start = chunk * BULK_CHUNK_SIZE;
    const { emails, total } = await recipients(start, start + BULK_CHUNK_SIZE - 1);
    const done = start + BULK_CHUNK_SIZE >= total;
    if (emails.length === 0) return NextResponse.json({ success: true, sent: 0, failed: 0, total, done: true });

    const { error } = await resend.batch.send(emails.map((to) => ({ from, to: [to], subject: checked.subject, html, text, headers })));
    if (error) {
      console.error('Bulk email batch rejected by Resend:', error);
      return NextResponse.json({ success: false, error: 'The email service rejected this batch. Nothing in it was sent.', total, done: false }, { status: 502 });
    }
    await logAudit(admin, {
      adminId: user.id,
      action: 'bulk_email',
      resourceType: 'notification',
      details: { subject: checked.subject.slice(0, 150), audience, audienceLabel: BULK_AUDIENCE_LABELS[audience], sent: emails.length, chunk, total },
    });
    return NextResponse.json({ success: true, sent: emails.length, failed: 0, total, done });
  } catch (err) {
    console.error('Bulk email error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong while sending. Please try again.' }, { status: 500 });
  }
}
