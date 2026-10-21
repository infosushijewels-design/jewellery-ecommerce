-- ==============================================================================
-- Migration 040: Homepage "Explore Our Collections" carousel cards
-- Makes the previously hardcoded ExploreCollections.tsx carousel admin-manageable.
-- Mirrors the store_branches (migration 012) pattern: public reads active rows,
-- only admins (public.is_admin()) can write.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.homepage_collection_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  href TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homepage_collection_cards_active
  ON public.homepage_collection_cards (is_active, sort_order);

ALTER TABLE public.homepage_collection_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active homepage collection cards" ON public.homepage_collection_cards;
CREATE POLICY "Anyone can read active homepage collection cards"
  ON public.homepage_collection_cards FOR SELECT
  USING (is_active OR public.is_admin());

DROP POLICY IF EXISTS "Admins insert homepage collection cards" ON public.homepage_collection_cards;
CREATE POLICY "Admins insert homepage collection cards"
  ON public.homepage_collection_cards FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update homepage collection cards" ON public.homepage_collection_cards;
CREATE POLICY "Admins update homepage collection cards"
  ON public.homepage_collection_cards FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete homepage collection cards" ON public.homepage_collection_cards;
CREATE POLICY "Admins delete homepage collection cards"
  ON public.homepage_collection_cards FOR DELETE
  USING (public.is_admin());

DROP TRIGGER IF EXISTS trg_homepage_collection_cards_updated_at ON public.homepage_collection_cards;
CREATE TRIGGER trg_homepage_collection_cards_updated_at BEFORE UPDATE ON public.homepage_collection_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed with the 5 cards that were previously hardcoded in ExploreCollections.tsx, so
-- switching to the database-backed version changes nothing visually on day one.
-- "Bridal Sets" is seeded with the corrected /collections/bridal-collection route
-- (the old /category/bridal hardcoded link 404s — no such category exists).
INSERT INTO public.homepage_collection_cards (title, subtitle, image_url, href, sort_order)
SELECT * FROM (VALUES
  ('Necklaces', 'Layered & Chokers', '/images/pure_necklaces.jpg', '/category/necklaces', 1),
  ('Earrings', 'Solitaires & Drops', '/images/pure_earrings.jpg', '/category/earrings', 2),
  ('Office Wear', 'Minimal & Daily', '/images/pure_officewear.jpg', '/search?q=minimal', 3),
  ('Bridal Sets', 'Royal Polki & Gold', '/images/pure_bridal.jpg', '/collections/bridal-collection', 4),
  ('Rings', 'Bands & Cocktails', '/images/pure_rings.jpg', '/category/rings', 5)
) AS seed(title, subtitle, image_url, href, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_collection_cards);

-- Give the built-in Admin staff role access to the new module, same as migration 012 did for Stores.
DO $$
BEGIN
  IF to_regclass('public.staff_roles') IS NOT NULL THEN
    UPDATE public.staff_roles
      SET permissions = permissions || '{"homepage_collections": ["view", "create", "edit", "delete"]}'::jsonb
      WHERE is_system AND name = 'Admin' AND NOT (permissions ? 'homepage_collections');
  END IF;
END $$;
