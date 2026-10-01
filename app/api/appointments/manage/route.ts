import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidMeetLink } from '@/lib/appointments';
import { sendAppointmentEmail } from '@/lib/appointmentEmails';

/**
 * Admin-only actions on an appointment that also send an email:
 *   confirm  { id, meetLink }   -> status=confirmed + Meet link + "confirmed" email
 *   cancel   { id }             -> status=cancelled + "cancelled" email
 *   followup { id, message }    -> "follow-up" email, stamps followup_sent_at
 *
 * Authorisation is enforced by Row Level Security: only admins can SELECT a row
 * from video_appointments, so a non-admin (or logged-out) caller simply can't
 * find it and gets a 403.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const action = typeof body.action === 'string' ? body.action : '';
  if (!id) return NextResponse.json({ error: 'Missing appointment id.' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const { data: appt } = await supabase.from('video_appointments').select('*').eq('id', id).maybeSingle();
  if (!appt) return NextResponse.json({ error: 'Not allowed, or appointment not found.' }, { status: 403 });

  if (action === 'confirm') {
    const meetLink = typeof body.meetLink === 'string' ? body.meetLink.trim() : '';
    if (!isValidMeetLink(meetLink)) return NextResponse.json({ error: 'Enter a valid Google Meet link (https://meet.google.com/...).' }, { status: 400 });
    if (appt.status === 'completed' || appt.status === 'cancelled') {
      return NextResponse.json({ error: `This appointment is already ${appt.status}.` }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('video_appointments')
      .update({ status: 'confirmed', meet_link: meetLink, confirmed_at: new Date().toISOString(), reminder_1d_sent_at: null, reminder_30m_sent_at: null })
      .eq('id', id)
      .select('id');
    if (error || !data?.length) {
      console.error('Failed to confirm appointment:', error);
      return NextResponse.json({ error: 'Could not confirm the appointment.' }, { status: 500 });
    }
    const mail = await sendAppointmentEmail('confirmed', { ...appt, meet_link: meetLink });
    return NextResponse.json({ success: true, emailSent: mail.sent, emailError: mail.error });
  }

  if (action === 'cancel') {
    if (appt.status === 'completed') return NextResponse.json({ error: 'A completed appointment can’t be cancelled.' }, { status: 409 });
    const { data, error } = await supabase.from('video_appointments').update({ status: 'cancelled' }).eq('id', id).select('id');
    if (error || !data?.length) {
      console.error('Failed to cancel appointment:', error);
      return NextResponse.json({ error: 'Could not cancel the appointment.' }, { status: 500 });
    }
    const mail = await sendAppointmentEmail('cancelled', appt);
    return NextResponse.json({ success: true, emailSent: mail.sent, emailError: mail.error });
  }

  if (action === 'followup') {
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return NextResponse.json({ error: 'Write a follow-up message first.' }, { status: 400 });
    if (message.length > 3000) return NextResponse.json({ error: 'Follow-up message is too long.' }, { status: 400 });
    if (appt.status !== 'completed') return NextResponse.json({ error: 'Mark the appointment as completed before sending a follow-up.' }, { status: 409 });

    const mail = await sendAppointmentEmail('followup', appt, { followupMessage: message });
    if (!mail.sent) return NextResponse.json({ error: mail.error || 'Email could not be sent.' }, { status: 502 });

    const { error } = await supabase.from('video_appointments').update({ followup_sent_at: new Date().toISOString() }).eq('id', id);
    if (error) console.error('Follow-up sent but failed to stamp followup_sent_at:', error);
    return NextResponse.json({ success: true, emailSent: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
