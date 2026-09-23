-- ==============================================================================
-- Migration 013: Customer CRM — internal staff notes + admin view of wishlists
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

-- ------------------------------------------------------------------------------
-- 1. Internal notes about a customer (never shown on the storefront)
--    Keyed by email so guest buyers can be annotated too.
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

-- ------------------------------------------------------------------------------
-- 2. Wishlists were readable only by their owner; the concierge view needs them too
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all wishlists" ON public.wishlist_items;
CREATE POLICY "Admins can view all wishlists"
  ON public.wishlist_items FOR SELECT
  USING (public.is_admin());
