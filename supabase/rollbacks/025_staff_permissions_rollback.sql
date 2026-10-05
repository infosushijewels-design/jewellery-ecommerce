-- Puts the permission rules from migration 025 back to "any admin" (is_admin()), exactly as they were before it.
-- The has_permission() function is left in place (harmless).

ALTER POLICY "Admins can insert categories" ON public.categories
  WITH CHECK (is_admin());

ALTER POLICY "Admins can delete categories" ON public.categories
  USING (is_admin());

ALTER POLICY "Admins can update categories" ON public.categories
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "Admins delete inquiries" ON public.contact_inquiries
  USING (is_admin());

ALTER POLICY "Admins read inquiries" ON public.contact_inquiries
  USING (is_admin());

ALTER POLICY "Admins update inquiries" ON public.contact_inquiries
  USING (is_admin());

ALTER POLICY "Admins manage coupons" ON public.coupons
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "Admins read all addresses" ON public.customer_addresses
  USING (is_admin());

ALTER POLICY "Admins write customer notes" ON public.customer_notes
  WITH CHECK (is_admin());

ALTER POLICY "Admins delete customer notes" ON public.customer_notes
  USING (is_admin());

ALTER POLICY "Admins read customer notes" ON public.customer_notes
  USING (is_admin());

ALTER POLICY "Admins insert legal pages" ON public.legal_pages
  WITH CHECK (is_admin());

ALTER POLICY "Admins delete legal pages" ON public.legal_pages
  USING (is_admin());

ALTER POLICY "Anyone can read active legal pages" ON public.legal_pages
  USING ((is_active OR is_admin()));

ALTER POLICY "Admins update legal pages" ON public.legal_pages
  USING (is_admin());

ALTER POLICY "Admins can read all order items" ON public.order_items
  USING (is_admin());

ALTER POLICY "Admins can read all orders" ON public.orders
  USING (is_admin());

ALTER POLICY "Admins can update orders" ON public.orders
  USING (is_admin());

ALTER POLICY "Admins delete reviews" ON public.product_reviews
  USING (is_admin());

ALTER POLICY "Anyone can read approved reviews" ON public.product_reviews
  USING (((status = 'approved'::text) OR is_admin()));

ALTER POLICY "Admins update reviews" ON public.product_reviews
  USING (is_admin());

ALTER POLICY "Admins can insert product_variants" ON public.product_variants
  WITH CHECK (is_admin());

ALTER POLICY "Admins can delete product_variants" ON public.product_variants
  USING (is_admin());

ALTER POLICY "Admins can update product_variants" ON public.product_variants
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "Admins can insert products" ON public.products
  WITH CHECK (is_admin());

ALTER POLICY "Admins can delete products" ON public.products
  USING (is_admin());

ALTER POLICY "Admins can update products" ON public.products
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "Admins can read all profiles" ON public.profiles
  USING (is_admin());

ALTER POLICY "Admins can update all profiles" ON public.profiles
  USING (is_admin());

ALTER POLICY "Admins insert razorpay credentials" ON public.razorpay_credentials
  WITH CHECK (is_admin());

ALTER POLICY "Admins read razorpay credentials" ON public.razorpay_credentials
  USING (is_admin());

ALTER POLICY "Admins update razorpay credentials" ON public.razorpay_credentials
  USING (is_admin());

ALTER POLICY "Admins insert shiprocket credentials" ON public.shiprocket_credentials
  WITH CHECK (is_admin());

ALTER POLICY "Admins read shiprocket credentials" ON public.shiprocket_credentials
  USING (is_admin());

ALTER POLICY "Admins update shiprocket credentials" ON public.shiprocket_credentials
  USING (is_admin());

ALTER POLICY "Admins insert store branches" ON public.store_branches
  WITH CHECK (is_admin());

ALTER POLICY "Admins delete store branches" ON public.store_branches
  USING (is_admin());

ALTER POLICY "Anyone can read active store branches" ON public.store_branches
  USING ((is_active OR is_admin()));

ALTER POLICY "Admins update store branches" ON public.store_branches
  WITH CHECK (is_admin());

ALTER POLICY "Admins insert store settings" ON public.store_settings
  WITH CHECK (is_admin());

ALTER POLICY "Admins update store settings" ON public.store_settings
  USING (is_admin());

ALTER POLICY "Admins delete appointments" ON public.video_appointments
  USING (is_admin());

ALTER POLICY "Admins read appointments" ON public.video_appointments
  USING (is_admin());

ALTER POLICY "Admins update appointments" ON public.video_appointments
  USING (is_admin());

ALTER POLICY "Admins can view all wishlists" ON public.wishlist_items
  USING (is_admin());
