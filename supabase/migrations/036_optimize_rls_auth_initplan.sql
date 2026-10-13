-- Performance-only RLS optimization: wrap auth.uid() calls as (select auth.uid())
-- so Postgres evaluates them once per statement (an InitPlan) instead of once per
-- row. This does NOT change who can see or write what — every USING/WITH CHECK
-- expression below is semantically identical to its original, just rewritten so
-- the planner can cache it. See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Scope: only the 12 policies flagged by Supabase's own performance advisor
-- (auth_rls_initplan lint) on customer_addresses, order_items, orders, profiles,
-- and wishlist_items. Admin-only policies that call has_permission()/is_admin()/
-- is_super_admin() are untouched — those functions' internals are out of scope
-- for this migration (per audit instructions: don't rewrite inside functions).
--
-- Not applied automatically. Review, then run via the Supabase CLI / dashboard
-- or the project's normal migration process.

-- ─── customer_addresses ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Users manage their own addresses"
  ON public.customer_addresses FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ─── order_items ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = (select auth.uid()) OR orders.user_id IS NULL)
    )
  );

-- ─── orders ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view guest orders matching their email" ON public.orders;
CREATE POLICY "Users can view guest orders matching their email"
  ON public.orders FOR SELECT
  USING (
    user_id IS NULL
    AND (shipping_address ->> 'email') = (
      SELECT profiles.email FROM public.profiles WHERE profiles.id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can claim guest orders matching their email" ON public.orders;
CREATE POLICY "Users can claim guest orders matching their email"
  ON public.orders FOR UPDATE
  USING (
    user_id IS NULL
    AND (shipping_address ->> 'email') = (
      SELECT profiles.email FROM public.profiles WHERE profiles.id = (select auth.uid())
    )
  )
  WITH CHECK (user_id = (select auth.uid()));

-- ─── profiles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- ─── wishlist_items ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist_items FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can insert their own wishlist"
  ON public.wishlist_items FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can delete their own wishlist"
  ON public.wishlist_items FOR DELETE
  USING ((select auth.uid()) = user_id);
