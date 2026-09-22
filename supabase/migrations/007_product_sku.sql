-- ==============================================================================
-- Migration 007: SKU (Stock Keeping Unit) for Products & Variants
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================

-- Base SKU for the product (e.g. "R-101")
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Per-variant SKU (e.g. "R-101-18KYG"), auto-suggested from the base SKU + attributes but editable
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS sku TEXT;
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
