import ExploreCollectionsCarousel from './ExploreCollectionsCarousel';
import { getPublicHomepageCollections } from '@/lib/supabase/public';

/** Server wrapper: fetches admin-managed cards (Admin → Homepage Collections) and
 *  hands them to the client carousel. Falls back to the 5 originally-hardcoded
 *  cards until migration 040 is applied (see lib/homepageCollections.ts). */
export default async function ExploreCollections() {
  const items = await getPublicHomepageCollections();
  return <ExploreCollectionsCarousel items={items} />;
}
