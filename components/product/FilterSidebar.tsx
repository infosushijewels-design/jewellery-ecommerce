"use client";

import React, { useState } from 'react';

export type PriceRangeKey = 'under25' | '25to50' | 'above50';
export type MetalKey = '18k-yellow' | '18k-rose' | '18k-white' | '22k-gold' | 'platinum';
export type GemstoneKey = 'solitaire' | 'gemstone' | 'plain-gold';

export const PRICE_RANGE_OPTIONS: { key: PriceRangeKey; label: string }[] = [
  { key: 'under25', label: 'Under ₹25,000' },
  { key: '25to50', label: '₹25,000 – ₹50,000' },
  { key: 'above50', label: 'Above ₹50,000' },
];

export const METAL_OPTIONS: { key: MetalKey; label: string }[] = [
  { key: '18k-yellow', label: '18K Yellow Gold' },
  { key: '18k-rose', label: '18K Rose Gold' },
  { key: '18k-white', label: '18K White Gold' },
  { key: '22k-gold', label: '22K Gold' },
  { key: 'platinum', label: 'Platinum' },
];

export const GEMSTONE_OPTIONS: { key: GemstoneKey; label: string }[] = [
  { key: 'solitaire', label: 'Solitaire Diamonds' },
  { key: 'gemstone', label: 'Gemstones' },
  { key: 'plain-gold', label: 'Plain Gold' },
];

interface FilterSidebarProps {
  priceRange: PriceRangeKey | null;
  onPriceRangeChange: (key: PriceRangeKey | null) => void;
  selectedMetals: MetalKey[];
  onMetalToggle: (key: MetalKey) => void;
  metalCounts: Record<MetalKey, number>;
  selectedGemstones: GemstoneKey[];
  onGemstoneToggle: (key: GemstoneKey) => void;
  gemstoneCounts: Record<GemstoneKey, number>;
  resultCount: number;
  activeFilterCount: number;
  onClearAll: () => void;
}

export default function FilterSidebar({
  priceRange,
  onPriceRangeChange,
  selectedMetals,
  onMetalToggle,
  metalCounts,
  selectedGemstones,
  onGemstoneToggle,
  gemstoneCounts,
  resultCount,
  activeFilterCount,
  onClearAll,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
        <span className="font-headline-sm text-headline-sm text-primary">Filters</span>
        {activeFilterCount > 0 ? (
          <button
            onClick={onClearAll}
            className="font-label-sm text-label-sm text-secondary hover:text-primary uppercase tracking-wide transition-colors"
          >
            Clear All ({activeFilterCount})
          </button>
        ) : (
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">No Filters</span>
        )}
      </div>

      <div className="bg-surface-container-low rounded-lg px-3 py-2.5 text-center">
        <span className="font-label-md text-label-md text-primary font-semibold">
          Showing {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      <div className="space-y-3 pt-2">
        <span className="font-label-lg text-label-lg text-primary block">Price Range</span>
        <div className="space-y-2">
          {PRICE_RANGE_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="price-range"
                checked={priceRange === option.key}
                onChange={() => onPriceRangeChange(option.key)}
                className="text-primary focus:ring-0 accent-primary"
              />
              <span
                className={`font-body-sm text-body-sm transition-colors ${
                  priceRange === option.key ? 'text-primary font-medium' : 'text-on-surface-variant group-hover:text-primary'
                }`}
              >
                {option.label}
              </span>
            </label>
          ))}
          {priceRange && (
            <button
              onClick={() => onPriceRangeChange(null)}
              className="font-label-sm text-label-sm text-secondary hover:underline mt-1"
            >
              Reset price
            </button>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 space-y-3">
        <span className="font-label-lg text-label-lg text-primary block">Metal &amp; Purity</span>
        <div className="space-y-2">
          {METAL_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedMetals.includes(option.key)}
                  onChange={() => onMetalToggle(option.key)}
                  className="rounded border-outline-variant text-primary focus:ring-0 accent-primary"
                />
                <span
                  className={`font-body-sm text-body-sm transition-colors ${
                    selectedMetals.includes(option.key) ? 'text-primary font-medium' : 'text-on-surface-variant group-hover:text-primary'
                  }`}
                >
                  {option.label}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{metalCounts[option.key] ?? 0}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 space-y-3">
        <span className="font-label-lg text-label-lg text-primary block">Diamond &amp; Gemstone</span>
        <div className="space-y-2">
          {GEMSTONE_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedGemstones.includes(option.key)}
                  onChange={() => onGemstoneToggle(option.key)}
                  className="rounded border-outline-variant text-primary focus:ring-0 accent-primary"
                />
                <span
                  className={`font-body-sm text-body-sm transition-colors ${
                    selectedGemstones.includes(option.key) ? 'text-primary font-medium' : 'text-on-surface-variant group-hover:text-primary'
                  }`}
                >
                  {option.label}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{gemstoneCounts[option.key] ?? 0}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/40">
        <div className="bg-surface-container-low p-4 rounded-xl border border-secondary/40 text-center space-y-2">
          <span className="material-symbols-outlined text-secondary text-2xl">qr_code_2</span>
          <h4 className="font-headline-sm text-headline-sm text-primary text-base">Unsure of Your Fit?</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
            Book a 1-on-1 virtual consultation with our Master Gemologists.
          </p>
          <a href="/contact" className="inline-block pt-1 font-label-sm text-label-sm font-semibold uppercase text-secondary tracking-wider hover:text-primary">
            Schedule Video Call →
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Filter toggle button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/60 rounded-full bg-surface font-label-md text-label-md text-primary hover:border-secondary transition-colors w-full sm:w-auto justify-center sm:justify-start"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-secondary text-surface text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-semibold">
              {activeFilterCount}
            </span>
          )}
          <span className="material-symbols-outlined text-[18px] ml-auto sm:ml-2 text-on-surface-variant">
            {isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </button>

        {/* Mobile collapsible filter panel */}
        {isOpen && (
          <div className="mt-3 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Desktop: Sticky sidebar */}
      <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-28 space-y-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 max-h-[870px] overflow-y-auto no-scrollbar">
        {sidebarContent}
      </aside>
    </>
  );
}
