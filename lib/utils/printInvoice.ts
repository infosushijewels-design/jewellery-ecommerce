import type { FullOrder } from '@/lib/supabase/orderService';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const inr = (n: number | string | null | undefined) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Opens a print-ready invoice for an order in a new window and triggers the print dialog.
 * Returns false if the browser blocked the popup.
 */
export function printOrderInvoice(order: FullOrder): boolean {
  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return false;

  const addr = order.shipping_address;
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const rows = (order.items || [])
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <strong>${escapeHtml(item.title)}</strong>
          ${item.metal || item.size ? `<div class="muted">${[item.metal, item.size && `Size ${item.size}`].filter(Boolean).map(escapeHtml).join(' · ')}</div>` : ''}
        </td>
        <td class="r">${item.quantity}</td>
        <td class="r">${inr(item.price)}</td>
        <td class="r">${inr(Number(item.price) * item.quantity)}</td>
      </tr>`
    )
    .join('');

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(order.order_number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2D2024; margin: 0; padding: 40px; font-size: 13px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #B99A62; padding-bottom: 18px; }
  .brand { font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px; font-weight: bold; }
  .muted { color: #7a6f73; font-size: 12px; }
  h2 { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A6F3C; margin: 0 0 6px; }
  .grid { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7a6f73; border-bottom: 1px solid #E8D5C5; padding: 8px 6px; }
  td { padding: 10px 6px; border-bottom: 1px solid #F0E6DC; vertical-align: top; }
  .r { text-align: right; }
  .totals { margin-left: auto; width: 280px; margin-top: 16px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border-top: 1px solid #2D2024; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: bold; }
  .foot { margin-top: 48px; text-align: center; }
  @media print { body { padding: 16px; } }
</style></head>
<body>
  <div class="head">
    <div>
      <div class="brand">SUSHI JEWELS</div>
      <div class="muted">Fine High Jewellery</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:bold">TAX INVOICE</div>
      <div class="muted">Invoice #${escapeHtml(order.order_number)}</div>
      <div class="muted">Date: ${escapeHtml(date)}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <h2>Bill / Ship To</h2>
      <div><strong>${escapeHtml(addr?.full_name)}</strong></div>
      <div>${escapeHtml(addr?.address)}</div>
      <div>${escapeHtml(addr?.city)}, ${escapeHtml(addr?.state)} - ${escapeHtml(addr?.pincode)}</div>
      <div class="muted">${escapeHtml(addr?.phone)} · ${escapeHtml(addr?.email)}</div>
    </div>
    <div style="text-align:right">
      <h2>Payment</h2>
      <div>${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</div>
      <div class="muted" style="text-transform:capitalize">Status: ${escapeHtml(order.payment_status)}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${inr(order.subtotal)}</span></div>
    <div><span>Shipping</span><span>${Number(order.shipping_fee) > 0 ? inr(order.shipping_fee) : 'Free'}</span></div>
    ${Number(order.tax) > 0 ? `<div><span>Tax</span><span>${inr(order.tax)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>${inr(order.total)}</span></div>
  </div>

  <div class="foot muted">Thank you for choosing Sushi Jewels.</div>
  <script>window.onload = function () { window.print(); };</script>
</body></html>`);
  win.document.close();
  return true;
}
