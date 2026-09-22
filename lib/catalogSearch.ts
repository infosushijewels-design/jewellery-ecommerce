/**
 * Shared catalog matching for the storefront: free-text search (search page +
 * header suggestions) and "Shop by Style" menu filters.
 *
 * Matching is word-prefix based, so "ring" matches "Ring"/"Rings" but not
 * "Earrings", and "dia" matches "Diamond" while typing.
 */

export interface SearchableProduct {
  title: string;
  material?: string | null;
  badge?: string | null;
  description?: string | null;
  certification?: string | null;
  category_id?: string | null;
  collection_id?: string | null;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "rings" → "ring", "necklaces" → "necklace", "bangles" → "bangle" (keeps short words intact) */
export function singularize(word: string) {
  const w = word.toLowerCase();
  if (w.length > 4 && w.endsWith('es') && /(ches|shes|xes|sses)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9₹]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map(singularize);
}

const wordPrefix = (token: string) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}`, 'i');

function haystack(p: SearchableProduct, extra: string[] = []) {
  return [p.title, p.material, p.badge, p.description, p.certification, ...extra].filter(Boolean).join(' | ');
}

/**
 * Relevance score for a product against a free-text query (0 = no match).
 * Every token must match somewhere; title hits rank highest.
 */
export function scoreProduct(p: SearchableProduct, query: string, extra: string[] = []) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;
  const text = haystack(p, extra);
  let score = 0;
  for (const token of tokens) {
    const re = wordPrefix(token);
    if (!re.test(text)) return 0;
    score += re.test(p.title) ? 10 : extra.some((e) => re.test(e)) ? 6 : 2;
  }
  if (p.title.toLowerCase().startsWith(tokens[0])) score += 5;
  return score;
}

// ---------------------------------------------------------------------------
// Shop-by-style filters used in the mega menu (?style=<key>)
// ---------------------------------------------------------------------------

export const STYLE_FILTERS: Record<string, { label: string; keywords: string[] }> = {
  engagement: { label: 'Engagement Rings', keywords: ['engagement', 'proposal', 'solitaire'] },
  solitaire: { label: 'Solitaire', keywords: ['solitaire'] },
  cocktail: { label: 'Cocktail', keywords: ['cocktail'] },
  bands: { label: 'Bands', keywords: ['band', 'eternity'] },
  studs: { label: 'Studs', keywords: ['stud', 'tops'] },
  hoops: { label: 'Hoops', keywords: ['hoop', 'bali', 'huggie'] },
  drops: { label: 'Drops & Dangles', keywords: ['drop', 'dangle', 'dangler'] },
  chandeliers: { label: 'Chandeliers', keywords: ['chandelier', 'jhumka', 'jhumki'] },
  lightweight: { label: 'Lightweight', keywords: ['lightweight', 'light weight', 'delicate', 'dainty'] },
  pendants: { label: 'Pendants', keywords: ['pendant'] },
  statement: { label: 'Statement Pieces', keywords: ['statement', 'choker', 'haar', 'bridal'] },
  mangalsutra: { label: 'Mangalsutras', keywords: ['mangalsutra'] },
  tennis: { label: 'Tennis', keywords: ['tennis'] },
  charm: { label: 'Charm', keywords: ['charm'] },
  traditional: { label: 'Traditional', keywords: ['traditional', 'kada', 'antique', 'temple', 'kundan', 'polki'] },
  diamond: { label: 'Diamond', keywords: ['diamond', 'solitaire'] },
  gold: { label: 'Plain Gold', keywords: ['gold'] },
};

export function matchesStyle(p: SearchableProduct, styleKey: string) {
  const style = STYLE_FILTERS[styleKey];
  if (!style) return true; // unknown style → don't hide everything
  const text = haystack(p);
  return style.keywords.some((k) => wordPrefix(singularize(k)).test(text));
}
