/** "Explore Our Collections" carousel cards — shown on the homepage, managed in Admin → Homepage Collections. */
export interface CollectionCard {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  href: string;
  is_active: boolean;
  sort_order: number;
}

/** Shown until migration 040 is applied (same 5 cards it seeds, in the same order). */
export const FALLBACK_COLLECTION_CARDS: CollectionCard[] = [
  { id: 'necklaces', title: 'Necklaces', subtitle: 'Layered & Chokers', image_url: '/images/pure_necklaces.jpg', href: '/category/necklaces', is_active: true, sort_order: 1 },
  { id: 'earrings', title: 'Earrings', subtitle: 'Solitaires & Drops', image_url: '/images/pure_earrings.jpg', href: '/category/earrings', is_active: true, sort_order: 2 },
  { id: 'officewear', title: 'Office Wear', subtitle: 'Minimal & Daily', image_url: '/images/pure_officewear.jpg', href: '/search?q=minimal', is_active: true, sort_order: 3 },
  { id: 'bridal', title: 'Bridal Sets', subtitle: 'Royal Polki & Gold', image_url: '/images/pure_bridal.jpg', href: '/collections/bridal-collection', is_active: true, sort_order: 4 },
  { id: 'rings', title: 'Rings', subtitle: 'Bands & Cocktails', image_url: '/images/pure_rings.jpg', href: '/category/rings', is_active: true, sort_order: 5 },
];

export function sortCollectionCards(cards: CollectionCard[]): CollectionCard[] {
  return [...cards].sort((a, b) => a.sort_order - b.sort_order);
}
