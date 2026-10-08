/**
 * Order confirmation emails (customer copy + optional admin alert).
 *
 * Pure functions — no env access, no network — so they are easy to test. The HTML is deliberately
 * "old-school": nested tables, inline styles, bgcolor attributes, system/Georgia fonts and no gradients,
 * flex, grid or web fonts, so it renders the same in Gmail (web + app), Apple Mail and Outlook.
 * The only <style> block is a small mobile media query; clients that strip it still get a fluid layout.
 */

export type OrderEmailAudience = 'customer' | 'admin';

export interface OrderEmailItem {
  title: string;
  metal?: string | null;
  size?: string | null;
  quantity: number;
  price: number;
}

export interface OrderEmailData {
  /** Used in the tracking link: `${storeUrl}/orders/${orderId}`. */
  orderId: string;
  /** Secret from the order: added to the tracking link so a guest can open it from any device. */
  trackingToken?: string | null;
  /** Human-friendly reference shown in the badge (falls back to orderId). */
  orderNumber?: string | null;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  subtotal: number;
  /** undefined/null = not known (shown as "Calculated"); 0 = free. */
  shippingFee?: number | null;
  /** undefined/null = not known (shown as "Included"). */
  tax?: number | null;
  total: number;
  paymentMethod?: string | null;
}

export interface OrderEmailBrand {
  storeName: string;
  storeUrl: string;
  supportEmail: string;
  helpline: string;
}

const COLORS = {
  charcoal: '#2D2024',
  gold: '#B99A62',
  goldDeep: '#8A6F3C',
  champagne: '#F5EEE7',
  cream: '#FBF6EA',
  border: '#E8D5C5',
  muted: '#6B5F63',
  goldLight: '#E8C97A',
};

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "Helvetica, Arial, sans-serif";

export function escapeHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** ₹ with Indian digit grouping (1,23,456); paise only when they exist. */
export function formatINR(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function paymentLabel(method: string | null | undefined): string | null {
  if (!method) return null;
  if (method === 'cod') return 'Cash on Delivery';
  if (method === 'online') return 'Paid online';
  return method;
}

/** "?t=<token>" for the tracking link (only a well-formed token is ever added). */
function tokenQuery(data: OrderEmailData): string {
  return data.trackingToken && /^[a-f0-9]{32}$/i.test(data.trackingToken) ? `?t=${data.trackingToken}` : '';
}

function orderRef(data: OrderEmailData): string {
  return (data.orderNumber || data.orderId).trim();
}

export function orderEmailSubject(data: OrderEmailData, audience: OrderEmailAudience = 'customer'): string {
  const ref = orderRef(data);
  return audience === 'admin' ? `New order ${ref} — ${formatINR(data.total)}` : `Order Confirmation — ${ref}`;
}

function itemRows(items: OrderEmailItem[]): string {
  return items
    .map((item) => {
      const pills = [item.metal, item.size ? `Size ${item.size}` : null]
        .filter((v): v is string => !!v && !!v.trim())
        .map(
          (label) =>
            `<span style="display:inline-block;margin:6px 6px 0 0;padding:2px 10px;border:1px solid #D9C7A0;background:${COLORS.cream};color:${COLORS.goldDeep};font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:1px;text-transform:uppercase;border-radius:12px;">${escapeHtml(label)}</span>`
        )
        .join('');
      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid ${COLORS.border};font-family:${SERIF};font-size:16px;line-height:22px;color:${COLORS.charcoal};">
            ${escapeHtml(item.title)}
            ${pills ? `<br />${pills}` : ''}
          </td>
          <td align="center" width="48" style="padding:16px 4px;border-bottom:1px solid ${COLORS.border};font-family:${SANS};font-size:14px;color:${COLORS.muted};">&times;${item.quantity}</td>
          <td align="right" width="96" style="padding:16px 0;border-bottom:1px solid ${COLORS.border};font-family:${SANS};font-size:14px;font-weight:bold;color:${COLORS.charcoal};white-space:nowrap;">${formatINR(item.price * item.quantity)}</td>
        </tr>`;
    })
    .join('');
}

function totalsRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${COLORS.muted};">${label}</td>
      <td align="right" style="padding:6px 0;font-family:${SANS};font-size:14px;color:${COLORS.charcoal};white-space:nowrap;">${value}</td>
    </tr>`;
}

export function generateOrderEmailHtml(
  data: OrderEmailData,
  brand: OrderEmailBrand,
  audience: OrderEmailAudience = 'customer'
): string {
  const isAdmin = audience === 'admin';
  const ref = orderRef(data);
  const first = data.customerName.trim().split(/\s+/)[0] || 'there';
  const store = escapeHtml(brand.storeName);
  const storeUrl = brand.storeUrl.replace(/\/+$/, '');
  const ctaHref = isAdmin ? `${storeUrl}/admin/orders` : `${storeUrl}/orders/${encodeURIComponent(data.orderId)}${tokenQuery(data)}`;
  const ctaLabel = isAdmin ? 'Open Orders Dashboard' : 'Track Your Order';
  const pay = paymentLabel(data.paymentMethod);

  const shippingValue =
    data.shippingFee === undefined || data.shippingFee === null
      ? 'Calculated'
      : data.shippingFee === 0
        ? `<span style="color:${COLORS.goldDeep};font-weight:bold;">Complimentary</span>`
        : formatINR(data.shippingFee);
  const taxValue = data.tax === undefined || data.tax === null ? 'Included' : formatINR(data.tax);

  const heading = isAdmin ? 'New order received' : `Thank you, ${escapeHtml(first)}`;
  const intro = isAdmin
    ? `<strong>${escapeHtml(data.customerName)}</strong> &lt;${escapeHtml(data.customerEmail)}&gt; has placed an order.${pay ? ` Payment: ${escapeHtml(pay)}.` : ''}`
    : `Your order has been received and our atelier is preparing it with care.${pay ? ` Payment: <strong>${escapeHtml(pay)}</strong>.` : ''}`;
  const preheader = isAdmin
    ? `${data.customerName} ordered ${data.items.length} item(s) — ${formatINR(data.total)}`
    : `Your order ${ref} is confirmed — ${formatINR(data.total)}.`;

  const assurance = isAdmin
    ? ''
    : `
      <tr>
        <td style="padding:0 40px 8px 40px;" class="px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.cream}" style="background:${COLORS.cream};border:1px solid ${COLORS.border};">
            <tr>
              <td style="padding:20px 22px;font-family:${SANS};font-size:13px;line-height:21px;color:${COLORS.charcoal};">
                <div style="font-family:${SERIF};font-size:15px;color:${COLORS.goldDeep};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;">Our Promise To You</div>
                <div style="padding:2px 0;"><span style="color:${COLORS.gold};">&#9670;</span>&nbsp; Insured, discreet packaging, every time</div>
                <div style="padding:2px 0;"><span style="color:${COLORS.gold};">&#9670;</span>&nbsp; A lifetime authenticity card with your jewellery</div>
                <div style="padding:2px 0;"><span style="color:${COLORS.gold};">&#9670;</span>&nbsp; We will email your tracking details the moment your order is dispatched</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(orderEmailSubject(data, audience))}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .h1 { font-size: 26px !important; line-height: 32px !important; }
    }
  </style>
</head>
<body bgcolor="${COLORS.champagne}" style="margin:0;padding:0;background:${COLORS.champagne};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.champagne}" style="background:${COLORS.champagne};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:600px;max-width:600px;background:#FFFFFF;">
          <tr><td height="4" bgcolor="${COLORS.gold}" style="height:4px;line-height:4px;font-size:0;background:${COLORS.gold};">&nbsp;</td></tr>

          <tr>
            <td align="center" style="padding:32px 40px 8px 40px;" class="px">
              <a href="${escapeHtml(storeUrl || 'https://www.sushijewels.in')}" target="_blank" style="text-decoration:none;display:inline-block;">
                <img
                  src="${escapeHtml(storeUrl || 'https://www.sushijewels.in')}/logo.jpeg"
                  alt="${store}"
                  width="120"
                  border="0"
                  style="display:block;margin:0 auto 12px auto;max-width:120px;height:auto;border:0;outline:none;text-decoration:none;"
                />
              </a>
              <div style="font-family:${SERIF};font-size:22px;line-height:26px;letter-spacing:6px;color:${COLORS.charcoal};text-transform:uppercase;">${store}</div>
              <div style="font-family:${SANS};font-size:10px;line-height:15px;letter-spacing:4px;color:${COLORS.gold};text-transform:uppercase;padding-top:4px;">Fine Jewellery</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:14px 40px 0 40px;" class="px">
              <table role="presentation" width="64" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" bgcolor="${COLORS.gold}" style="height:1px;line-height:1px;font-size:0;background:${COLORS.gold};">&nbsp;</td></tr></table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:30px 40px 0 40px;" class="px">
              <div class="h1" style="font-family:${SERIF};font-size:30px;line-height:36px;color:${COLORS.charcoal};">${heading}</div>
              <div style="padding-top:16px;">
                <span style="display:inline-block;padding:6px 14px;border:1px solid ${COLORS.gold};font-family:${SANS};font-size:12px;line-height:16px;letter-spacing:2px;color:${COLORS.goldDeep};text-transform:uppercase;">Order ${escapeHtml(ref)}</span>
                <span style="display:inline-block;margin-left:6px;padding:6px 14px;background:${COLORS.charcoal};font-family:${SANS};font-size:12px;line-height:16px;letter-spacing:2px;color:${COLORS.goldLight};text-transform:uppercase;">${isAdmin ? 'New' : 'Confirmed'}</span>
              </div>
              <div style="padding-top:18px;font-family:${SANS};font-size:15px;line-height:24px;color:${COLORS.muted};">${intro}</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 40px 30px 40px;" class="px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="${COLORS.charcoal}" style="background:${COLORS.charcoal};border:1px solid ${COLORS.gold};padding:15px 38px;">
                    <a href="${escapeHtml(ctaHref)}" target="_blank" style="font-family:${SANS};font-size:13px;line-height:18px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${COLORS.goldLight};text-decoration:none;display:inline-block;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;" class="px">
              <div style="font-family:${SANS};font-size:11px;letter-spacing:3px;color:${COLORS.gold};text-transform:uppercase;padding-bottom:4px;border-bottom:2px solid ${COLORS.gold};">Order Summary</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemRows(data.items)}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 40px 8px 40px;" class="px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${totalsRow('Subtotal', formatINR(data.subtotal))}
                ${totalsRow('Shipping', shippingValue)}
                ${totalsRow('Taxes (GST)', taxValue)}
                <tr>
                  <td style="padding:14px 14px;border-top:1px solid ${COLORS.gold};background:${COLORS.cream};font-family:${SERIF};font-size:16px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.charcoal};" bgcolor="${COLORS.cream}">Total</td>
                  <td align="right" style="padding:14px 14px;border-top:1px solid ${COLORS.gold};background:${COLORS.cream};font-family:${SERIF};font-size:22px;font-weight:bold;color:${COLORS.goldDeep};white-space:nowrap;" bgcolor="${COLORS.cream}">${formatINR(data.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="font-size:0;line-height:20px;height:20px;">&nbsp;</td></tr>
          ${assurance}

          <tr>
            <td align="center" style="padding:30px 40px 34px 40px;" class="px">
              <table role="presentation" width="64" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td height="1" bgcolor="${COLORS.border}" style="height:1px;line-height:1px;font-size:0;background:${COLORS.border};">&nbsp;</td></tr></table>
              <div style="padding-top:20px;font-family:${SANS};font-size:13px;line-height:21px;color:${COLORS.muted};">
                Questions about your order? Our concierge is happy to help.<br />
                <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${COLORS.goldDeep};text-decoration:underline;">${escapeHtml(brand.supportEmail)}</a>
                ${brand.helpline ? `&nbsp;&bull;&nbsp; <a href="tel:${escapeHtml(brand.helpline.replace(/[^+\d]/g, ''))}" style="color:${COLORS.goldDeep};text-decoration:none;">${escapeHtml(brand.helpline)}</a>` : ''}
              </div>
              <div style="padding-top:18px;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:1px;color:#9A8F93;">
                &copy; ${new Date().getFullYear()} ${store}. All rights reserved.<br />
                <a href="${escapeHtml(storeUrl)}" style="color:#9A8F93;text-decoration:underline;">${escapeHtml(storeUrl.replace(/^https?:\/\//, ''))}</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text alternative: improves deliverability and covers clients that block HTML. */
export function generateOrderEmailText(
  data: OrderEmailData,
  brand: OrderEmailBrand,
  audience: OrderEmailAudience = 'customer'
): string {
  const isAdmin = audience === 'admin';
  const storeUrl = brand.storeUrl.replace(/\/+$/, '');
  const first = data.customerName.trim().split(/\s+/)[0] || 'there';
  const lines: string[] = [];
  lines.push(brand.storeName.toUpperCase() + ' — FINE JEWELLERY', '');
  lines.push(isAdmin ? `New order ${orderRef(data)} from ${data.customerName} <${data.customerEmail}>` : `Thank you, ${first}! Your order ${orderRef(data)} is confirmed.`);
  const pay = paymentLabel(data.paymentMethod);
  if (pay) lines.push(`Payment: ${pay}`);
  lines.push('', 'ORDER SUMMARY');
  for (const item of data.items) {
    const extra = [item.metal, item.size ? `Size ${item.size}` : null].filter(Boolean).join(', ');
    lines.push(`- ${item.title}${extra ? ` (${extra})` : ''} x${item.quantity}: ${formatINR(item.price * item.quantity)}`);
  }
  lines.push('');
  lines.push(`Subtotal: ${formatINR(data.subtotal)}`);
  lines.push(`Shipping: ${data.shippingFee === undefined || data.shippingFee === null ? 'Calculated' : data.shippingFee === 0 ? 'Complimentary' : formatINR(data.shippingFee)}`);
  lines.push(`Taxes (GST): ${data.tax === undefined || data.tax === null ? 'Included' : formatINR(data.tax)}`);
  lines.push(`TOTAL: ${formatINR(data.total)}`, '');
  lines.push(isAdmin ? `Open orders: ${storeUrl}/admin/orders` : `Track your order: ${storeUrl}/orders/${encodeURIComponent(data.orderId)}${tokenQuery(data)}`);
  if (!isAdmin) {
    lines.push('', 'Insured, discreet packaging. A lifetime authenticity card with your jewellery.');
    lines.push("We'll email your tracking details as soon as your order is dispatched.");
  }
  lines.push('', `Support: ${brand.supportEmail}${brand.helpline ? ` | ${brand.helpline}` : ''}`);
  return lines.join('\n');
}
