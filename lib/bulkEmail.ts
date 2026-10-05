import { escapeHtml } from '@/lib/orderEmails';

export const BULK_SUBJECT_MIN = 3;
export const BULK_SUBJECT_MAX = 150;
export const BULK_MESSAGE_MIN = 10;
export const BULK_MESSAGE_MAX = 10000;
/** Recipients per request. Resend's batch endpoint takes up to 100 emails, and one batch fits any serverless time limit. */
export const BULK_CHUNK_SIZE = 100;

export type BulkAudience = 'subscribers' | 'customers';

export const BULK_AUDIENCE_LABELS: Record<BulkAudience, string> = {
  subscribers: 'Newsletter subscribers',
  customers: 'All registered customers',
};

export interface BulkEmailBrand {
  storeName: string;
  storeUrl: string;
  supportEmail: string;
}

export function validateBulkEmail(subject: unknown, message: unknown): { ok: true; subject: string; message: string } | { ok: false; error: string } {
  const s = typeof subject === 'string' ? subject.trim() : '';
  const m = typeof message === 'string' ? message.trim() : '';
  if (s.length < BULK_SUBJECT_MIN) return { ok: false, error: 'Enter an email subject.' };
  if (s.length > BULK_SUBJECT_MAX || /[\r\n]/.test(s)) return { ok: false, error: `The subject must be one line of at most ${BULK_SUBJECT_MAX} characters.` };
  if (m.length < BULK_MESSAGE_MIN) return { ok: false, error: `Write a message of at least ${BULK_MESSAGE_MIN} characters.` };
  if (m.length > BULK_MESSAGE_MAX) return { ok: false, error: `The message can be at most ${BULK_MESSAGE_MAX} characters.` };
  return { ok: true, subject: s, message: m };
}

const COLORS = { charcoal: '#2D2024', gold: '#B99A62', champagne: '#F5EEE7', border: '#E8D5C5', muted: '#6B5F63' };
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = 'Helvetica, Arial, sans-serif';

/** Plain text → safe HTML: everything is escaped first, then web addresses become links and blank lines become paragraphs. */
function messageToHtml(message: string): string {
  return message
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => {
      const safe = escapeHtml(paragraph).replace(
        /https?:\/\/[^\s<]+/g,
        (url) => `<a href="${url}" style="color:${COLORS.gold};text-decoration:underline;">${url}</a>`
      );
      return `<p style="margin:0 0 18px;font-family:${SERIF};font-size:16px;line-height:26px;color:${COLORS.charcoal};">${safe.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

export function renderBulkEmail(input: { subject: string; message: string; brand: BulkEmailBrand; audience: BulkAudience }): { html: string; text: string } {
  const { subject, message, brand, audience } = input;
  const reason =
    audience === 'subscribers'
      ? `You are receiving this because you subscribed to ${escapeHtml(brand.storeName)} updates.`
      : `You are receiving this because you have an account with ${escapeHtml(brand.storeName)}.`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.champagne};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.champagne};"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid ${COLORS.border};">
    <tr><td align="center" style="padding:32px 32px 20px;border-bottom:1px solid ${COLORS.border};">
      <a href="${escapeHtml(brand.storeUrl)}" style="text-decoration:none;font-family:${SERIF};font-size:26px;letter-spacing:1px;color:${COLORS.charcoal};">${escapeHtml(brand.storeName)}</a>
      <div style="margin-top:6px;font-family:${SANS};font-size:10px;letter-spacing:4px;color:${COLORS.gold};">FINE JEWELLERY</div>
    </td></tr>
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 22px;font-family:${SERIF};font-size:22px;line-height:30px;font-weight:normal;color:${COLORS.charcoal};">${escapeHtml(subject)}</h1>
      ${messageToHtml(message)}
    </td></tr>
    <tr><td align="center" style="padding:20px 32px 28px;border-top:1px solid ${COLORS.border};font-family:${SANS};font-size:12px;line-height:18px;color:${COLORS.muted};">
      ${reason}<br>To stop receiving these emails, reply with “unsubscribe” or write to <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${COLORS.muted};">${escapeHtml(brand.supportEmail)}</a>.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
  const text = [
    brand.storeName.toUpperCase(),
    '',
    subject,
    '',
    message,
    '',
    '—',
    audience === 'subscribers' ? `You are receiving this because you subscribed to ${brand.storeName} updates.` : `You are receiving this because you have an account with ${brand.storeName}.`,
    `To stop receiving these emails, reply with "unsubscribe" or write to ${brand.supportEmail}.`,
  ].join('\n');
  return { html, text };
}
