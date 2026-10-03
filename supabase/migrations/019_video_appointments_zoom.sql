-- ==============================================================================
-- 019: Zoom meeting details on video appointments
--
-- Adds two OPTIONAL columns so a Zoom meeting created automatically at confirm time can be
-- deleted again on cancel, and its passcode shown in emails. Purely additive — the existing
-- `meet_link` column keeps holding the customer's join link (manual or auto-created).
--
-- Safe to re-run.
-- ==============================================================================

ALTER TABLE public.video_appointments
  ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
  ADD COLUMN IF NOT EXISTS zoom_passcode TEXT;

-- Customers may only create pending bookings; Zoom details are set by admins afterwards.
DROP POLICY IF EXISTS "Anyone can book an appointment" ON public.video_appointments;
CREATE POLICY "Anyone can book an appointment"
  ON public.video_appointments FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND meet_link IS NULL
    AND zoom_meeting_id IS NULL
    AND zoom_passcode IS NULL
    AND admin_notes IS NULL
    AND scheduled_at > now()
  );
