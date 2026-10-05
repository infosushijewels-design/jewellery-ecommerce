-- ==============================================================================
-- 025: Staff permissions are enforced by the database, per section
--
-- The admin screens already hide what a staff role may not use, but 46 database rules only asked "is this person
-- an admin?" (is_admin()), so a limited staff member could still read or change anything by calling the API
-- directly. Each rule below now asks for the permission of the section the table belongs to, using the SAME
-- permission model as the admin UI (lib/permissions.ts):
--
--     has_permission('orders', 'edit')   ->  Super Admin (an admin with no staff role) is always allowed;
--                                            a staff member needs that action in their role's permissions
--                                            (any action on a section also implies "view", as in the UI).
--
-- Where a section has no matching action (e.g. Customers is view-only, Orders has no create/delete) the nearest
-- lower one is used, so nothing the UI allows is blocked. Payment-gateway keys and coupons need "settings: edit".
-- Staff-role rules (Super Admin only) and "every admin can read roles" are unchanged. Profile updates by others
-- are Super Admin only (role changes were already guarded by a trigger).
--
-- Today there is one Super Admin and no staff accounts, so nothing changes in practice.
-- Safe to re-run. To undo: supabase/rollbacks/025_staff_permissions_rollback.sql
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.has_permission(p_module TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN p.role <> 'admin' THEN FALSE
      WHEN p.staff_role_id IS NULL THEN TRUE            -- Super Admin: everything
      ELSE COALESCE(
        (sr.permissions -> p_module) ? p_action
        OR (p_action = 'view'
            AND jsonb_typeof(sr.permissions -> p_module) = 'array'
            AND jsonb_array_length(sr.permissions -> p_module) > 0),
        FALSE)
    END
    FROM public.profiles p
    LEFT JOIN public.staff_roles sr ON sr.id = p.staff_role_id
    WHERE p.id = auth.uid()
  ), FALSE);
$$;

-- categories · Admins can insert categories  ->  categories:create
ALTER POLICY "Admins can insert categories" ON public.categories
  WITH CHECK (public.has_permission('categories', 'create'));

-- categories · Admins can delete categories  ->  categories:delete
ALTER POLICY "Admins can delete categories" ON public.categories
  USING (public.has_permission('categories', 'delete'));

-- categories · Admins can update categories  ->  categories:edit
ALTER POLICY "Admins can update categories" ON public.categories
  USING (public.has_permission('categories', 'edit')) WITH CHECK (public.has_permission('categories', 'edit'));

-- contact_inquiries · Admins delete inquiries  ->  inquiries:delete
ALTER POLICY "Admins delete inquiries" ON public.contact_inquiries
  USING (public.has_permission('inquiries', 'delete'));

-- contact_inquiries · Admins read inquiries  ->  inquiries:view
ALTER POLICY "Admins read inquiries" ON public.contact_inquiries
  USING (public.has_permission('inquiries', 'view'));

-- contact_inquiries · Admins update inquiries  ->  inquiries:edit
ALTER POLICY "Admins update inquiries" ON public.contact_inquiries
  USING (public.has_permission('inquiries', 'edit'));

-- coupons · Admins manage coupons  ->  settings:edit
ALTER POLICY "Admins manage coupons" ON public.coupons
  USING (public.has_permission('settings', 'edit')) WITH CHECK (public.has_permission('settings', 'edit'));

-- customer_addresses · Admins read all addresses  ->  customers:view
ALTER POLICY "Admins read all addresses" ON public.customer_addresses
  USING (public.has_permission('customers', 'view'));

-- customer_notes · Admins write customer notes  ->  customers:view
ALTER POLICY "Admins write customer notes" ON public.customer_notes
  WITH CHECK (public.has_permission('customers', 'view'));

-- customer_notes · Admins delete customer notes  ->  customers:view
ALTER POLICY "Admins delete customer notes" ON public.customer_notes
  USING (public.has_permission('customers', 'view'));

-- customer_notes · Admins read customer notes  ->  customers:view
ALTER POLICY "Admins read customer notes" ON public.customer_notes
  USING (public.has_permission('customers', 'view'));

-- legal_pages · Admins insert legal pages  ->  legal:create
ALTER POLICY "Admins insert legal pages" ON public.legal_pages
  WITH CHECK (public.has_permission('legal', 'create'));

-- legal_pages · Admins delete legal pages  ->  legal:delete
ALTER POLICY "Admins delete legal pages" ON public.legal_pages
  USING (public.has_permission('legal', 'delete'));

-- legal_pages · Anyone can read active legal pages  ->  legal:view
ALTER POLICY "Anyone can read active legal pages" ON public.legal_pages
  USING ((is_active OR public.has_permission('legal', 'view')));

-- legal_pages · Admins update legal pages  ->  legal:edit
ALTER POLICY "Admins update legal pages" ON public.legal_pages
  USING (public.has_permission('legal', 'edit'));

-- order_items · Admins can read all order items  ->  orders:view
ALTER POLICY "Admins can read all order items" ON public.order_items
  USING (public.has_permission('orders', 'view'));

-- orders · Admins can read all orders  ->  orders:view
ALTER POLICY "Admins can read all orders" ON public.orders
  USING (public.has_permission('orders', 'view'));

-- orders · Admins can update orders  ->  orders:edit
ALTER POLICY "Admins can update orders" ON public.orders
  USING (public.has_permission('orders', 'edit'));

-- product_reviews · Admins delete reviews  ->  reviews:delete
ALTER POLICY "Admins delete reviews" ON public.product_reviews
  USING (public.has_permission('reviews', 'delete'));

-- product_reviews · Anyone can read approved reviews  ->  reviews:view
ALTER POLICY "Anyone can read approved reviews" ON public.product_reviews
  USING (((status = 'approved'::text) OR public.has_permission('reviews', 'view')));

-- product_reviews · Admins update reviews  ->  reviews:edit
ALTER POLICY "Admins update reviews" ON public.product_reviews
  USING (public.has_permission('reviews', 'edit'));

-- product_variants · Admins can insert product_variants  ->  products:create
ALTER POLICY "Admins can insert product_variants" ON public.product_variants
  WITH CHECK (public.has_permission('products', 'create'));

-- product_variants · Admins can delete product_variants  ->  products:delete
ALTER POLICY "Admins can delete product_variants" ON public.product_variants
  USING (public.has_permission('products', 'delete'));

-- product_variants · Admins can update product_variants  ->  products:edit
ALTER POLICY "Admins can update product_variants" ON public.product_variants
  USING (public.has_permission('products', 'edit')) WITH CHECK (public.has_permission('products', 'edit'));

-- products · Admins can insert products  ->  products:create
ALTER POLICY "Admins can insert products" ON public.products
  WITH CHECK (public.has_permission('products', 'create'));

-- products · Admins can delete products  ->  products:delete
ALTER POLICY "Admins can delete products" ON public.products
  USING (public.has_permission('products', 'delete'));

-- products · Admins can update products  ->  products:edit
ALTER POLICY "Admins can update products" ON public.products
  USING (public.has_permission('products', 'edit')) WITH CHECK (public.has_permission('products', 'edit'));

-- profiles · Admins can read all profiles  ->  customers:view
ALTER POLICY "Admins can read all profiles" ON public.profiles
  USING (public.has_permission('customers', 'view'));

-- profiles · Admins can update all profiles  ->  super admin only (role changes are also guarded by trigger)
ALTER POLICY "Admins can update all profiles" ON public.profiles
  USING (public.is_super_admin());

-- razorpay_credentials · Admins insert razorpay credentials  ->  settings:edit
ALTER POLICY "Admins insert razorpay credentials" ON public.razorpay_credentials
  WITH CHECK (public.has_permission('settings', 'edit'));

-- razorpay_credentials · Admins read razorpay credentials  ->  settings:edit
ALTER POLICY "Admins read razorpay credentials" ON public.razorpay_credentials
  USING (public.has_permission('settings', 'edit'));

-- razorpay_credentials · Admins update razorpay credentials  ->  settings:edit
ALTER POLICY "Admins update razorpay credentials" ON public.razorpay_credentials
  USING (public.has_permission('settings', 'edit'));

-- shiprocket_credentials · Admins insert shiprocket credentials  ->  settings:edit
ALTER POLICY "Admins insert shiprocket credentials" ON public.shiprocket_credentials
  WITH CHECK (public.has_permission('settings', 'edit'));

-- shiprocket_credentials · Admins read shiprocket credentials  ->  settings:edit
ALTER POLICY "Admins read shiprocket credentials" ON public.shiprocket_credentials
  USING (public.has_permission('settings', 'edit'));

-- shiprocket_credentials · Admins update shiprocket credentials  ->  settings:edit
ALTER POLICY "Admins update shiprocket credentials" ON public.shiprocket_credentials
  USING (public.has_permission('settings', 'edit'));

-- store_branches · Admins insert store branches  ->  stores:create
ALTER POLICY "Admins insert store branches" ON public.store_branches
  WITH CHECK (public.has_permission('stores', 'create'));

-- store_branches · Admins delete store branches  ->  stores:delete
ALTER POLICY "Admins delete store branches" ON public.store_branches
  USING (public.has_permission('stores', 'delete'));

-- store_branches · Anyone can read active store branches  ->  stores:view
ALTER POLICY "Anyone can read active store branches" ON public.store_branches
  USING ((is_active OR public.has_permission('stores', 'view')));

-- store_branches · Admins update store branches  ->  stores:edit
ALTER POLICY "Admins update store branches" ON public.store_branches
  WITH CHECK (public.has_permission('stores', 'edit'));

-- store_settings · Admins insert store settings  ->  settings:edit
ALTER POLICY "Admins insert store settings" ON public.store_settings
  WITH CHECK (public.has_permission('settings', 'edit'));

-- store_settings · Admins update store settings  ->  settings:edit
ALTER POLICY "Admins update store settings" ON public.store_settings
  USING (public.has_permission('settings', 'edit'));

-- video_appointments · Admins delete appointments  ->  appointments:delete
ALTER POLICY "Admins delete appointments" ON public.video_appointments
  USING (public.has_permission('appointments', 'delete'));

-- video_appointments · Admins read appointments  ->  appointments:view
ALTER POLICY "Admins read appointments" ON public.video_appointments
  USING (public.has_permission('appointments', 'view'));

-- video_appointments · Admins update appointments  ->  appointments:edit
ALTER POLICY "Admins update appointments" ON public.video_appointments
  USING (public.has_permission('appointments', 'edit'));

-- wishlist_items · Admins can view all wishlists  ->  customers:view
ALTER POLICY "Admins can view all wishlists" ON public.wishlist_items
  USING (public.has_permission('customers', 'view'));
