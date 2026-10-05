import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { sendAppointmentEmail } from '@/lib/appointmentEmails';

/**
 * Sends the "24 hours before" and "30 minutes before" reminders for confirmed appointments.
 *
 * A scheduler calls this every 10–15 minutes with the header `Authorization: Bearer <CRON_SECRET>` (the
 * GitHub Actions workflow in .github/workflows/appointment-reminders.yml does exactly that). It needs
 * CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY (there is no logged-in user on a cron call, so RLS would otherwise
 * hide every appointment).
 *
 * Each reminder is sent EXACTLY ONCE: the row is first "claimed" by stamping its *_sent_at column in a
 * conditional update (only one caller can win it), and only then is the email sent. If the email fails, the
 * claim is released so the next run tries again. Two overlapping runs therefore can't double-send.
 *
 * It also gives back the stock of online orders that were never paid within an hour (abandoned checkouts).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 });

  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' }, { status: 503 });

  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const H = 60 * 60 * 1000;
  const M = 60 * 1000;

  type Reminder = { kind: 'reminder_1d' | 'reminder_30m'; column: 'reminder_1d_sent_at' | 'reminder_30m_sent_at'; from: string; to: string };
  // 24h reminder: due once the call is within 24h, but skipped when it is under 1h away (the 30-minute reminder
  // covers that case). 30-minute reminder: due from 35 minutes before until the call starts.
  const reminders: Reminder[] = [
    { kind: 'reminder_1d', column: 'reminder_1d_sent_at', from: iso(1 * H), to: iso(24 * H) },
    { kind: 'reminder_30m', column: 'reminder_30m_sent_at', from: iso(0), to: iso(35 * M) },
  ];

  const sent = { reminder_1d: 0, reminder_30m: 0 };
  const failed = { reminder_1d: 0, reminder_30m: 0 };

  for (const { kind, column, from, to } of reminders) {
    const { data: due, error: dueError } = await supabase
      .from('video_appointments')
      .select('*')
      .eq('status', 'confirmed')
      .not('meet_link', 'is', null)
      .is(column, null)
      .lte('scheduled_at', to)
      .gt('scheduled_at', from);
    if (dueError) {
      console.error(`Reminder query (${kind}) failed:`, dueError);
      continue;
    }

    for (const appointment of due ?? []) {
      // Claim it: only one run can flip the column from NULL, so only one run sends.
      const claimedAt = new Date().toISOString();
      const { data: claimed, error: claimError } = await supabase
        .from('video_appointments')
        .update({ [column]: claimedAt })
        .eq('id', appointment.id)
        .is(column, null)
        .select('id');
      if (claimError) {
        console.error(`Reminder claim (${kind}) failed:`, claimError);
        continue;
      }
      if (!claimed?.length) continue; // another run just took it

      let delivered = false;
      try {
        delivered = (await sendAppointmentEmail(kind, appointment)).sent;
      } catch (err) {
        console.error(`Reminder email (${kind}) threw:`, err);
      }

      if (delivered) {
        sent[kind]++;
      } else {
        failed[kind]++;
        // Give the claim back so the next run retries.
        const { error: releaseError } = await supabase.from('video_appointments').update({ [column]: null }).eq('id', appointment.id).eq(column, claimedAt);
        if (releaseError) console.error(`Could not release the ${kind} claim for ${appointment.id}:`, releaseError);
      }
    }
  }

  // Housekeeping: online orders never paid within an hour give their stock back.
  const { data: staleCancelled, error: staleError } = await supabase.rpc('cancel_stale_online_orders', { p_minutes: 60 });
  if (staleError) console.error('Could not release stale unpaid orders:', staleError);

  return NextResponse.json({
    success: true,
    sent1d: sent.reminder_1d,
    sent30m: sent.reminder_30m,
    failed1d: failed.reminder_1d,
    failed30m: failed.reminder_30m,
    staleOrdersCancelled: typeof staleCancelled === 'number' ? staleCancelled : 0,
  });
}
