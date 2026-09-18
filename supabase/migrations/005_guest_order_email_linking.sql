-- ==============================================================================
-- Migration 005: Guest Order → Account Auto-Linking (Phase 4)
-- Sushi Jewels E-Commerce Platform
-- ==============================================================================
-- Lets a signed-in user discover and claim guest orders (user_id IS NULL)
-- that were placed under their own registered email address, without
-- requiring a service-role key. A user can only ever see/claim guest orders
-- whose shipping email exactly matches their own profile email, and claiming
-- can only ever assign the order to themselves (auth.uid()).

CREATE POLICY "Users can view guest orders matching their email"
  ON public.orders FOR SELECT
  USING (
    user_id IS NULL
    AND shipping_address->>'email' = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can claim guest orders matching their email"
  ON public.orders FOR UPDATE
  USING (
    user_id IS NULL
    AND shipping_address->>'email' = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_orders_shipping_email ON public.orders ((shipping_address->>'email'));
