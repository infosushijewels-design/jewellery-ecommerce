-- ==============================================================================
-- Migration 015: Shiprocket integration
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================
-- IMPORTANT: credentials live in their OWN table with no public read policy —
-- unlike public.store_settings (which is intentionally public-readable so the
-- storefront can show contact/shipping/tax info, and therefore must never
-- hold secrets). Keep API keys and passwords out of store_settings.settings.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ------------------------------------------------------------------------------
-- 1. Shiprocket credentials — a single row, admin-only in both directions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shiprocket_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces a single row
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  pickup_location_name TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shiprocket_credentials ENABLE ROW LEVEL SECURITY;

-- No "Anyone can read" policy here on purpose — this table holds a password.
DROP POLICY IF EXISTS "Admins read shiprocket credentials" ON public.shiprocket_credentials;
CREATE POLICY "Admins read shiprocket credentials"
  ON public.shiprocket_credentials FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert shiprocket credentials" ON public.shiprocket_credentials;
CREATE POLICY "Admins insert shiprocket credentials"
  ON public.shiprocket_credentials FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update shiprocket credentials" ON public.shiprocket_credentials;
CREATE POLICY "Admins update shiprocket credentials"
  ON public.shiprocket_credentials FOR UPDATE
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

DROP TRIGGER IF EXISTS trg_shiprocket_credentials_updated_at ON public.shiprocket_credentials;
CREATE TRIGGER trg_shiprocket_credentials_updated_at
  BEFORE UPDATE ON public.shiprocket_credentials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Shipment tracking fields on orders — filled in once a shipment is created
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS awb_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_status TEXT;
