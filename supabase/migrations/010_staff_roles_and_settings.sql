-- ==============================================================================
-- Migration 010: Staff roles & permissions, store settings, profile hardening
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================

-- Re-declared here so this migration does not depend on 009 having run.
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
-- 1. Profile security fixes
-- ------------------------------------------------------------------------------

-- (a) The old "Admins can read all profiles" policy queried profiles from inside a
--     profiles policy, which Postgres rejects as infinite recursion. is_admin() is
--     SECURITY DEFINER, so it bypasses RLS and avoids the loop.
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- (b) New sign-ups could previously choose their own role through user metadata
--     (signUp({ options: { data: { role: 'admin' } } })). Always start as customer.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 2. Staff roles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  description TEXT,
  -- { "orders": ["view", "edit"], "products": ["view", "create", "edit", "delete"], ... }
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_role_id UUID REFERENCES public.staff_roles(id) ON DELETE RESTRICT;
-- RESTRICT (not SET NULL): a NULL staff role means Super Admin, so deleting a role must never silently promote its members.
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role_id);

-- Super Admin = admin with no staff role. Only they may manage staff and roles.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND staff_role_id IS NULL
  );
$;

-- (c) Users may still edit their own profile (name etc.), but only a Super Admin may
--     change anyone's role or staff role — including their own.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.staff_role_id IS DISTINCT FROM OLD.staff_role_id)
     AND auth.uid() IS NOT NULL
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only a Super Admin can change roles' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileges ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read staff roles" ON public.staff_roles;
CREATE POLICY "Admins read staff roles"
  ON public.staff_roles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert staff roles" ON public.staff_roles;
CREATE POLICY "Admins insert staff roles"
  ON public.staff_roles FOR INSERT
  WITH CHECK (public.is_super_admin() AND NOT is_system);

DROP POLICY IF EXISTS "Admins update staff roles" ON public.staff_roles;
CREATE POLICY "Admins update staff roles"
  ON public.staff_roles FOR UPDATE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins delete custom staff roles" ON public.staff_roles;
CREATE POLICY "Admins delete custom staff roles"
  ON public.staff_roles FOR DELETE
  USING (public.is_super_admin() AND NOT is_system);

-- Seed the built-in Admin role with every permission
INSERT INTO public.staff_roles (name, description, is_system, permissions)
VALUES (
  'Admin',
  'Administrator with full store management privileges',
  TRUE,
  '{
    "dashboard": ["view"],
    "orders": ["view", "edit"],
    "products": ["view", "create", "edit", "delete"],
    "categories": ["view", "create", "edit", "delete"],
    "customers": ["view"],
    "payments": ["view", "edit"],
    "coupons": ["view", "create", "edit", "delete"],
    "reviews": ["view", "edit", "delete"],
    "inquiries": ["view", "edit", "delete"],
    "legal": ["view", "create", "edit", "delete"],
    "staff": ["view"],
    "settings": ["view", "edit"]
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Store settings (single row, id = 1)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Storefront reads shipping/tax/contact settings, so reads are public.
DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
CREATE POLICY "Anyone can read store settings"
  ON public.store_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins update store settings" ON public.store_settings;
CREATE POLICY "Admins update store settings"
  ON public.store_settings FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert store settings" ON public.store_settings;
CREATE POLICY "Admins insert store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- updated_at maintenance
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_roles_updated_at ON public.staff_roles;
CREATE TRIGGER trg_staff_roles_updated_at BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
