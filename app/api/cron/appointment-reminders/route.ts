import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { sendAppointmentEmail } from '@/lib/appointmentEmails';

/**
 * Sends the "24 hours before" and "30 minutes before" reminders for confirmed
 * appointments. Call this on a schedule (every 10–15 minutes) from a cron
 * service with the header `Authorization: Bearer <CRON_SECRET>`.
 *
 * Needs CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY (there is no logged-in user
 * on a cron call, so RLS would otherwise hide every appointment).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' }, { status: 503 });

  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const H = 60 * 60 * 1000;
  const M = 60 * 1000;
  let sent1d = 0;
  let sent30m = 0;

  // 24h reminder: due once the call is within 24h, but skipped when it is under
  // 1h away (the 30-minute reminder covers that case).
  const { data: dayDue, error: dayErr } = await supabase
    .from('video_appointments')
    .select('*')
    .eq('status', 'confirmed')
    .not('meet_link', 'is', null)
    .is('reminder_1d_sent_at', null)
    .lte('scheduled_at', iso(24 * H))
    .gt('scheduled_at', iso(1 * H));
  if (dayErr) console.error('Reminder query (24h) failed:', dayErr);

  for (const a of dayDue ?? []) {
    const res = await sendAppointmentEmail('reminder_1d', a);
    if (res.sent) {
      await supabase.from('video_appointments').update({ reminder_1d_sent_at: new Date().toISOString() }).eq('id', a.id);
      sent1d++;
    }
  }

  const { data: soonDue, error: soonErr } = await supabase
    .from('video_appointments')
    .select('*')
    .eq('status', 'confirmed')
    .not('meet_link', 'is', null)
    .is('reminder_30m_sent_at', null)
    .lte('scheduled_at', iso(35 * M))
    .gt('scheduled_at', iso(0));
  if (soonErr) console.error('Reminder query (30m) failed:', soonErr);

  for (const a of soonDue ?? []) {
    const res = await sendAppointmentEmail('reminder_30m', a);
    if (res.sent) {
      await supabase.from('video_appointments').update({ reminder_30m_sent_at: new Date().toISOString() }).eq('id', a.id);
      sent30m++;
    }
  }

  return NextResponse.json({ success: true, sent1d, sent30m });
}
