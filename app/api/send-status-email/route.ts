import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  // See app/api/send-order-email/route.ts for why this is created lazily
  // instead of at module scope.
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set — skipping order status email.');
    return NextResponse.json({ success: false, error: 'Email service is not configured yet.' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { orderId, orderNumber, email, firstName, status } = await request.json();

    const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sushijewels.com';
    const trackingLink = `${storeUrl}/orders/${orderId}`;

    let statusMessage = '';
    let subjectMessage = '';

    if (status === 'shipped') {
      subjectMessage = `Your Order #${orderNumber} has been shipped!`;
      statusMessage = `Great news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you.`;
    } else if (status === 'delivered') {
      subjectMessage = `Your Order #${orderNumber} has been delivered!`;
      statusMessage = `Your order <strong>#${orderNumber}</strong> has been successfully delivered. We hope you love your new jewellery!`;
    } else {
      // We don't send emails for other statuses (like pending or processing)
      return NextResponse.json({ success: true, message: 'Status not mapped for email' });
    }

    const { data, error } = await resend.emails.send({
      from: 'Sushi Jewels <onboarding@resend.dev>', // Update to verified domain
      to: [email],
      subject: subjectMessage,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #B99A62; margin: 0;">Sushi Jewels</h1>
          </div>
          
          <div style="background-color: #fcfcfc; padding: 30px; border-radius: 8px; border: 1px solid #f0f0f0;">
            <h2 style="margin-top: 0;">Hi ${firstName || 'Customer'},</h2>
            <p>${statusMessage}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingLink}" style="background-color: #B99A62; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                View Order Status
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">If you have any questions or need assistance, simply reply to this email.</p>
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
    console.error('Send Status Email Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
