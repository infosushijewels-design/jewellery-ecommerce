-- ==============================================================================
-- 032: Remember WHICH visitor (as a one-way hash) made a booking or review, for rate limiting
--
-- /api/appointments and /api/reviews allow only a few submissions per visitor per hour (5 bookings, 3 reviews).
-- To count them, each row stores a keyed one-way hash of the visitor's IP address (never the address itself — see
-- lib/requestGuard.ts). Old rows simply have NULL here. Purely additive, safe to apply before the code is deployed.
-- Safe to re-run. To undo: ALTER TABLE ... DROP COLUMN ip_hash;
-- ==============================================================================

ALTER TABLE public.video_appointments ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE public.product_reviews    ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_video_appointments_ip ON public.video_appointments (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_reviews_ip    ON public.product_reviews    (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;
