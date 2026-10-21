-- ==============================================================================
-- Migration 041: Hero banner video storage
-- Sushi Jewels E-Commerce Platform
--   Dedicated public bucket "hero-video" for the homepage hero video upload
--   (Admin -> Settings -> Homepage). Kept separate from "store-media" (migration
--   011) rather than raising that bucket's 5MB/image-only limits for everyone —
--   same RLS pattern: anyone can view, only admins can upload/replace/delete.
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-video',
  'hero-video',
  TRUE,
  26214400, -- 25 MB
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read hero video" ON storage.objects;
CREATE POLICY "Public read hero video"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-video');

DROP POLICY IF EXISTS "Admins upload hero video" ON storage.objects;
CREATE POLICY "Admins upload hero video"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-video' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update hero video" ON storage.objects;
CREATE POLICY "Admins update hero video"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hero-video' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete hero video" ON storage.objects;
CREATE POLICY "Admins delete hero video"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-video' AND public.is_admin());
