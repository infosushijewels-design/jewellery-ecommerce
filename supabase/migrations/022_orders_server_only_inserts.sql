-- ==============================================================================
-- 022: Orders and order items can only be created by the server
--
-- Orders are now created by /api/orders (service role), which prices the cart from the
-- catalogue and marks an order paid only after Razorpay confirms the payment. The browser
-- must therefore no longer be able to INSERT into these tables: with these two rules in
-- place anyone could create a "paid" order (or any total) straight from the browser.
--
-- !!  APPLY THIS ONLY AFTER the new app code (with /api/orders) is deployed to production.
-- !!  The previously deployed checkout inserts from the browser and would stop saving orders.
--
-- The service role bypasses RLS, so the app is unaffected. Safe to re-run.
-- ==============================================================================

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
