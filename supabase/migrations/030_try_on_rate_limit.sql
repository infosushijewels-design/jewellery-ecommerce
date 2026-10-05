-- ==============================================================================
-- 030: Rate-limit log for the virtual try-on (Gemini) endpoint
--
-- Every try-on request costs Gemini quota, and the endpoint is public. /api/try-on records one row per accepted
-- request here (a keyed one-way hash of the visitor's IP, never the address itself) and refuses a visitor who has
-- made too many in the last hour. Old rows are cleaned up by the endpoint itself.
--
-- Server-only: RLS is on and there are NO policies, so only the service role (the server) can read or write it.
-- Safe to re-run. To undo: DROP TABLE public.try_on_requests;
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.try_on_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_try_on_requests_created_at ON public.try_on_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_try_on_requests_ip ON public.try_on_requests (ip_hash, created_at DESC);

ALTER TABLE public.try_on_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.try_on_requests FROM anon, authenticated;
