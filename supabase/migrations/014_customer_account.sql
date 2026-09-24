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
