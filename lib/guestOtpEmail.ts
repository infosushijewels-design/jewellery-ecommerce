import { OTP_TTL_MINUTES } from '@/lib/guestAccess';

const COLORS = { charcoal: '#2D2024', gold: '#B99A62', champagne: '#F5EEE7', border: '#E8D5C5', muted: '#6B5F63' };
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = 'Helvetica, Arial, sans-serif';

export function otpEmailSubject(): string {
  return 'Your Sushi Jewels Verification Code';
}

/** The code is digits only, so it needs no escaping; the store name and address come from our own settings. */
export function renderOtpEmail(code: string, brand: { storeName: string; supportEmail: string }): { html: string; text: string } {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${otpEmailSubject()}</title></head>
<body style="margin:0;padding:0;background:${COLORS.champagne};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.champagne};"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#FFFFFF;border:1px solid ${COLORS.border};">
    <tr><td align="center" style="padding:30px 32px 18px;border-bottom:1px solid ${COLORS.border};">
      <a href="https://www.sushijewels.in" target="_blank" style="text-decoration:none;display:inline-block;">
        <img
          src="https://www.sushijewels.in/logo.jpeg"
          alt="Sushi Jewels"
          width="110"
          border="0"
          style="display:block;margin:0 auto 10px auto;max-width:110px;height:auto;border:0;outline:none;text-decoration:none;"
        />
      </a>
      <div style="font-family:${SERIF};font-size:24px;letter-spacing:4px;color:${COLORS.charcoal};text-transform:uppercase;">${brand.storeName.replace(/[<>&]/g, '')}</div>
      <div style="margin-top:4px;font-family:${SANS};font-size:10px;letter-spacing:4px;color:${COLORS.gold};">FINE JEWELLERY</div>
    </td></tr>
    <tr><td align="center" style="padding:32px;">
      <p style="margin:0 0 18px;font-family:${SERIF};font-size:16px;line-height:26px;color:${COLORS.charcoal};">Hello,<br>Your verification code for accessing your Sushi Jewels orders is:</p>
      <div style="display:inline-block;padding:14px 26px;border:1px solid ${COLORS.gold};background:#FBF6EA;font-family:${SANS};font-size:32px;letter-spacing:10px;font-weight:bold;color:${COLORS.charcoal};">${code}</div>
      <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${COLORS.muted};">This code will expire in ${OTP_TTL_MINUTES} minutes and can be used only once.<br>If you did not request this code, please ignore this email.</p>
    </td></tr>
    <tr><td align="center" style="padding:16px 32px 24px;border-top:1px solid ${COLORS.border};font-family:${SANS};font-size:12px;color:${COLORS.muted};">Questions? <a href="mailto:${brand.supportEmail}" style="color:${COLORS.muted};">${brand.supportEmail}</a></td></tr>
  </table>
</td></tr></table>
</body></html>`;
  const text = ['Hello,', '', 'Your verification code for accessing your Sushi Jewels orders is:', '', code, '', `This code will expire in ${OTP_TTL_MINUTES} minutes and can be used only once.`, 'If you did not request this code, please ignore this email.', '', brand.storeName, brand.supportEmail].join('\n');
  return { html, text };
}
