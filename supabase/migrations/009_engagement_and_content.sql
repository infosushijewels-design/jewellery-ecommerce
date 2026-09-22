-- ==============================================================================
-- Migration 009: Coupons, product reviews, contact inquiries & legal pages
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================

-- Helper: is the current user an admin?
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
-- 1. Coupons
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

-- ------------------------------------------------------------------------------
-- 2. Product reviews (moderated)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. Contact inquiries
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 4. Legal / information pages (override built-in pages by slug)
-- ------------------------------------------------------------------------------
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
