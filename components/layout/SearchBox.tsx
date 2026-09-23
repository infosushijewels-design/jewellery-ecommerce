"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STYLE_FILTERS, scoreProduct, tokenize } from '@/lib/catalogSearch';

type LiteProduct = {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  price: number;
  material: string;
  badge: string | null;
  category_id: string | null;
};

// Loaded once per page, on first focus
let catalogPromise: Promise<{ products: LiteProduct[]; categories: { id: string; name: string }[] }> | null = null;
function loadCatalog() {
  if (!catalogPromise) {
    const supabase = createClient();
    catalogPromise = Promise.all([
      supabase.from('products').select('id, title, slug, image_url, price, material, badge, category_id').limit(1000),
      supabase.from('categories').select('id, name'),
    ])
      .then(([p, c]) => ({ products: p.data || [], categories: c.data || [] }))
      .catch(() => {
        catalogPromise = null;
        return { products: [], categories: [] };
      });
  }
  return catalogPromise;
}

const MAX_TERMS = 6;
const MAX_PRODUCTS = 4;

export default function SearchBox({ placeholder, compact = false, onNavigate }: { placeholder: string; compact?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === '/search' ? searchParams.get('q') || '' : '';

  const [query, setQuery] = useState(urlQuery);
  // Keep the box in sync when navigating between searches (adjust state during render, not in an effect)
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    setQuery(urlQuery);
  }
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [catalog, setCatalog] = useState<{ products: LiteProduct[]; categories: { id: string; name: string }[] } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const { terms, products } = useMemo(() => {
    const q = query.trim();
    if (!q || !catalog) return { terms: [] as string[], products: [] as LiteProduct[] };

    const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));

    // Suggested searches: categories, styles and metal/stone + category combos
    const pool = new Set<string>();
    catalog.categories.forEach((c) => {
      pool.add(c.name);
      ['Gold', 'Diamond', 'Rose Gold', 'White Gold', 'Yellow Gold'].forEach((m) => pool.add(`${m} ${c.name}`));
    });
    Object.values(STYLE_FILTERS).forEach((s) => pool.add(s.label));
    ['Diamond', 'Gold', 'Solitaire', 'Pearl', '22K Gold', '18K Gold'].forEach((t) => pool.add(t));

    const qTokens = tokenize(q);
    const terms = Array.from(pool)
      .filter((term) => {
        const words = tokenize(term);
        return qTokens.every((t) => words.some((w) => w.startsWith(t)));
      })
      .sort((a, b) => a.length - b.length)
      .slice(0, MAX_TERMS);

    const products = catalog.products
      .map((p) => ({ p, score: scoreProduct(p, q, [(p.category_id && categoryName.get(p.category_id)) || ''].filter(Boolean)) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PRODUCTS)
      .map(({ p }) => p);

    return { terms, products };
  }, [query, catalog]);

  // Keyboard targets: suggested terms, products, then "see all"
  const itemCount = terms.length + products.length + (query.trim() ? 1 : 0);

  function ensureCatalog() {
    if (!catalog) loadCatalog().then(setCatalog);
  }

  function goSearch(term: string) {
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function goProduct(slug: string) {
    setOpen(false);
    onNavigate?.();
    router.push(`/product/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (itemCount ? (i + 1) % itemCount : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (itemCount ? (i - 1 + itemCount) % itemCount : -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && active < terms.length) goSearch(terms[active]);
      else if (active >= terms.length && active < terms.length + products.length) goProduct(products[active - terms.length].slug);
      else goSearch(query);
    }
  }

  const showPanel = open && query.trim().length > 0;
  const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goSearch(query);
        }}
      >
        <span className={`material-symbols-outlined absolute top-1/2 -translate-y-1/2 text-outline pointer-events-none ${compact ? 'left-3 text-[16px]' : 'left-4 text-[20px]'}`}>
          search
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
            ensureCatalog();
          }}
          onFocus={() => {
            ensureCatalog();
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search jewellery"
          aria-expanded={showPanel}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
          className={`w-full bg-surface-container-low border border-outline-variant/60 rounded-full text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all [&::-webkit-search-cancel-button]:hidden ${
            compact ? 'h-[40px] sm:h-[44px] pl-10 pr-10 font-body-sm text-body-sm' : 'py-2.5 pl-11 pr-11 font-body-md text-body-md'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActive(-1);
              inputRef.current?.focus();
            }}
            className={`absolute top-1/2 -translate-y-1/2 text-outline hover:text-primary ${compact ? 'right-3' : 'right-4'}`}
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-surface border border-outline-variant/50 rounded-xl shadow-[0_16px_40px_rgba(22,11,14,0.12)] overflow-hidden z-[60]"
        >
          {!catalog ? (
            <div className="px-4 py-4 text-body-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] animate-spin text-secondary">progress_activity</span>
              Searching…
            </div>
          ) : (
            <>
              {terms.length > 0 && (
                <ul className="py-1">
                  {terms.map((term, i) => (
                    <li key={term} role="option" aria-selected={active === i}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => goSearch(term)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-body-md text-on-surface ${active === i ? 'bg-surface-container-low' : ''}`}
                      >
                        <span className="material-symbols-outlined text-[18px] text-outline">search</span>
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {products.length > 0 && (
                <div className={`py-1 ${terms.length ? 'border-t border-outline-variant/40' : ''}`}>
                  <p className="px-4 pt-2 pb-1 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Products</p>
                  <ul>
                    {products.map((p, j) => {
                      const i = terms.length + j;
                      return (
                        <li key={p.id} role="option" aria-selected={active === i}>
                          <Link
                            href={`/product/${p.slug}`}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => {
                              setOpen(false);
                              onNavigate?.();
                            }}
                            className={`flex items-center gap-3 px-4 py-2 ${active === i ? 'bg-surface-container-low' : ''}`}
                          >
                            <span className="w-11 h-11 rounded-md overflow-hidden bg-surface-container flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-body-sm text-primary truncate">{p.title}</span>
                              <span className="block text-label-sm text-on-surface-variant truncate">{p.material}</span>
                            </span>
                            <span className="text-body-sm font-semibold text-primary whitespace-nowrap">{inr(p.price)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {terms.length === 0 && products.length === 0 && (
                <p className="px-4 py-3 text-body-sm text-on-surface-variant">No matches for &ldquo;{query.trim()}&rdquo;</p>
              )}

              <button
                type="button"
                onMouseEnter={() => setActive(itemCount - 1)}
                onClick={() => goSearch(query)}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 border-t border-outline-variant/40 text-body-sm font-medium text-primary ${
                  active === itemCount - 1 ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                }`}
              >
                <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
