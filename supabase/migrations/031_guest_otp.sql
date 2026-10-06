-- ==============================================================================
-- 031: One-time codes for guest order history ("My Orders" without an account)
--
-- A guest who ordered without an account proves they own the email / mobile number by entering a 6-digit code
-- sent to the email address used at checkout. /api/guest/send-otp writes a row here, /api/guest/verify-otp checks it.
--
--   * The code itself is NEVER stored — only an HMAC of it (keyed with a server secret), so a database leak does
--     not reveal usable codes.
--   * A code lives 10 minutes, allows 5 wrong guesses, and works once.
--   * Rows also serve as the request log for rate limiting (per visitor, per email/mobile, whole site). A row is
--     written even when no order matches, so the limits and the response look identical either way and the form
--     cannot be used to discover which emails or numbers have placed orders (code_hash stays NULL then).
--   * Server-only: RLS is on with NO policies and the browser roles have no privileges.
--
-- Safe to re-run. To undo: DROP TABLE public.guest_otps;
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.guest_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,                       -- lower-cased email, or the 10-digit mobile number
  kind        TEXT NOT NULL CHECK (kind IN ('email', 'phone')),
  code_hash   TEXT,                                -- NULL when there was nothing to send (no matching order)
  attempts    INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_otps_identifier ON public.guest_otps (identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_otps_ip ON public.guest_otps (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_otps_created_at ON public.guest_otps (created_at DESC);

ALTER TABLE public.guest_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guest_otps FROM anon, authenticated;

-- Fast lookup of a guest's orders by the email / mobile on the order (the checkout stores them in shipping_address)
CREATE INDEX IF NOT EXISTS idx_orders_ship_email ON public.orders (lower(shipping_address ->> 'email'));
CREATE INDEX IF NOT EXISTS idx_orders_ship_phone ON public.orders ((shipping_address ->> 'phone'));
