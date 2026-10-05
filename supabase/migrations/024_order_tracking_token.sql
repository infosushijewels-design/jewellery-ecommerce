-- ==============================================================================
-- 024: Secret tracking token per order (guest order tracking from any device)
--
-- A guest has no account, and the database rightly lets nobody read an order they don't own, so a guest opening
-- the "Track Your Order" email link on a different phone or laptop saw "not found". Each order now carries a
-- random, unguessable token (128 bits). The tracking link in the email includes it
-- (/orders/<number>?t=<token>) and the server looks the order up by number + token, so only someone holding the
-- link can see that order — nothing else about it is exposed.
--
-- Existing orders get their own random token too (a volatile DEFAULT is evaluated per row). Customers can't
-- change it: the order-update guard blocks every column except user_id. Safe to re-run.
-- ==============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_tracking_token ON public.orders (tracking_token);
