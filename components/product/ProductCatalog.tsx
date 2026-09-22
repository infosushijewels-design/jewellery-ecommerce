"use client";

import React, { useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import FilterSidebar, {
  MetalKey,
  GemstoneKey,
  PriceRangeKey,
  METAL_OPTIONS,
  GEMSTONE_OPTIONS,
} from '@/components/product/FilterSidebar';
import { Database } from '@/lib/supabase/database.types';
import { STYLE_FILTERS, matchesStyle } from '@/lib/catalogSearch';

type Product = Database['public']['Tables']['products']['Row'];
export type CatalogCategory = { id: string; name: string; slug: string };

const formatPrice = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** "bangles" → "bangle", "necklaces" → "necklace" (for matching product titles) */
const singular = (word: string) => word.toLowerCase().replace(/(es|s)$/, '');

/**
 * Does a product belong to the category in ?category=<slug>?
 * Prefers the product's real category; falls back to its title for
 * products that haven't been assigned one yet.
 */
function matchesCategory(product: Product, slug: string, categoriesById: Map<string, CatalogCategory>) {
  const wanted = singular(slug);
  const category = product.category_id ? categoriesById.get(product.category_id) : undefined;
  if (category) {
    // Exact match only — "earrings" must not match "rings"
    return singular(category.slug) === wanted || singular(category.name) === wanted;
  }
  // Whole-word match on the title, e.g. "Gold Bangles" but not "Earrings" for "ring"
  return new RegExp(`\\b${wanted}(e?s)?\\b`, 'i').test(product.title);
}

const METAL_MATCHERS: Record<MetalKey, string[]> = {
  '18k-yellow': ['18k yellow', 'yellow gold'],
  '18k-rose': ['18k rose', 'rose gold', 'blush rose'],
  '18k-white': ['18k white', 'white gold'],
  '22k-gold': ['22k'],
  platinum: ['platinum'],
};

const GEMSTONE_KEYWORDS = ['pearl', 'emerald', 'ruby', 'sapphire', 'gemstone', 'gem'];

function classifyMetal(material: string): MetalKey | null {
  const lower = material.toLowerCase();
  for (const key of Object.keys(METAL_MATCHERS) as MetalKey[]) {
    if (METAL_MATCHERS[key].some((token) => lower.includes(token))) return key;
  }
  return null;
}

function classifyGemstone(product: Product): GemstoneKey {
  const haystack = `${product.material} ${product.certification ?? ''} ${product.title}`.toLowerCase();
  if (haystack.includes('diamond')) return 'solitaire';
  if (GEMSTONE_KEYWORDS.some((token) => haystack.includes(token))) return 'gemstone';
  return 'plain-gold';
}

function matchesPriceRange(price: number, range: PriceRangeKey | null): boolean {
  if (!range) return true;
  if (range === 'under25') return price < 25000;
  if (range === '25to50') return price >= 25000 && price <= 50000;
  return price > 50000;
}

export default function ProductCatalog({
  products,
  categories = [],
}: {
  products: Product[];
  /** Needed for ?category= filtering (e.g. New Arrivals → Latest Bangles) */
  categories?: CatalogCategory[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const priceRange = (searchParams.get('price') as PriceRangeKey | null) || null;
  const metalParam = searchParams.get('metal');
  const gemParam = searchParams.get('gem');
  const categoryParam = searchParams.get('category');
  const styleParam = searchParams.get('style');
  const styleLabel = styleParam ? STYLE_FILTERS[styleParam]?.label ?? null : null;
  // Menu links use explicit bounds (?minPrice=25000&maxPrice=50000)
  const minPrice = Number(searchParams.get('minPrice')) || null;
  const maxPrice = Number(searchParams.get('maxPrice')) || null;
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const categoryLabel = categoryParam
    ? categories.find((c) => c.slug.toLowerCase() === categoryParam.toLowerCase())?.name ||
      categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).replace(/-/g, ' ')
    : null;
  const selectedMetals = useMemo(
    () => (metalParam?.split(',').filter(Boolean) as MetalKey[]) || [],
    [metalParam]
  );
  const selectedGemstones = useMemo(
    () => (gemParam?.split(',').filter(Boolean) as GemstoneKey[]) || [],
    [gemParam]
  );

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handlePriceRangeChange = (key: PriceRangeKey | null) => {
    updateParams({ price: key });
  };

  const handleMetalToggle = (key: MetalKey) => {
    const next = selectedMetals.includes(key)
      ? selectedMetals.filter((m) => m !== key)
      : [...selectedMetals, key];
    updateParams({ metal: next.length > 0 ? next.join(',') : null });
  };

  const handleGemstoneToggle = (key: GemstoneKey) => {
    const next = selectedGemstones.includes(key)
      ? selectedGemstones.filter((g) => g !== key)
      : [...selectedGemstones, key];
    updateParams({ gem: next.length > 0 ? next.join(',') : null });
  };

  const handleClearAll = () => {
    updateParams({ price: null, metal: null, gem: null, category: null, style: null, minPrice: null, maxPrice: null });
  };

  // Category + explicit price bounds narrow the base set; the sidebar filters apply on top
  const scoped = useMemo(
    () =>
      products.filter(
        (p) =>
          (!categoryParam || matchesCategory(p, categoryParam, categoriesById)) &&
          (!styleParam || matchesStyle(p, styleParam)) &&
          (minPrice == null || p.price >= minPrice) &&
          (maxPrice == null || p.price <= maxPrice)
      ),
    [products, categoryParam, styleParam, categoriesById, minPrice, maxPrice]
  );

  const classified = useMemo(
    () =>
      scoped.map((product) => ({
        product,
        metalKey: classifyMetal(product.material),
        gemstoneKey: classifyGemstone(product),
      })),
    [scoped]
  );

  const metalCounts = useMemo(() => {
    const counts = {} as Record<MetalKey, number>;
    METAL_OPTIONS.forEach((option) => {
      counts[option.key] = classified.filter((item) => item.metalKey === option.key).length;
    });
    return counts;
  }, [classified]);

  const gemstoneCounts = useMemo(() => {
    const counts = {} as Record<GemstoneKey, number>;
    GEMSTONE_OPTIONS.forEach((option) => {
      counts[option.key] = classified.filter((item) => item.gemstoneKey === option.key).length;
    });
    return counts;
  }, [classified]);

  const filteredProducts = useMemo(() => {
    return classified
      .filter(({ product }) => matchesPriceRange(product.price, priceRange))
      .filter(({ metalKey }) => selectedMetals.length === 0 || (metalKey && selectedMetals.includes(metalKey)))
      .filter(({ gemstoneKey }) => selectedGemstones.length === 0 || selectedGemstones.includes(gemstoneKey))
      .map(({ product }) => product);
  }, [classified, priceRange, selectedMetals, selectedGemstones]);

  const priceBoundsLabel =
    minPrice != null && maxPrice != null
      ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : minPrice != null
        ? `Above ${formatPrice(minPrice)}`
        : maxPrice != null
          ? `Under ${formatPrice(maxPrice)}`
          : null;

  const activeFilterCount =
    (priceRange ? 1 : 0) +
    selectedMetals.length +
    selectedGemstones.length +
    (categoryParam ? 1 : 0) +
    (styleLabel ? 1 : 0) +
    (priceBoundsLabel ? 1 : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <FilterSidebar
        priceRange={priceRange}
        onPriceRangeChange={handlePriceRangeChange}
        selectedMetals={selectedMetals}
        onMetalToggle={handleMetalToggle}
        metalCounts={metalCounts}
        selectedGemstones={selectedGemstones}
        onGemstoneToggle={handleGemstoneToggle}
        gemstoneCounts={gemstoneCounts}
        resultCount={filteredProducts.length}
        activeFilterCount={activeFilterCount}
        onClearAll={handleClearAll}
      />

      <section aria-label="Catalog" className="lg:col-span-9">
        {(categoryLabel || styleLabel || priceBoundsLabel) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mr-1">Showing</span>
            {categoryLabel && (
              <button
                onClick={() => updateParams({ category: null })}
                className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/60 text-primary text-sm px-3 py-1.5 rounded-full hover:border-primary transition-colors"
                aria-label={`Remove ${categoryLabel} filter`}
              >
                {categoryLabel}
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
            {styleLabel && (
              <button
                onClick={() => updateParams({ style: null })}
                className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/60 text-primary text-sm px-3 py-1.5 rounded-full hover:border-primary transition-colors"
                aria-label={`Remove ${styleLabel} filter`}
              >
                {styleLabel}
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
            {priceBoundsLabel && (
              <button
                onClick={() => updateParams({ minPrice: null, maxPrice: null })}
                className="inline-flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/60 text-primary text-sm px-3 py-1.5 rounded-full hover:border-primary transition-colors"
                aria-label="Remove price filter"
              >
                {priceBoundsLabel}
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        )}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <span className="material-symbols-outlined text-[40px] text-outline mb-3 block">search_off</span>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
              {styleLabel && activeFilterCount === 1
                ? `No ${styleLabel.toLowerCase()}${/s$/i.test(styleLabel) ? '' : ' pieces'} yet`
                : categoryLabel && activeFilterCount === 1
                  ? `No ${categoryLabel.toLowerCase()} here yet`
                  : 'No pieces match your filters'}
            </h3>
            <p className="text-on-surface-variant font-body-sm text-body-sm mb-5">
              {(categoryLabel || styleLabel) && activeFilterCount === 1
                ? 'Our ateliers are crafting new pieces in this style. Browse the full collection in the meantime.'
                : 'Try adjusting or clearing your filters to see more of the collection.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAll}
                className="bg-primary text-surface px-6 py-2.5 rounded-full font-label-md uppercase hover:bg-tertiary transition-colors"
              >
                {activeFilterCount === 1 && (categoryLabel || styleLabel || priceBoundsLabel) ? 'View All Pieces' : 'Clear All Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                imageSrc={product.image_url}
                imageAlt={product.title}
                badge={product.badge || undefined}
                material={product.material}
                title={product.title}
                certification={product.certification || 'Verified'}
                price={product.price}
                mrp={product.mrp}
                stock={product.stock}
                isNewArrival={product.is_new_arrival}
                isFeatured={product.is_featured}
                slug={product.slug}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
