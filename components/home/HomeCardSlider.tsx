"use client";

import { useState, Children, type ReactNode } from 'react';
import Link from 'next/link';

interface HomeCardSliderProps {
  id?: string;
  eyebrow: string;
  title: string;
  accent: string;
  subtitle?: string;
  viewAllHref: string;
  desktopGridClass: string;
  gapClass?: string;
  /** Optional pill tab switcher below the header; must have one label per card, in the same order as the children. */
  tabs?: string[];
  children: ReactNode;
}

const MOBILE_PER_PAGE = 2;

/** Homepage "Shop by…" section: 2-card pagination on mobile, full grid on desktop. */
export default function HomeCardSlider({
  id,
  eyebrow,
  title,
  accent,
  viewAllHref,
  desktopGridClass,
  gapClass = 'gap-3 sm:gap-5',
  tabs,
  children,
}: HomeCardSliderProps) {
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const childArray = Children.toArray(children);
  const totalPages = Math.ceil(childArray.length / MOBILE_PER_PAGE);

  const goPrev = () => setPage((p) => Math.max(p - 1, 0));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));

  const goToTab = (index: number) => {
    setActiveTab(index);
    setPage(Math.floor(index / MOBILE_PER_PAGE));
  };

  const mobileItems = childArray.slice(
    page * MOBILE_PER_PAGE,
    page * MOBILE_PER_PAGE + MOBILE_PER_PAGE,
  );

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id={id}>

      {/* ── Header: eyebrow+title left | VIEW ALL → ‹ › right ── */}
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8">
        <div className="min-w-0">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase block mb-0.5">
            {eyebrow}
          </span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary leading-tight">
            {title} <em className="italic text-secondary">{accent}</em>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pb-1">
          <Link
            href={viewAllHref}
            className="font-label-sm text-[11px] sm:text-label-sm text-primary uppercase tracking-wider hover:text-secondary transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            View All
            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_forward</span>
          </Link>

          <button
            type="button"
            onClick={goPrev}
            disabled={page === 0}
            aria-label="Previous"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-outline-variant/60 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">chevron_left</span>
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={page === totalPages - 1}
            aria-label="Next"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-outline-variant/60 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      {tabs && tabs.length > 0 && (
        <div className="flex gap-1 bg-[#F5EFE6] rounded-full p-1 mb-5 sm:mb-8 overflow-x-auto scrollbar-none w-full sm:w-fit">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={() => goToTab(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] sm:text-label-sm font-label-sm uppercase tracking-wide whitespace-nowrap transition-all ${
                activeTab === index
                  ? 'bg-gradient-to-r from-[#D4AF6A] to-[#B99A62] text-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* ── MOBILE: exactly 2 cards per page, no peek ── */}
      <div className="sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          {mobileItems}
        </div>

        {/* Page dots */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === page
                    ? 'w-5 h-1.5 bg-secondary'
                    : 'w-1.5 h-1.5 bg-outline-variant hover:bg-on-surface-variant'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: full CSS grid showing all cards ── */}
      <div className={`hidden sm:grid ${desktopGridClass} ${gapClass}`}>
        {children}
      </div>

    </section>
  );
}
