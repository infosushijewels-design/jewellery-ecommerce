import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { APPOINTMENT_TOPICS, appointmentConfigFrom, isBookableSlot, overlapsBooked } from '@/lib/appointments';
import { mergeStoreSettings } from '@/lib/storeSettings';
import { sendAppointmentEmail } from '@/lib/appointmentEmails';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { clientIp, clientIpHash, isBotSubmission, recentCount } from '@/lib/requestGuard';
import { decideRateLimit, tooManyRequests } from '@/lib/turnstile';

/** Bookings allowed per visitor per hour (a person who solves the Turnstile check may go past it, up to a ceiling). */
const MAX_BOOKINGS_PER_IP_PER_HOUR = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public endpoint: a customer books a video consultation slot. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Bots fill the hidden "website" field and submit the form instantly; both look like success but save nothing.
  if (isBotSubmission({ honeypot: body.website, startedAt: body.startedAt }, Date.now(), 1500)) {
    return NextResponse.json({ success: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const scheduledAt = typeof body.scheduledAt === 'string' ? body.scheduledAt : '';

  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 200) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (phone.replace(/\D/g, '').length < 8 || phone.length > 20) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  if (!(APPOINTMENT_TOPICS as readonly string[]).includes(topic)) return NextResponse.json({ error: 'Please choose a topic.' }, { status: 400 });
  if (message.length > 1000) return NextResponse.json({ error: 'Message is too long (max 1000 characters).' }, { status: 400 });

  // Per-visitor limit, counted from the bookings already saved (needs the service role: the table is admin-read only)
  const admin = createServiceRoleClient();
  const ipHash = admin ? clientIpHash(request, process.env.SUPABASE_SERVICE_ROLE_KEY as string) : null;
  if (admin && ipHash) {
    const made = await recentCount(admin, 'video_appointments', { column: 'ip_hash', value: ipHash }, 60);
    const decision = await decideRateLimit({ count: made, limit: MAX_BOOKINGS_PER_IP_PER_HOUR, token: body['cf-turnstile-response'], ip: clientIp(request) });
    if (decision !== 'ok') return tooManyRequests(decision, 'You have requested several appointments in a short time. Please try again in a little while, or contact us directly.');
  }

  const supabase = await createClient();
  // Hours, slot length and closed days are set by the store owner in Admin → Settings.
  const { data: settingsRow } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();
  const config = appointmentConfigFrom(mergeStoreSettings(settingsRow?.settings).appointments);

  if (!config.enabled) {
    return NextResponse.json({ error: 'Video appointments are not being accepted right now. Please try again later.' }, { status: 503 });
  }
  if (!isBookableSlot(scheduledAt, config)) {
    return NextResponse.json({ error: 'That time is no longer available. Please pick another slot.' }, { status: 400 });
  }

  const scheduled_at = new Date(scheduledAt).toISOString();

  // A custom time can start between slots, so reject anything that overlaps an existing booking.
  const spanMs = config.slotMinutes * 60 * 1000;
  const { data: nearby } = await supabase.rpc('get_booked_slots', {
    range_start: new Date(new Date(scheduled_at).getTime() - spanMs).toISOString(),
    range_end: new Date(new Date(scheduled_at).getTime() + spanMs).toISOString(),
  });
  if (overlapsBooked(scheduled_at, (nearby as string[] | null) ?? [], config)) {
    return NextResponse.json({ error: 'Sorry, that time clashes with another booking. Please pick a different time.' }, { status: 409 });
  }

  // Saved by the server (service role) when available, so the public insert rule can be removed (migration 033)
  const { error } = await (admin ?? supabase).from('video_appointments').insert({
    ip_hash: ipHash,
    customer_name: name,
    email,
    phone,
    topic,
    message: message || null,
    scheduled_at,
  });

  if (error) {
    // 23505 = unique_violation: someone else just took this slot.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Sorry, that slot was just booked. Please pick another time.' }, { status: 409 });
    }
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Appointment booking is not set up yet.' }, { status: 503 });
    }
    console.error('Failed to save video appointment:', error);
    return NextResponse.json({ error: 'Could not book your appointment. Please try again.' }, { status: 500 });
  }

  const data = { customer_name: name, email, phone, topic, message: message || null, scheduled_at, meet_link: null };
  // Emails are best-effort: the booking is already saved, so a mail failure must not fail the request.
  await Promise.allSettled([
    sendAppointmentEmail('received', data),
    process.env.APPOINTMENT_ADMIN_EMAIL
      ? sendAppointmentEmail('admin_alert', data, { adminEmail: process.env.APPOINTMENT_ADMIN_EMAIL })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
