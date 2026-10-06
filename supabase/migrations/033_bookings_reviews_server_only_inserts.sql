-- ==============================================================================
-- 033: Bookings and reviews can only be created through the website's server  (APPLY AFTER DEPLOYING)
--
-- Appointments (/api/appointments) and reviews (/api/reviews) now go through server routes that check for bots and
-- apply the per-visitor limits. These two public insert rules would still let anyone skip those checks by calling
-- the database API directly, so they are removed: from now on only the server (service role) can add rows.
--
--   !! Apply this ONLY AFTER the new code is live. Applying it earlier would break the OLD live booking page and
--   !! review form, which still write straight to the database.
--
-- Safe to re-run. To undo: re-create the two policies from migrations 019 (video_appointments) and 009 (product_reviews).
-- ==============================================================================

DROP POLICY IF EXISTS "Anyone can book an appointment" ON public.video_appointments;
DROP POLICY IF EXISTS "Anyone can submit a pending review" ON public.product_reviews;
