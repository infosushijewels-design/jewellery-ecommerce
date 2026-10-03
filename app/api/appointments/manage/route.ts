import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appointmentConfigFrom, isValidZoomLink } from '@/lib/appointments';
import { mergeStoreSettings } from '@/lib/storeSettings';
import { createZoomMeeting, deleteZoomMeeting, isZoomConfigured } from '@/lib/zoom';
import { sendAppointmentEmail } from '@/lib/appointmentEmails';

/**
 * Admin-only actions on an appointment that also send an email:
 *   confirm  { id, meetingLink? } -> status=confirmed + "confirmed" email. With no meetingLink a Zoom meeting is
 *                                    created automatically; with one (a Zoom link) it is used as-is (manual fallback).
 *   cancel   { id }               -> status=cancelled + "cancelled" email, and the auto-created Zoom meeting is deleted
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
    const manualLink = typeof body.meetingLink === 'string' ? body.meetingLink.trim() : '';
    if (manualLink && !isValidZoomLink(manualLink)) {
      return NextResponse.json({ error: 'Enter a valid Zoom meeting link (https://zoom.us/j/...), or leave it empty to create one automatically.' }, { status: 400 });
    }
    if (appt.status === 'completed' || appt.status === 'cancelled') {
      return NextResponse.json({ error: `This appointment is already ${appt.status}.` }, { status: 409 });
    }

    let link: string;
    let zoomMeetingId = appt.zoom_meeting_id;
    let passcode = appt.zoom_passcode;
    let zoomCreated = false;
    let staleZoomId: string | null = null; // an auto-created meeting the admin is replacing with their own link

    if (manualLink) {
      // The admin supplied a link. If it differs from the auto-created one, that meeting is no longer needed.
      link = manualLink;
      if (manualLink !== appt.meet_link) {
        staleZoomId = appt.zoom_meeting_id;
        zoomMeetingId = null;
        passcode = null;
      }
    } else if (appt.meet_link && appt.zoom_meeting_id) {
      // Already has an auto-created meeting (this is a "resend email") — reuse it rather than creating a duplicate.
      link = appt.meet_link;
    } else {
      if (!isZoomConfigured()) {
        return NextResponse.json({ error: 'Zoom is not set up yet. Paste a Zoom meeting link instead.', manualRequired: true }, { status: 400 });
      }
      const { data: settingsRow } = await supabase.from('store_settings').select('settings').eq('id', 1).maybeSingle();
      const { slotMinutes } = appointmentConfigFrom(mergeStoreSettings(settingsRow?.settings).appointments);

      const created = await createZoomMeeting({
        topic: `${appt.customer_name} — ${appt.topic}`,
        startTime: appt.scheduled_at,
        durationMinutes: slotMinutes,
        agenda: [appt.topic, appt.message].filter(Boolean).join('\n\n'),
      });
      if (!created.ok) {
        return NextResponse.json(
          { error: `Zoom could not create the meeting: ${created.error} You can paste a Zoom link instead.`, manualRequired: true },
          { status: 502 }
        );
      }
      link = created.value.joinUrl;
      zoomMeetingId = created.value.id;
      passcode = created.value.password;
      zoomCreated = true;
    }

    const { data, error } = await supabase
      .from('video_appointments')
      .update({
        status: 'confirmed',
        meet_link: link,
        zoom_meeting_id: zoomMeetingId,
        zoom_passcode: passcode,
        confirmed_at: new Date().toISOString(),
        reminder_1d_sent_at: null,
        reminder_30m_sent_at: null,
      })
      .eq('id', id)
      .select('id');
    if (error || !data?.length) {
      console.error('Failed to confirm appointment:', error);
      // Don't leave a meeting behind that no booking points to.
      if (zoomCreated && zoomMeetingId) await deleteZoomMeeting(zoomMeetingId);
      return NextResponse.json({ error: 'Could not confirm the appointment.' }, { status: 500 });
    }
    if (staleZoomId) {
      const removed = await deleteZoomMeeting(staleZoomId);
      if (!removed.ok) console.error('Could not delete the replaced Zoom meeting:', removed.error);
    }

    const mail = await sendAppointmentEmail('confirmed', { ...appt, meet_link: link, zoom_passcode: passcode });
    return NextResponse.json({
      success: true,
      emailSent: mail.sent,
      emailError: mail.error,
      meetingLink: link,
      zoomMeetingId,
      zoomPasscode: passcode,
      zoomCreated,
    });
  }

  if (action === 'cancel') {
    if (appt.status === 'completed') return NextResponse.json({ error: 'A completed appointment can’t be cancelled.' }, { status: 409 });
    const { data, error } = await supabase.from('video_appointments').update({ status: 'cancelled' }).eq('id', id).select('id');
    if (error || !data?.length) {
      console.error('Failed to cancel appointment:', error);
      return NextResponse.json({ error: 'Could not cancel the appointment.' }, { status: 500 });
    }

    // Remove the Zoom meeting we created for this booking. A failure here must not undo the cancellation.
    let zoomDeleted: boolean | null = null; // null = no auto-created meeting to delete
    if (appt.zoom_meeting_id) {
      const removed = await deleteZoomMeeting(appt.zoom_meeting_id);
      zoomDeleted = removed.ok;
      if (removed.ok) {
        await supabase.from('video_appointments').update({ zoom_meeting_id: null, zoom_passcode: null }).eq('id', id);
      } else {
        console.error('Cancelled, but could not delete the Zoom meeting:', removed.error);
      }
    }

    const mail = await sendAppointmentEmail('cancelled', appt);
    return NextResponse.json({ success: true, emailSent: mail.sent, emailError: mail.error, zoomDeleted });
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
