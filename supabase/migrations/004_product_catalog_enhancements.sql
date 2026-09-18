-- ==============================================================================
-- Migration 004: Product Catalog Enhancements (Phase 3 — UX & Conversion)
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================

-- MRP for strikethrough discount presentation (nullable — no discount when unset or <= price)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp NUMERIC(10, 2);

-- Stock count for scarcity indicators & sold-out state
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 10;

-- Additional gallery image URLs shown alongside the primary image_url
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}';

-- Available sizes for this piece (ring sizes, bangle sizes, etc.)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_sizes TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
