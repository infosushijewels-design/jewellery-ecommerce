-- Security cleanup (L2): revoke EXECUTE from PUBLIC/anon/authenticated on 7 functions that are
-- only ever invoked as triggers, never called directly by application code, another database
-- function, or a scheduled job (verified via pg_trigger, a full-text search of every function body
-- in `public`, and a grep of the frontend codebase for `.rpc()` calls — zero other callers found
-- for any of the 7).
--
-- Each is `RETURNS trigger`, which PostgreSQL only permits the trigger executor to invoke — a direct
-- call (including through PostgREST's /rest/v1/rpc/<fn> endpoint, which is what Supabase's advisor
-- flags) always fails with "trigger functions can only be called as triggers" regardless of who is
-- calling or what grant they hold. Revoking these grants removes an inert, unused permission; it
-- does not require the firing role (anon/authenticated) to hold EXECUTE, because PostgreSQL invokes
-- a trigger internally via the query executor, not through the same privilege-checked call path as
-- a direct function call.
--
-- postgres (owner) and service_role are left untouched — nothing here affects them.
--
-- Deliberately NOT touched by this migration (confirmed genuinely public/intentional, not trigger
-- functions, needed by the app's own client-side permission checks and the public booking calendar):
--   is_admin(), is_super_admin(), has_permission(text, text), get_booked_slots(timestamptz, timestamptz)
--
-- Functions and the trigger each one serves (for reference — revoking EXECUTE does not detach these):
--   audit_row_change                 -> audit_categories (categories), audit_orders (orders), audit_products (products)
--   enforce_single_default_address   -> trg_single_default_address (customer_addresses)
--   guard_order_updates              -> trg_guard_order_updates (orders)
--   guard_profile_privileges         -> trg_guard_profile_privileges (profiles)
--   handle_new_user                  -> on_auth_user_created (auth.users) — creates the profiles row on signup
--   orders_stock_on_delete           -> trg_orders_stock_on_delete (orders)
--   orders_stock_on_status           -> trg_orders_stock_on_status (orders)
--
-- NOT applied automatically. Review, then apply via the same workflow used for prior migrations
-- (036, 037) — and run the Phase 4 verification pass (signup as anon, order/profile/address updates
-- as authenticated) before considering this done.

REVOKE EXECUTE ON FUNCTION public.audit_row_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_address() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_order_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileges() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_stock_on_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_stock_on_status() FROM PUBLIC, anon, authenticated;
