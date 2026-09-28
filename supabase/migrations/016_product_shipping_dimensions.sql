-- ==============================================================================
-- Migration 016: Product shipping dimensions
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================
-- Shiprocket's "Create Order" API needs a package weight and box dimensions.
-- Real per-product values aren't captured anywhere yet, so these default to a
-- small jewellery box (10 x 10 x 5 cm, 500g) — safe enough that shipment
-- creation never fails for missing data. Update individual products with
-- accurate values whenever convenient; nothing breaks in the meantime.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_cm NUMERIC(6,2) NOT NULL DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS breadth_cm NUMERIC(6,2) NOT NULL DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_cm NUMERIC(6,2) NOT NULL DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,3) NOT NULL DEFAULT 0.5;

ALTER TABLE public.products ADD CONSTRAINT products_length_cm_positive CHECK (length_cm > 0) NOT VALID;
ALTER TABLE public.products ADD CONSTRAINT products_breadth_cm_positive CHECK (breadth_cm > 0) NOT VALID;
ALTER TABLE public.products ADD CONSTRAINT products_height_cm_positive CHECK (height_cm > 0) NOT VALID;
ALTER TABLE public.products ADD CONSTRAINT products_weight_kg_positive CHECK (weight_kg > 0) NOT VALID;
