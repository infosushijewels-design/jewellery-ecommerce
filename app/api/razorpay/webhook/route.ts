import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderPaymentStatus } from '@/lib/supabase/orderService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    
    // Extract internal order ID from notes 
    // (Ensure you pass internal_order_id in notes when creating Razorpay order in checkout)
    const notes = event.payload?.payment?.entity?.notes || {};
    const internalOrderId = notes.internal_order_id || notes.orderId; // fallback to orderId if you used that

    if (!internalOrderId) {
        console.warn('Webhook received but internal order ID not found in notes', event.payload?.payment?.entity?.id);
        return NextResponse.json({ received: true, warning: 'Internal Order ID missing in notes' });
    }

    if (event.event === 'payment.captured') {
      // Payment successful
      await updateOrderPaymentStatus(internalOrderId, 'paid');
      console.log(`Order ${internalOrderId} marked as paid via webhook.`);
    } else if (event.event === 'payment.failed') {
      // Payment failed
      await updateOrderPaymentStatus(internalOrderId, 'failed');
      console.log(`Order ${internalOrderId} marked as failed via webhook.`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
