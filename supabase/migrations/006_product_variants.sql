-- ==============================================================================
-- Migration 006: Product Variants (Karat, Metal Color, Weight, Price, Stock)
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  karat TEXT,
  metal_color TEXT,
  weight NUMERIC(10, 3),
  price NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public read access, matching the products table policy
CREATE POLICY "Enable read access for all users on product_variants"
  ON public.product_variants FOR SELECT
  USING (true);

-- Admins can insert, update, and delete variants
DROP POLICY IF EXISTS "Admins can insert product_variants" ON public.product_variants;
CREATE POLICY "Admins can insert product_variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update product_variants" ON public.product_variants;
CREATE POLICY "Admins can update product_variants"
  ON public.product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete product_variants" ON public.product_variants;
CREATE POLICY "Admins can delete product_variants"
  ON public.product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
