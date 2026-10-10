import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { normalizeIndianPhone } from '@/lib/checkoutValidation';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get('name') || '').trim();
    const phoneRaw = String(formData.get('phone') || '').trim();
    const metal = String(formData.get('metal') || 'Yellow Gold').trim();
    const diamond = String(formData.get('diamond') || 'Natural Diamond').trim();
    const budget = String(formData.get('budget') || 'Flexible').trim();
    const notes = String(formData.get('notes') || '').trim();
    const file = formData.get('sketch') as File | null;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Please enter your name.' }, { status: 400 });
    }

    const phone = normalizeIndianPhone(phoneRaw);
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const admin = createServiceRoleClient();
    let imageUrl = '';

    if (admin && file && file.size > 0 && file.size < 25 * 1024 * 1024) {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `custom-designs/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await admin.storage
          .from('store-media')
          .upload(fileName, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = admin.storage.from('store-media').getPublicUrl(fileName);
          imageUrl = publicUrlData?.publicUrl || '';
        }
      } catch (err) {
        console.warn('Could not store custom sketch image in storage:', err);
      }
    }

    const messageLines = [
      `🎨 BESPOKE / CUSTOM DESIGN SUBMISSION:`,
      `• Metal Preference: ${metal}`,
      `• Diamond / Stone Choice: ${diamond}`,
      `• Desired Budget: ${budget}`,
      notes ? `• Special Instructions: ${notes}` : null,
      imageUrl ? `• Reference Sketch File: ${imageUrl}` : file ? `• Attached Sketch File: ${file.name}` : '• No sketch uploaded (Manual consultation request)',
    ].filter(Boolean).join('\n');

    if (admin) {
      await admin.from('contact_inquiries').insert({
        name,
        email: `${phone.replace(/\D/g, '')}@sushijewels.inquiry`,
        phone,
        category: 'Custom Design / Bespoke Atelier',
        message: messageLines,
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Our master craftsmen will contact you shortly to review your unique creation.',
    });
  } catch (error) {
    console.error('Custom design submission failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit design. Please try again.' }, { status: 500 });
  }
}
