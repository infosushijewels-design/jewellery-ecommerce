-- ==============================================================================
-- MASTER DATABASE SETUP SCRIPT (Migrations 001 to 013 + Admin Promotion)
-- Sushi Jewels E-Commerce Platform
-- 
-- Execute this entire file in Supabase Dashboard -> SQL Editor
-- (https://supabase.com/dashboard/project/frlyjqyqbjxgorglvbdl/sql/new)
-- ==============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Categories, Collections, Products (001, 004, 007, 008)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure category columns exist if table already pre-existed
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL,
  material text NOT NULL,
  certification text,
  badge text,
  image_url text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  is_featured boolean DEFAULT false,
  is_new_arrival boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure product columns exist if table already pre-existed (Migration 004 & 007)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_sizes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Indexes for lookup
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON public.products(is_new_arrival);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Read policies
DROP POLICY IF EXISTS "Enable read access for all users on categories" ON public.categories;
CREATE POLICY "Enable read access for all users on categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users on collections" ON public.collections;
CREATE POLICY "Enable read access for all users on collections" ON public.collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users on products" ON public.products;
CREATE POLICY "Enable read access for all users on products" ON public.products FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 2. Wishlist Items (002)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can view their own wishlist" ON public.wishlist_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can insert their own wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can delete their own wishlist" ON public.wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Staff Roles & Profiles (003, 010)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure staff_role_id exists if profiles pre-existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_role_id UUID REFERENCES public.staff_roles(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

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

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Handle New User Trigger
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Guard profile privilege changes
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

-- ------------------------------------------------------------------------------
-- 4. Orders & Order Items (003, 005)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_email ON public.orders ((shipping_address->>'email'));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders" ON public.orders FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view guest orders matching their email" ON public.orders;
CREATE POLICY "Users can view guest orders matching their email"
  ON public.orders FOR SELECT
  USING (
    user_id IS NULL
    AND shipping_address->>'email' = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can claim guest orders matching their email" ON public.orders;
CREATE POLICY "Users can claim guest orders matching their email"
  ON public.orders FOR UPDATE
  USING (
    user_id IS NULL
    AND shipping_address->>'email' = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR user_id IS NULL))
);

DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items" ON public.order_items FOR SELECT USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. Product Variants (006, 007)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  karat TEXT,
  metal_color TEXT,
  weight NUMERIC(10, 3),
  price NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS sku TEXT;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users on product_variants" ON public.product_variants;
CREATE POLICY "Enable read access for all users on product_variants" ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert product_variants" ON public.product_variants;
CREATE POLICY "Admins can insert product_variants" ON public.product_variants FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update product_variants" ON public.product_variants;
CREATE POLICY "Admins can update product_variants" ON public.product_variants FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product_variants" ON public.product_variants;
CREATE POLICY "Admins can delete product_variants" ON public.product_variants FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. Coupons, Reviews, Inquiries, Legal (009)
-- ------------------------------------------------------------------------------
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

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
CREATE POLICY "Anyone can read approved reviews" ON public.product_reviews FOR SELECT USING (status = 'approved' OR public.is_admin());
DROP POLICY IF EXISTS "Anyone can submit a pending review" ON public.product_reviews;
CREATE POLICY "Anyone can submit a pending review" ON public.product_reviews FOR INSERT WITH CHECK (status = 'pending' AND admin_reply IS NULL);
DROP POLICY IF EXISTS "Admins update reviews" ON public.product_reviews;
CREATE POLICY "Admins update reviews" ON public.product_reviews FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins delete reviews" ON public.product_reviews;
CREATE POLICY "Admins delete reviews" ON public.product_reviews FOR DELETE USING (public.is_admin());

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
CREATE POLICY "Anyone can submit an inquiry" ON public.contact_inquiries FOR INSERT WITH CHECK (status = 'new');
DROP POLICY IF EXISTS "Admins read inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins read inquiries" ON public.contact_inquiries FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins update inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins update inquiries" ON public.contact_inquiries FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins delete inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins delete inquiries" ON public.contact_inquiries FOR DELETE USING (public.is_admin());

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
CREATE POLICY "Anyone can read active legal pages" ON public.legal_pages FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admins insert legal pages" ON public.legal_pages;
CREATE POLICY "Admins insert legal pages" ON public.legal_pages FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins update legal pages" ON public.legal_pages;
CREATE POLICY "Admins update legal pages" ON public.legal_pages FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "Admins delete legal pages" ON public.legal_pages;
CREATE POLICY "Admins delete legal pages" ON public.legal_pages FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. Store Settings & Staff Roles Permissions (010)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins read staff roles" ON public.staff_roles;
CREATE POLICY "Admins read staff roles" ON public.staff_roles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert staff roles" ON public.staff_roles;
CREATE POLICY "Admins insert staff roles" ON public.staff_roles FOR INSERT WITH CHECK (public.is_super_admin() AND NOT is_system);

DROP POLICY IF EXISTS "Admins update staff roles" ON public.staff_roles;
CREATE POLICY "Admins update staff roles" ON public.staff_roles FOR UPDATE USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins delete custom staff roles" ON public.staff_roles;
CREATE POLICY "Admins delete custom staff roles" ON public.staff_roles FOR DELETE USING (public.is_super_admin() AND NOT is_system);

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

CREATE TABLE IF NOT EXISTS public.store_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read store settings" ON public.store_settings;
CREATE POLICY "Anyone can read store settings" ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins update store settings" ON public.store_settings;
CREATE POLICY "Admins update store settings" ON public.store_settings FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert store settings" ON public.store_settings;
CREATE POLICY "Admins insert store settings" ON public.store_settings FOR INSERT WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. Media Storage (011)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media',
  'store-media',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read store media" ON storage.objects;
CREATE POLICY "Public read store media" ON storage.objects FOR SELECT USING (bucket_id = 'store-media');

DROP POLICY IF EXISTS "Admins upload store media" ON storage.objects;
CREATE POLICY "Admins upload store media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update store media" ON storage.objects;
CREATE POLICY "Admins update store media" ON storage.objects FOR UPDATE USING (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete store media" ON storage.objects;
CREATE POLICY "Admins delete store media" ON storage.objects FOR DELETE USING (bucket_id = 'store-media' AND public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. Store Branches (012)
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.store_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active store branches" ON public.store_branches;
CREATE POLICY "Anyone can read active store branches" ON public.store_branches FOR SELECT USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "Admins insert store branches" ON public.store_branches;
CREATE POLICY "Admins insert store branches" ON public.store_branches FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update store branches" ON public.store_branches;
CREATE POLICY "Admins update store branches" ON public.store_branches FOR UPDATE WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete store branches" ON public.store_branches;
CREATE POLICY "Admins delete store branches" ON public.store_branches FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. Customer CRM (013)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL CHECK (length(trim(note)) > 0),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read customer notes" ON public.customer_notes;
CREATE POLICY "Admins read customer notes" ON public.customer_notes FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins write customer notes" ON public.customer_notes;
CREATE POLICY "Admins write customer notes" ON public.customer_notes FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete customer notes" ON public.customer_notes;
CREATE POLICY "Admins delete customer notes" ON public.customer_notes FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all wishlists" ON public.wishlist_items;
CREATE POLICY "Admins can view all wishlists" ON public.wishlist_items FOR SELECT USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. PROMOTE ANJALIWORKSPHERE@GMAIL.COM TO SUPER ADMIN
-- ------------------------------------------------------------------------------
UPDATE public.profiles
   SET role = 'admin', staff_role_id = NULL
 WHERE lower(email) = lower('anjaliworksphere@gmail.com');

INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 'admin'
  FROM auth.users u
 WHERE lower(u.email) = lower('anjaliworksphere@gmail.com')
ON CONFLICT (id) DO UPDATE SET role = 'admin', staff_role_id = NULL;

-- Verification query
SELECT id, email, role, staff_role_id FROM public.profiles WHERE lower(email) = lower('anjaliworksphere@gmail.com');
