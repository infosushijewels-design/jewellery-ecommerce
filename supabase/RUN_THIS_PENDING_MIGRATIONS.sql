-- ============================================================
-- Combined pending migrations: 014, 017
-- Run this whole file once in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 014_customer_account.sql
-- ============================================================
-- ==============================================================================
-- Migration 014: Customer Account — "My Profile" page
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================
-- Adds a phone number to profiles and a saved-addresses table so registered
-- customers can manage their details at /account (Personal Info, Delivery
-- Addresses, Security tabs).

-- ------------------------------------------------------------------------------
-- 1. profiles.phone — edited from the Personal Info tab
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- ------------------------------------------------------------------------------
-- 2. Saved delivery addresses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON public.customer_addresses(user_id, created_at DESC);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Users manage their own addresses"
  ON public.customer_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all addresses" ON public.customer_addresses;
CREATE POLICY "Admins read all addresses"
  ON public.customer_addresses FOR SELECT
  USING (public.is_admin());

-- Only one default address per customer
CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.customer_addresses
       SET is_default = FALSE
     WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_default_address ON public.customer_addresses;
CREATE TRIGGER trg_single_default_address
  AFTER INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW WHEN (NEW.is_default)
  EXECUTE FUNCTION public.enforce_single_default_address();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 017_razorpay_credentials.sql
-- ============================================================
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

