-- Adds covering indexes for foreign-key columns with no existing index, so that
-- (a) joins/filters on these columns use an index scan instead of a sequential
-- scan, and (b) ON DELETE SET NULL / CASCADE actions on the referenced table
-- (e.g. deleting a product) don't force a full scan of the child table to find
-- rows to update/cascade. All five tables are currently small, so write/storage
-- overhead is negligible today; this is about not paying for a sequential scan
-- later as orders/wishlist/reviews grow.

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id
  ON public.wishlist_items (product_id);

CREATE INDEX IF NOT EXISTS idx_customer_notes_author_id
  ON public.customer_notes (author_id);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_user_id
  ON public.customer_notes (customer_user_id);

CREATE INDEX IF NOT EXISTS idx_order_refunds_created_by
  ON public.order_refunds (created_by);

CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id
  ON public.product_reviews (user_id);
