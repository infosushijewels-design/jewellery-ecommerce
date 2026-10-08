import { Resend } from 'resend';
import { formatSlot } from '@/lib/appointments';

/**
 * Transactional emails for Video Appointments. Server-only (uses RESEND_API_KEY).
 * Like the order emails, Resend is created lazily so a missing key never breaks
 * the build — callers just get `{ sent: false }` back.
 */

export type AppointmentEmailKind = 'received' | 'admin_alert' | 'confirmed' | 'reminder_1d' | 'reminder_30m' | 'followup' | 'cancelled';

export interface AppointmentEmailData {
  customer_name: string;
  email: string;
  phone: string;
  topic: string;
  message: string | null;
  scheduled_at: string;
  meet_link: string | null;
  /** Zoom passcode, when the meeting has one. */
  zoom_passcode?: string | null;
}

export interface SendResult {
  sent: boolean;
  error?: string;
  /** HTTP status Resend answered with, when it answered. */
  statusCode?: number | null;
  /** True when Resend refused because the account is still in sandbox (no verified domain). */
  sandboxRestricted?: boolean;
}

const DEFAULT_FROM = 'Sushi Jewels <onboarding@resend.dev>';

// Resend's shared "onboarding@resend.dev" sender is a sandbox: it can only deliver to the Resend account
// owner's own address. Once a domain is verified in Resend, set RESEND_FROM_EMAIL
// (e.g. "Sushi Jewels <appointments@sushijewels.in>"). Read per call so a changed env is picked up on restart.
const getFrom = () => process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;

/** Resend's wording when an account without a verified domain mails someone other than its owner. */
const SANDBOX_ERROR_RE = /only send testing emails|verify a domain|own email address/i;

function logResendFailure(kind: AppointmentEmailKind, to: string, from: string, error: { message?: string; name?: string; statusCode?: number | null }) {
  const status = error.statusCode ?? 'n/a';
  const sandbox = (error.statusCode === 403 || error.statusCode === 422) && SANDBOX_ERROR_RE.test(error.message ?? '');
  console.error(
    `[appointment-email] FAILED kind="${kind}" to="${to}" from="${from}" status=${status} name="${error.name ?? 'unknown'}" message="${error.message ?? ''}"`
  );
  if (sandbox) {
    console.error(
      [
        '[appointment-email] RESEND SANDBOX RESTRICTION — this is not a code bug.',
        `  Resend only lets an account without a verified domain send to its own owner's address; "${to}" was refused.`,
        `  Current sender: ${from}${from.includes('resend.dev') ? '  (the shared sandbox sender)' : ''}`,
        '  Fix: verify your domain at https://resend.com/domains, then set',
        '       RESEND_FROM_EMAIL=Sushi Jewels <appointments@sushijewels.in>  in .env.local (and on the live host) and restart.',
        "  Until then, test with the Resend account owner's own email address.",
      ].join('\n')
    );
  }
  return sandbox;
}

function esc(value: string | null | undefined) {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(inner: string) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 24px 0 16px;">
        <a href="https://www.sushijewels.in" target="_blank" style="text-decoration: none; display: inline-block;">
          <img
            src="https://www.sushijewels.in/logo.jpeg"
            alt="Sushi Jewels"
            width="120"
            border="0"
            style="display: block; margin: 0 auto 10px auto; max-width: 120px; height: auto; border: 0; outline: none; text-decoration: none;"
          />
        </a>
        <h1 style="color: #2D2024; font-family: Georgia, serif; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; margin: 0;">Sushi Jewels</h1>
        <div style="color: #B99A62; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px;">Fine Jewellery</div>
      </div>
      <div style="background-color: #fcfcfc; padding: 30px; border-radius: 8px; border: 1px solid #f0f0f0;">
        ${inner}
      </div>
      <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Sushi Jewels. All rights reserved.</p>
      </div>
    </div>`;
}

function button(href: string, label: string) {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${esc(href)}" style="background-color: #B99A62; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">${esc(label)}</a>
    </div>`;
}

function detailsTable(a: AppointmentEmailData) {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr><td style="padding: 8px 0; color: #666; width: 110px;">When</td><td style="padding: 8px 0;"><strong>${esc(formatSlot(a.scheduled_at))}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Topic</td><td style="padding: 8px 0;">${esc(a.topic)}</td></tr>
    </table>`;
}

function build(kind: AppointmentEmailKind, a: AppointmentEmailData, extra?: { followupMessage?: string; adminEmail?: string }) {
  const first = esc(a.customer_name.split(' ')[0] || 'there');
  const join = a.meet_link
    ? button(a.meet_link, 'Join Zoom Meeting') +
      (a.zoom_passcode ? `<p style="text-align: center; color: #666; font-size: 14px; margin-top: -12px;">Passcode: <strong>${esc(a.zoom_passcode)}</strong></p>` : '')
    : '';

  switch (kind) {
    case 'received':
      return {
        to: a.email,
        subject: 'We received your video appointment request',
        html: layout(`
          <h2 style="margin-top: 0;">Hi ${first}, thank you!</h2>
          <p>We&apos;ve received your request for a personalised video consultation. Our concierge will confirm your slot shortly, and you&apos;ll get a second email with your Zoom meeting link.</p>
          ${detailsTable(a)}
          <p style="color: #666; font-size: 14px;">Need to change the time? Just reply to this email.</p>`),
      };
    case 'admin_alert':
      return {
        to: extra?.adminEmail || '',
        subject: `New video appointment request — ${a.customer_name}`,
        html: layout(`
          <h2 style="margin-top: 0;">New appointment request</h2>
          ${detailsTable(a)}
          <p style="font-size: 14px;"><strong>${esc(a.customer_name)}</strong><br/>${esc(a.email)}<br/>${esc(a.phone)}</p>
          ${a.message ? `<p style="font-size: 14px; color: #555; white-space: pre-line;">${esc(a.message)}</p>` : ''}
          <p style="color: #666; font-size: 14px;">Confirm it from Admin → Video Appointments.</p>`),
      };
    case 'confirmed':
      return {
        to: a.email,
        subject: 'Your video appointment is confirmed',
        html: layout(`
          <h2 style="margin-top: 0;">You&apos;re confirmed, ${first}!</h2>
          <p>Your personalised video consultation with Sushi Jewels is booked.</p>
          ${detailsTable(a)}
          ${join}
          <p style="color: #666; font-size: 14px; line-height: 1.6;">Join a minute or two early with a stable connection. We&apos;ll send a reminder the day before and 30 minutes before the call.</p>`),
      };
    case 'reminder_1d':
      return {
        to: a.email,
        subject: 'Reminder: your video appointment is coming up',
        html: layout(`
          <h2 style="margin-top: 0;">See you soon, ${first}</h2>
          <p>A quick reminder that your video consultation is within the next 24 hours.</p>
          ${detailsTable(a)}
          ${join}`),
      };
    case 'reminder_30m':
      return {
        to: a.email,
        subject: 'Your video appointment starts in 30 minutes',
        html: layout(`
          <h2 style="margin-top: 0;">Starting soon, ${first}</h2>
          <p>Your video consultation begins in about 30 minutes.</p>
          ${detailsTable(a)}
          ${join}`),
      };
    case 'followup':
      return {
        to: a.email,
        subject: 'Thank you for your video consultation',
        html: layout(`
          <h2 style="margin-top: 0;">Thank you, ${first}!</h2>
          <p>It was lovely speaking with you. Here&apos;s a little follow-up from our team:</p>
          <p style="font-size: 14px; line-height: 1.7; white-space: pre-line; background: #fff; border: 1px solid #eee; border-radius: 6px; padding: 14px;">${esc(extra?.followupMessage)}</p>
          <p style="color: #666; font-size: 14px;">Reply to this email any time if you&apos;d like to take this further.</p>`),
      };
    case 'cancelled':
      return {
        to: a.email,
        subject: 'Your video appointment was cancelled',
        html: layout(`
          <h2 style="margin-top: 0;">Hi ${first},</h2>
          <p>Your video appointment for the slot below has been cancelled.</p>
          ${detailsTable(a)}
          <p style="color: #666; font-size: 14px;">We&apos;d be happy to find another time — you can book a new slot on our website or simply reply to this email.</p>`),
      };
  }
}

export async function sendAppointmentEmail(
  kind: AppointmentEmailKind,
  appointment: AppointmentEmailData,
  extra?: { followupMessage?: string; adminEmail?: string }
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY is not set — skipping "${kind}" appointment email.`);
    return { sent: false, error: 'Email service is not configured yet.' };
  }
  const message = build(kind, appointment, extra);
  if (!message.to) return { sent: false, error: 'No recipient address.' };

  const from = getFrom();
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({ from, to: [message.to], subject: message.subject, html: message.html });
    if (error) {
      const sandboxRestricted = logResendFailure(kind, message.to, from, error);
      return { sent: false, error: error.message, statusCode: error.statusCode ?? null, sandboxRestricted };
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[appointment-email] sent kind="${kind}" to="${message.to}" from="${from}" id=${data?.id ?? 'n/a'}`);
    }
    return { sent: true };
  } catch (err) {
    console.error(`[appointment-email] EXCEPTION kind="${kind}" to="${message.to}" from="${from}":`, err);
    return { sent: false, error: 'Email could not be sent.' };
  }
}
