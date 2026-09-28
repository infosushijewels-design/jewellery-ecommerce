import { NextResponse } from 'next/server';
import { Resend } from 'resend';

interface OrderEmailItem {
  title: string;
  metal?: string | null;
  quantity: number;
  price: number;
}

export async function POST(request: Request) {
  // Constructing `new Resend(...)` at module scope throws immediately if the
  // key is missing, which used to crash the entire production build (every
  // route is imported once during `next build`). Creating it lazily, inside
  // the handler, means the app builds and runs fine before Shiprocket/Resend
  // credentials exist — this route just answers 503 until they're added.
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set — skipping order confirmation email.');
    return NextResponse.json({ success: false, error: 'Email service is not configured yet.' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { orderId, email, firstName, items, total } = (await request.json()) as {
      orderId: string;
      email: string;
      firstName?: string;
      items: OrderEmailItem[];
      total: number;
    };

    // Basic HTML template for the email items
    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title} ${item.metal ? `(${item.metal})` : ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    // Generate tracking link
    const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sushijewels.com';
    const trackingLink = `${storeUrl}/orders/${orderId}`;

    // Send the email using Resend
    // Important: Change 'onboarding@resend.dev' to your verified domain once it's verified (e.g. orders@sushijewels.com)
    const { data, error } = await resend.emails.send({
      from: 'Sushi Jewels <onboarding@resend.dev>', 
      to: [email],
      subject: `Order Confirmation - #${orderId}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #B99A62; margin: 0;">Sushi Jewels</h1>
          </div>
          
          <div style="background-color: #fcfcfc; padding: 30px; border-radius: 8px; border: 1px solid #f0f0f0;">
            <h2 style="margin-top: 0;">Thank you for your order, ${firstName || 'Customer'}!</h2>
            <p>We've received your order <strong>#${orderId}</strong> and it is now being processed.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingLink}" style="background-color: #B99A62; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Track Your Order
              </a>
            </div>

            <h3 style="margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px; border-bottom: 2px solid #eee; color: #666; font-size: 14px;">Item</th>
                  <th style="text-align: center; padding: 10px; border-bottom: 2px solid #eee; color: #666; font-size: 14px;">Qty</th>
                  <th style="text-align: right; padding: 10px; border-bottom: 2px solid #eee; color: #666; font-size: 14px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px 10px; font-weight: bold; text-align: right; border-bottom: 2px solid #eee;">Total Paid:</td>
                  <td style="padding: 15px 10px; font-weight: bold; text-align: right; border-bottom: 2px solid #eee; color: #B99A62; font-size: 18px;">₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
              </tfoot>
            </table>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">We will notify you again once your order has been dispatched. You can track your order status anytime using the link above. If you have any questions, simply reply to this email.</p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Sushi Jewels. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Send Email Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
