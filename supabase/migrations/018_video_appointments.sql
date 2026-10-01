-- ==============================================================================
-- 018: Video appointments (Google Meet consultations)
--
-- Flow: customer books a slot (pending) -> admin confirms with a Meet link
-- (confirmed) -> reminders go out -> admin marks completed + notes -> follow-up.
--
-- Safe to re-run.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.video_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'Shopping consultation',
  message TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meet_link TEXT,
  admin_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  reminder_1d_sent_at TIMESTAMPTZ,
  reminder_30m_sent_at TIMESTAMPTZ,
  followup_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_appointments_status ON public.video_appointments(status);
CREATE INDEX IF NOT EXISTS idx_video_appointments_scheduled_at ON public.video_appointments(scheduled_at);

-- One live booking per slot: a second customer picking the same time gets a
-- unique-violation (23505) that the API turns into "that slot was just taken".
CREATE UNIQUE INDEX IF NOT EXISTS uq_video_appointments_active_slot
  ON public.video_appointments(scheduled_at)
  WHERE status IN ('pending', 'confirmed');

ALTER TABLE public.video_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can book an appointment" ON public.video_appointments;
CREATE POLICY "Anyone can book an appointment"
  ON public.video_appointments FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND meet_link IS NULL
    AND admin_notes IS NULL
    AND scheduled_at > now()
  );

DROP POLICY IF EXISTS "Admins read appointments" ON public.video_appointments;
CREATE POLICY "Admins read appointments"
  ON public.video_appointments FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update appointments" ON public.video_appointments;
CREATE POLICY "Admins update appointments"
  ON public.video_appointments FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete appointments" ON public.video_appointments;
CREATE POLICY "Admins delete appointments"
  ON public.video_appointments FOR DELETE
  USING (public.is_admin());

DROP TRIGGER IF EXISTS trg_video_appointments_updated_at ON public.video_appointments;
CREATE TRIGGER trg_video_appointments_updated_at BEFORE UPDATE ON public.video_appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- The booking form needs to grey out taken slots, but anonymous visitors must
-- not be able to read other customers' rows. This exposes ONLY the times.
CREATE OR REPLACE FUNCTION public.get_booked_slots(range_start TIMESTAMPTZ, range_end TIMESTAMPTZ)
RETURNS SETOF TIMESTAMPTZ
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT scheduled_at
  FROM public.video_appointments
  WHERE status IN ('pending', 'confirmed')
    AND scheduled_at >= range_start
    AND scheduled_at < range_end;
$$;

REVOKE ALL ON FUNCTION public.get_booked_slots(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
