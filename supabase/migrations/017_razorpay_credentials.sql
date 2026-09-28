-- ==============================================================================
-- Migration 017: Razorpay credentials — move out of public store_settings
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================
-- payments.razorpayKeyId / razorpayKeySecret used to live inside
-- public.store_settings.settings, whose SELECT policy is `USING (true)` —
-- intentionally public, so the storefront can read contact/shipping/tax
-- info. That meant the Razorpay **secret key** was readable by anyone with
-- the anon key. This table replaces it, with no public read policy at all
-- (same pattern as shiprocket_credentials in migration 015).
--
-- Existing values in store_settings.settings.payments.razorpayKeyId/Secret
-- (if any were ever saved) are copied across below, then the app stops
-- reading/writing them from store_settings entirely — see lib/storeSettings.ts.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE TABLE IF NOT EXISTS public.razorpay_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces a single row
  key_id TEXT NOT NULL DEFAULT '',
  key_secret TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.razorpay_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read razorpay credentials" ON public.razorpay_credentials;
CREATE POLICY "Admins read razorpay credentials"
  ON public.razorpay_credentials FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert razorpay credentials" ON public.razorpay_credentials;
CREATE POLICY "Admins insert razorpay credentials"
  ON public.razorpay_credentials FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update razorpay credentials" ON public.razorpay_credentials;
CREATE POLICY "Admins update razorpay credentials"
  ON public.razorpay_credentials FOR UPDATE
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_razorpay_credentials_updated_at ON public.razorpay_credentials;
CREATE TRIGGER trg_razorpay_credentials_updated_at
  BEFORE UPDATE ON public.razorpay_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- One-time migration of any keys an admin already saved into store_settings,
-- so switching to this table doesn't silently disable online payments.
INSERT INTO public.razorpay_credentials (id, key_id, key_secret)
SELECT 1,
       COALESCE(settings->'payments'->>'razorpayKeyId', ''),
       COALESCE(settings->'payments'->>'razorpayKeySecret', '')
  FROM public.store_settings
 WHERE id = 1
   AND (settings->'payments'->>'razorpayKeyId' IS NOT NULL OR settings->'payments'->>'razorpayKeySecret' IS NOT NULL)
ON CONFLICT (id) DO UPDATE SET
  key_id = EXCLUDED.key_id,
  key_secret = EXCLUDED.key_secret
  WHERE public.razorpay_credentials.key_id = '' AND public.razorpay_credentials.key_secret = '';

-- Scrub the secret out of the old, publicly-readable location.
UPDATE public.store_settings
   SET settings = settings #- '{payments,razorpayKeyId}' #- '{payments,razorpayKeySecret}'
 WHERE id = 1;
