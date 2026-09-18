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

type Product = Database['public']['Tables']['products']['Row'];

const METAL_MATCHERS: Record<MetalKey, string[]> = {
  '18k-yellow': ['18k yellow', 'yellow gold'],
  '18k-rose': ['18k rose', 'rose gold', 'blush rose'],
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

export default function ProductCatalog({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const priceRange = (searchParams.get('price') as PriceRangeKey | null) || null;
  const metalParam = searchParams.get('metal');
  const gemParam = searchParams.get('gem');
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
    updateParams({ price: null, metal: null, gem: null });
  };

  const classified = useMemo(
    () =>
      products.map((product) => ({
        product,
        metalKey: classifyMetal(product.material),
        gemstoneKey: classifyGemstone(product),
      })),
    [products]
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

  const activeFilterCount = (priceRange ? 1 : 0) + selectedMetals.length + selectedGemstones.length;

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
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <span className="material-symbols-outlined text-[40px] text-outline mb-3 block">search_off</span>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">No pieces match your filters</h3>
            <p className="text-on-surface-variant font-body-sm text-body-sm mb-5">
              Try adjusting or clearing your filters to see more of the collection.
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAll}
                className="bg-primary text-surface px-6 py-2.5 rounded-full font-label-md uppercase hover:bg-tertiary transition-colors"
              >
                Clear All Filters
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
                slug={product.slug}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
