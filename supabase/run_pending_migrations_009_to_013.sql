-- ==============================================================================
-- Combined Pending Migrations (009 through 013)
-- Sushi Jewels E-Commerce Platform
-- 
-- Run this script in the Supabase Dashboard -> SQL Editor
-- (https://supabase.com/dashboard/project/frlyjqyqbjxgorglvbdl/sql/new)
-- ==============================================================================

-- ==============================================================================
-- Migration 009: Coupons, product reviews, contact inquiries & legal pages
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

-- 1. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code = upper(code) AND length(code) BETWEEN 3 AND 32),
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount NUMERIC(12, 2) CHECK (max_discount IS NULL OR max_discount > 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (discount_type <> 'percent' OR discount_value <= 100),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Product reviews (moderated)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can read approved reviews"
  ON public.product_reviews FOR SELECT
  USING (status = 'approved' OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can submit a pending review" ON public.product_reviews;
CREATE POLICY "Anyone can submit a pending review"
  ON public.product_reviews FOR INSERT
  WITH CHECK (status = 'pending' AND admin_reply IS NULL AND (user_id IS NULL OR user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins update reviews" ON public.product_reviews;
CREATE POLICY "Admins update reviews"
  ON public.product_reviews FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete reviews" ON public.product_reviews;
CREATE POLICY "Admins delete reviews"
  ON public.product_reviews FOR DELETE
  USING (public.is_admin());

-- 3. Contact inquiries
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit an inquiry"
  ON public.contact_inquiries FOR INSERT
  WITH CHECK (status = 'new' AND admin_notes IS NULL);

DROP POLICY IF EXISTS "Admins read inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins read inquiries"
  ON public.contact_inquiries FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins update inquiries"
  ON public.contact_inquiries FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins delete inquiries"
  ON public.contact_inquiries FOR DELETE
  USING (public.is_admin());

-- 4. Legal / information pages
CREATE TABLE IF NOT EXISTS public.legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary TEXT,
  content TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active legal pages" ON public.legal_pages;
CREATE POLICY "Anyone can read active legal pages"
  ON public.legal_pages FOR SELECT
  USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "Admins insert legal pages" ON public.legal_pages;
CREATE POLICY "Admins insert legal pages"
  ON public.legal_pages FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update legal pages" ON public.legal_pages;
CREATE POLICY "Admins update legal pages"
  ON public.legal_pages FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete legal pages" ON public.legal_pages;
CREATE POLICY "Admins delete legal pages"
  ON public.legal_pages FOR DELETE
  USING (public.is_admin());

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_contact_inquiries_updated_at ON public.contact_inquiries;
CREATE TRIGGER trg_contact_inquiries_updated_at BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_legal_pages_updated_at ON public.legal_pages;
CREATE TRIGGER trg_legal_pages_updated_at BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ==============================================================================
-- Migration 010: Staff roles & permissions, store settings, profile hardening
-- ==============================================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

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

-- Staff roles table
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_role_id UUID REFERENCES public.staff_roles(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role_id);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND staff_role_id IS NULL
  );
$$;

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

-- Seed built-in Admin role
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

-- Store settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

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

DROP TRIGGER IF EXISTS trg_staff_roles_updated_at ON public.staff_roles;
CREATE TRIGGER trg_staff_roles_updated_at BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ==============================================================================
-- Migration 011: Media storage for admin image uploads
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media',
  'store-media',
  TRUE,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read store media" ON storage.objects;
CREATE POLICY "Public read store media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-media');

DROP POLICY IF EXISTS "Admins upload store media" ON storage.objects;
CREATE POLICY "Admins upload store media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update store media" ON storage.objects;
CREATE POLICY "Admins update store media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete store media" ON storage.objects;
CREATE POLICY "Admins delete store media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-media' AND public.is_admin());


-- ==============================================================================
-- Migration 012: Store branches (store locator)
-- ==============================================================================

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

DROP TRIGGER IF EXISTS trg_store_branches_updated_at ON public.store_branches;
CREATE TRIGGER trg_store_branches_updated_at BEFORE UPDATE ON public.store_branches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.store_branches (name, address, city, state, pincode, hours, latitude, longitude, is_flagship, sort_order)
SELECT * FROM (VALUES
  ('Jaipur Flagship', 'MI Road, Heritage District', 'Jaipur', 'Rajasthan', '302001', 'Mon – Sat: 10:00 AM – 7:00 PM', 26.9157, 75.8105, TRUE, 1),
  ('Mumbai Atelier', 'Turner Road, Bandra West', 'Mumbai', 'Maharashtra', '400050', 'Mon – Sat: 10:00 AM – 7:00 PM', 19.0625, 72.8347, FALSE, 2)
) AS seed(name, address, city, state, pincode, hours, latitude, longitude, is_flagship, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.store_branches);

DO $$
BEGIN
  IF to_regclass('public.staff_roles') IS NOT NULL THEN
    UPDATE public.staff_roles
      SET permissions = permissions || '{"stores": ["view", "create", "edit", "delete"]}'::jsonb
      WHERE is_system AND name = 'Admin' AND NOT (permissions ? 'stores');
  END IF;
END $$;


-- ==============================================================================
-- Migration 013: Customer CRM — internal staff notes & wishlist access
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL CHECK (length(trim(note)) > 0),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_email ON public.customer_notes(lower(customer_email), created_at DESC);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read customer notes" ON public.customer_notes;
CREATE POLICY "Admins read customer notes"
  ON public.customer_notes FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins write customer notes" ON public.customer_notes;
CREATE POLICY "Admins write customer notes"
  ON public.customer_notes FOR INSERT
  WITH CHECK (public.is_admin() AND author_id = auth.uid());

DROP POLICY IF EXISTS "Admins delete customer notes" ON public.customer_notes;
CREATE POLICY "Admins delete customer notes"
  ON public.customer_notes FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all wishlists" ON public.wishlist_items;
CREATE POLICY "Admins can view all wishlists"
  ON public.wishlist_items FOR SELECT
  USING (public.is_admin());
