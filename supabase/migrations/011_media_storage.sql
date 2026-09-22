-- ==============================================================================
-- Migration 011: Media storage for admin image uploads
-- Sushi Jewels E-Commerce Platform
--   Public bucket "store-media" (products, categories, logo/favicon).
--   Anyone can view files; only admins can upload, replace or delete.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-media',
  'store-media',
  TRUE,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read store media" ON storage.objects;
CREATE POLICY "Public read store media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-media');

DROP POLICY IF EXISTS "Admins upload store media" ON storage.objects;
CREATE POLICY "Admins upload store media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update store media" ON storage.objects;
CREATE POLICY "Admins update store media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'store-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete store media" ON storage.objects;
CREATE POLICY "Admins delete store media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-media' AND public.is_admin());
