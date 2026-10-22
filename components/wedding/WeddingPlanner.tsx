"use client";

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';
import type { PlannerProduct } from '@/lib/supabase/queries';
import {
  BUDGET_OPTIONS,
  ITEM_OPTIONS,
  STYLE_OPTIONS,
  isPriceOnRequest,
  matchesPlannerSelection,
  type BudgetKey,
  type ItemKey,
  type StyleKey,
} from '@/lib/weddingPlanner';

const ITEM_IMAGES: Record<ItemKey, string> = {
  rings: '/images/pure_rings.jpg',
  mangalsutra: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=500&q=80',
  pendant: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=500&q=80',
  necklace: '/images/pure_necklaces.jpg',
};

const STYLE_IMAGES: Record<StyleKey, string> = {
  ruby: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80',
  emerald: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=500&q=80',
  gold: '/images/yellow_gold.jpg',
};

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const RESULTS_PAGE_SIZE = 8;

export default function WeddingPlanner({ catalog }: { catalog: PlannerProduct[] }) {
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [items, setItems] = useState<ItemKey[]>([]);
  const [style, setStyle] = useState<StyleKey | null>(null);
  const [styleTouched, setStyleTouched] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  const budgetOpt = BUDGET_OPTIONS.find((b) => b.key === budget) || null;
  const styleOpt = STYLE_OPTIONS.find((s) => s.key === style) || null;
  const itemLabels = items.map((k) => ITEM_OPTIONS.find((o) => o.key === k)?.label).filter(Boolean) as string[];
  // All three steps must be completed -- style counts as complete once the customer
  // either picks a style or explicitly presses "No preference" (see pickStyle).
  const ready = !!budget && items.length > 0 && styleTouched;

  const results = useMemo(() => {
    if (!hasSearched) return [];
    return catalog.filter((p) => matchesPlannerSelection(p, items, style));
  }, [catalog, items, style, hasSearched]);

  // Priced pieces first, then "Available on Request" -- same grouping the results
  // section already showed, just sliced into one flat page of RESULTS_PAGE_SIZE.
  const orderedResults = useMemo(
    () => [...results.filter((p) => !isPriceOnRequest(p)), ...results.filter((p) => isPriceOnRequest(p))],
    [results]
  );
  const totalPages = Math.max(1, Math.ceil(orderedResults.length / RESULTS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * RESULTS_PAGE_SIZE;
  const pageItems = orderedResults.slice(pageStart, pageStart + RESULTS_PAGE_SIZE);
  const priced = pageItems.filter((p) => !isPriceOnRequest(p));
  const onRequest = pageItems.filter((p) => isPriceOnRequest(p));

  const resetSelection = () => {
    setHasSearched(false);
    setPage(1);
  };

  const toggleItem = (key: ItemKey) => {
    setItems((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    resetSelection();
  };

  const pickStyle = (key: StyleKey | null) => {
    setStyle(key);
    setStyleTouched(true);
    resetSelection();
  };

  const scrollToResults = () => {
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const runSearch = () => {
    if (!ready) return;
    setHasSearched(true);
    setPage(1);
    scrollToResults();
  };

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    scrollToResults();
  };

  const consultMessage = (pieceTitle?: string) => {
    const lines = [
      pieceTitle ? `Enquiring about: ${pieceTitle}` : 'Wedding jewellery planning enquiry',
      budgetOpt ? `Budget: ${budgetOpt.label}` : null,
      itemLabels.length ? `Items: ${itemLabels.join(', ')}` : null,
      `Style: ${styleOpt ? styleOpt.label : 'No preference'}`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const consultHref = (pieceTitle?: string) =>
    `/book-appointment?topic=${encodeURIComponent('Custom / bespoke inquiry')}&message=${encodeURIComponent(consultMessage(pieceTitle))}`;

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-surface py-12 sm:py-16 text-center">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
          <span className="font-label-sm text-label-sm text-secondary-fixed-dim tracking-widest uppercase font-semibold">A Bespoke Journey</span>
          <h1 className="font-headline-lg text-[30px] sm:text-[48px] font-serif text-surface mt-3 leading-tight">
            Plan Your Wedding, <em className="italic text-secondary-fixed-dim not-italic font-serif">With Love</em>
          </h1>
          <p className="font-body-md text-body-md text-surface-dim mt-4 max-w-xl mx-auto leading-relaxed">
            Three quick choices, and we&apos;ll curate jewellery suited to your day — or connect you directly with our atelier for anything bespoke.
          </p>
        </div>
      </section>

      {/* Sticky selection summary */}
      <div className="sticky top-[120px] lg:top-[150px] z-30 bg-surface border-b border-outline-variant/40 shadow-[0_6px_18px_-12px_rgba(22,11,14,0.25)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-3 flex items-center gap-3 flex-wrap text-[13px]">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex-shrink-0">Your selections</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${budgetOpt ? 'border-outline-variant bg-surface-container-low text-primary font-semibold' : 'border-dashed border-outline-variant/60 text-on-surface-variant italic'}`}>
            {budgetOpt ? budgetOpt.label : 'Budget not set'}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${itemLabels.length ? 'border-outline-variant bg-surface-container-low text-primary font-semibold' : 'border-dashed border-outline-variant/60 text-on-surface-variant italic'}`}>
            {itemLabels.length ? itemLabels.join(', ') : 'No items chosen'}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${styleOpt ? 'border-outline-variant bg-surface-container-low text-primary font-semibold' : 'border-dashed border-outline-variant/60 text-on-surface-variant italic'}`}>
            {styleOpt ? styleOpt.label : 'Any style'}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={runSearch}
            disabled={!ready}
            className="bg-primary text-surface px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Curate My Selection
          </button>
        </div>
      </div>

      {/* Step 1: Budget */}
      <section className="py-12 sm:py-16 border-b border-outline-variant/30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="font-serif italic text-secondary text-sm">Step One</span>
            <h2 className="font-headline-lg text-[24px] sm:text-[30px] font-serif text-primary mt-1.5">What&apos;s your total wedding jewellery budget?</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2.5">
              This is your combined budget across everything you select below — not the price of a single piece.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {BUDGET_OPTIONS.map((opt) => {
              const selected = budget === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setBudget(opt.key); resetSelection(); }}
                  aria-pressed={selected}
                  className={`rounded-sm border py-6 text-center transition-colors ${selected ? 'bg-primary border-primary' : 'bg-surface border-outline-variant/50 hover:border-secondary'}`}
                >
                  <span className={`block font-headline-sm text-[22px] sm:text-[26px] font-serif ${selected ? 'text-secondary-fixed-dim' : 'text-primary'}`}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step 2: Items */}
      <section className="py-12 sm:py-16 border-b border-outline-variant/30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="font-serif italic text-secondary text-sm">Step Two</span>
            <h2 className="font-headline-lg text-[24px] sm:text-[30px] font-serif text-primary mt-1.5">What are you looking to find?</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2.5">Select all that apply — we&apos;ll divide your budget across your choices.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {ITEM_OPTIONS.map((opt) => {
              const selected = items.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleItem(opt.key)}
                  aria-pressed={selected}
                  className={`rounded-sm overflow-hidden border text-left transition-colors ${selected ? 'border-secondary' : 'border-outline-variant/50 hover:border-secondary/60'}`}
                >
                  <span className="block aspect-square bg-surface-container-low overflow-hidden">
                    <img src={ITEM_IMAGES[opt.key]} alt={opt.label} className="w-full h-full object-cover" />
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3 py-2.5 text-[13px] font-semibold text-primary">
                    {opt.label}
                    <span className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-secondary border-secondary text-surface' : 'border-outline-variant text-transparent'}`}>
                      <CheckGlyph />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step 3: Style */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="font-serif italic text-secondary text-sm">Step Three</span>
            <h2 className="font-headline-lg text-[24px] sm:text-[30px] font-serif text-primary mt-1.5">What speaks to you?</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2.5">Pick the palette that feels most like your day.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {STYLE_OPTIONS.map((opt) => {
              const selected = style === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => pickStyle(opt.key)}
                  aria-pressed={selected}
                  className={`rounded-sm overflow-hidden border transition-colors ${selected ? 'border-secondary ring-1 ring-secondary' : 'border-outline-variant/50 hover:border-secondary/60'}`}
                >
                  <span className="block aspect-[4/3] bg-surface-container-low overflow-hidden">
                    <img src={STYLE_IMAGES[opt.key]} alt={opt.label} className="w-full h-full object-cover" />
                  </span>
                  <span className={`block text-center py-3 font-headline-sm text-[16px] font-serif ${selected ? 'text-secondary' : 'text-primary'}`}>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => pickStyle(null)}
            className="block mx-auto mt-4 text-[12.5px] text-on-surface-variant underline underline-offset-4 hover:text-primary transition-colors"
          >
            No preference — show me everything
          </button>

          <div className="text-center mt-9">
            <button
              type="button"
              onClick={runSearch}
              disabled={!ready}
              className="bg-primary text-surface px-10 py-4 rounded-full text-[13px] font-semibold uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              Curate My Selection
            </button>
            <p className="mt-2.5 text-[12px] text-on-surface-variant">
              {ready ? 'Ready — press Curate My Selection to see matches.' : 'Pick a budget, at least one item, and a style (or skip) to continue.'}
            </p>
          </div>
        </div>
      </section>

      {/* Results */}
      <section ref={resultsRef} className="py-12 sm:py-16 bg-surface-container-low border-t border-outline-variant/30 scroll-mt-[120px] lg:scroll-mt-[150px]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
          {!hasSearched ? (
            <p className="text-center text-[13.5px] text-on-surface-variant max-w-md mx-auto">
              Make your selections above, then press <strong className="text-primary">Curate My Selection</strong> to preview results here.
            </p>
          ) : (
            <>
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-semibold">Your Curated Edit</span>
                <h2 className="font-headline-lg text-[22px] sm:text-[28px] font-serif text-primary mt-1.5">
                  {budgetOpt ? `Matches for your ${budgetOpt.label} selection` : 'Matches for your selections'}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2.5">
                  Prices shown are per piece — build your own combination within your total budget.
                </p>
                {orderedResults.length > 0 && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
                    Showing {pageStart + 1}–{Math.min(pageStart + RESULTS_PAGE_SIZE, orderedResults.length)} of {orderedResults.length}{' '}
                    {orderedResults.length === 1 ? 'product' : 'products'}
                  </p>
                )}
              </div>

              {results.length === 0 ? (
                <div className="max-w-md mx-auto text-center bg-surface border border-outline-variant/40 rounded-xl p-10">
                  <span className="material-symbols-outlined text-[40px] text-secondary mb-3 block">search_off</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Nothing in this exact combination, yet</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    We don&apos;t have this precise pairing ready today — but our atelier can craft it. Let&apos;s talk through your vision directly.
                  </p>
                </div>
              ) : (
                <>
                  {priced.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                      {priced.map((p) => (
                        <ResultCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}

                  {onRequest.length > 0 && (
                    <div className="mt-10">
                      <p className="text-center font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-5">
                        Available on Request
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {onRequest.map((p) => (
                          <ResultCard key={p.id} product={p} consultHref={consultHref(p.title)} />
                        ))}
                      </div>
                    </div>
                  )}

                  <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} />
                </>
              )}

              <div className="mt-10 bg-primary text-surface rounded-xl p-7 sm:p-9 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="max-w-md text-center sm:text-left">
                  <span className="font-label-sm text-label-sm text-secondary-fixed-dim tracking-widest uppercase font-semibold">Prefer a Human Touch?</span>
                  <h3 className="font-headline-sm text-[19px] font-serif text-surface mt-1.5">Book a private consultation with our atelier</h3>
                  <p className="font-body-sm text-body-sm text-surface-dim mt-2 leading-relaxed">
                    We&apos;ll bring your budget, items, and style preferences into the conversation — no need to repeat yourself.
                  </p>
                </div>
                <Link
                  href={consultHref()}
                  className="flex-shrink-0 bg-secondary-fixed-dim text-primary px-7 py-3 rounded-full text-[12.5px] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Book Appointment
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

/** 1, [2], 3, 4, 5, …, 12 style windowed pagination -- stays compact for large result sets. */
function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 1) return [1];
  const delta = 1;
  const middle: number[] = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    middle.push(i);
  }
  const pages: (number | 'ellipsis')[] = [1];
  if (middle.length > 0 && middle[0] > 2) pages.push('ellipsis');
  pages.push(...middle);
  if (middle.length > 0 && middle[middle.length - 1] < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const pillBase =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary focus-visible:outline-offset-2 transition-colors disabled:opacity-35 disabled:cursor-not-allowed';

  return (
    <nav aria-label="Product results pages" className="mt-10 flex items-center justify-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={`${pillBase} px-4 py-2 rounded-full border border-outline-variant/50 text-[11px] font-semibold uppercase tracking-wider text-primary hover:border-secondary hover:text-secondary disabled:hover:border-outline-variant/50 disabled:hover:text-primary`}
      >
        Previous
      </button>

      {pageWindow(page, totalPages).map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-on-surface-variant select-none" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`${pillBase} w-9 h-9 rounded-full text-[12.5px] font-semibold ${
              p === page
                ? 'bg-primary text-surface'
                : 'border border-outline-variant/50 text-primary hover:border-secondary hover:text-secondary'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className={`${pillBase} px-4 py-2 rounded-full border border-outline-variant/50 text-[11px] font-semibold uppercase tracking-wider text-primary hover:border-secondary hover:text-secondary disabled:hover:border-outline-variant/50 disabled:hover:text-primary`}
      >
        Next
      </button>
    </nav>
  );
}

function ResultCard({ product, consultHref }: { product: PlannerProduct; consultHref?: string }) {
  const por = !!consultHref;
  return (
    <article className="bg-surface flex flex-col overflow-hidden rounded-xl border border-outline-variant/40">
      <Link href={`/product/${product.slug}`} className="block aspect-square bg-surface-container-low overflow-hidden">
        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
      </Link>
      <div className="p-4 flex flex-col gap-1">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-headline-sm text-[14px] text-primary leading-snug line-clamp-2 hover:text-secondary transition-colors">{product.title}</h3>
        </Link>
        {product.material && (
          <span className="text-[10.5px] text-on-surface-variant uppercase tracking-wider">{product.material}</span>
        )}
        {por ? (
          <span className="text-[13px] font-semibold text-secondary mt-1">Price on Request</span>
        ) : (
          <span className="text-[14px] font-semibold text-primary mt-1">{formatCurrency(product.price)}</span>
        )}
        {por ? (
          <Link href={consultHref} className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-secondary hover:text-primary underline underline-offset-2 w-fit">
            Enquire About This Piece
          </Link>
        ) : (
          <Link href={`/product/${product.slug}`} className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-secondary hover:text-primary underline underline-offset-2 w-fit">
            View Piece
          </Link>
        )}
      </div>
    </article>
  );
}
