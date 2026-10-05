-- ==============================================================================
-- 020: order_items — add the `metal` and `size` columns the app writes and reads
--
-- Migration 003 defines these columns, but the live table was originally created
-- with a `selected_size` column instead (CREATE TABLE IF NOT EXISTS never altered
-- it). Every order-item insert from the app therefore failed, leaving orders with
-- no items. This migration is additive and safe to re-run; `selected_size` is
-- kept (read-only legacy) and copied into `size` for any rows that have it.
-- ==============================================================================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS metal TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT;

UPDATE public.order_items
   SET size = selected_size
 WHERE size IS NULL
   AND selected_size IS NOT NULL;
