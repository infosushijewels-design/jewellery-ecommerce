-- ==============================================================================
-- Migration 012: Store branches (store locator)
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE TABLE IF NOT EXISTS public.store_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  hours TEXT,
  image_url TEXT,
  map_url TEXT,
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  is_flagship BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_branches_active ON public.store_branches(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_store_branches_pincode ON public.store_branches(pincode);

ALTER TABLE public.store_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active store branches" ON public.store_branches;
CREATE POLICY "Anyone can read active store branches"
  ON public.store_branches FOR SELECT
  USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "Admins insert store branches" ON public.store_branches;
CREATE POLICY "Admins insert store branches"
  ON public.store_branches FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update store branches" ON public.store_branches;
CREATE POLICY "Admins update store branches"
  ON public.store_branches FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete store branches" ON public.store_branches;
CREATE POLICY "Admins delete store branches"
  ON public.store_branches FOR DELETE
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

DROP TRIGGER IF EXISTS trg_store_branches_updated_at ON public.store_branches;
CREATE TRIGGER trg_store_branches_updated_at BEFORE UPDATE ON public.store_branches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed the two branches previously hard-coded on the homepage (only if the table is empty)
INSERT INTO public.store_branches (name, address, city, state, pincode, hours, latitude, longitude, is_flagship, sort_order)
SELECT * FROM (VALUES
  ('Jaipur Flagship', 'MI Road, Heritage District', 'Jaipur', 'Rajasthan', '302001', 'Mon – Sat: 10:00 AM – 7:00 PM', 26.9157, 75.8105, TRUE, 1),
  ('Mumbai Atelier', 'Turner Road, Bandra West', 'Mumbai', 'Maharashtra', '400050', 'Mon – Sat: 10:00 AM – 7:00 PM', 19.0625, 72.8347, FALSE, 2)
) AS seed(name, address, city, state, pincode, hours, latitude, longitude, is_flagship, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.store_branches);

-- Give the built-in Admin staff role (migration 010) access to the new Stores module
DO $$
BEGIN
  IF to_regclass('public.staff_roles') IS NOT NULL THEN
    UPDATE public.staff_roles
      SET permissions = permissions || '{"stores": ["view", "create", "edit", "delete"]}'::jsonb
      WHERE is_system AND name = 'Admin' AND NOT (permissions ? 'stores');
  END IF;
END $$;
