"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';

const occasions = ['Anniversary', 'Birthday', 'Everyday Treat', 'Wedding & Vows'];
const budgets = [
  { label: 'Under ₹15,000', min: 0, max: 15000 },
  { label: '₹15,000 – ₹35,000', min: 15000, max: 35000 },
  { label: '₹35,000 – ₹75,000', min: 35000, max: 75000 },
  { label: 'Above ₹75,000', min: 75000, max: 9999999 },
];

const occasionIcons: Record<string, string> = {
  'Anniversary': 'favorite',
  'Birthday': 'cake',
  'Everyday Treat': 'auto_awesome',
  'Wedding & Vows': 'diamond',
};

export default function GiftFinder() {
  const [selectedOccasion, setSelectedOccasion] = useState('Anniversary');
  const [selectedBudget, setSelectedBudget] = useState(1);
  // Mobile wizard step: 0 = occasion, 1 = budget
  const [mobileStep, setMobileStep] = useState(0);
  const router = useRouter();
  const { showToast } = useToast();

  const handleFind = () => {
    const budget = budgets[selectedBudget];
    const params = new URLSearchParams();
    if (budget.min > 0) params.set('minPrice', budget.min.toString());
    if (budget.max < 9999999) params.set('maxPrice', budget.max.toString());
    showToast(`Finding perfect ${selectedOccasion} gifts for you...`, 'success');
    router.push(`/new-arrivals?${params.toString()}`);
  };

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="gift-finder">
      <div className="bg-surface rounded-2xl border border-outline-variant/60 shadow-[0_8px_24px_-4px_rgba(45,32,36,0.04)] overflow-hidden">

        {/* ── MOBILE: Step Wizard ── */}
        <div className="sm:hidden p-5">
          {/* Header */}
          <div className="text-center mb-5">
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Gift Finder</span>
            <h2 className="font-headline-lg text-[22px] text-primary mt-1">Find Something They&apos;ll Treasure Forever</h2>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-[11px] text-on-surface-variant mb-1.5">
              <span>Step {mobileStep + 1} of 2</span>
              <span>{mobileStep === 0 ? 'Occasion' : 'Budget'}</span>
            </div>
            <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: mobileStep === 0 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {/* Step 0: Occasion */}
          {mobileStep === 0 && (
            <div>
              <p className="font-label-md text-label-md text-primary mb-4 text-center">Select the Occasion</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {occasions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setSelectedOccasion(occ)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedOccasion === occ
                        ? 'border-secondary bg-secondary/8 text-primary'
                        : 'border-outline-variant/40 bg-surface-container/50 text-on-surface-variant hover:border-secondary/50'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[28px] ${selectedOccasion === occ ? 'text-secondary' : 'text-outline'}`}
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      {occasionIcons[occ]}
                    </span>
                    <span className="text-[13px] font-medium text-center leading-tight">{occ}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMobileStep(1)}
                className="w-full py-3.5 rounded-full bg-primary text-surface font-label-lg text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                Next: Choose Budget
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          )}

          {/* Step 1: Budget */}
          {mobileStep === 1 && (
            <div>
              <p className="font-label-md text-label-md text-primary mb-4 text-center">Choose Price Range</p>
              <div className="space-y-2.5 mb-6">
                {budgets.map((b, i) => (
                  <button
                    key={b.label}
                    onClick={() => setSelectedBudget(i)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                      selectedBudget === i
                        ? 'border-secondary bg-secondary/8'
                        : 'border-outline-variant/40 bg-surface-container/50 hover:border-secondary/50'
                    }`}
                  >
                    <span className={`font-label-md text-[14px] ${selectedBudget === i ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                      {b.label}
                    </span>
                    {selectedBudget === i && (
                      <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMobileStep(0)}
                  className="px-5 py-3.5 rounded-full border border-outline-variant/60 text-primary font-label-md text-[14px] flex items-center gap-1 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back
                </button>
                <button
                  onClick={handleFind}
                  className="flex-1 py-3.5 rounded-full bg-primary-container text-surface font-label-lg text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-tertiary-container"
                >
                  Find the Perfect Gift
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>
              </div>

              <p className="font-label-sm text-label-sm text-outline mt-4 flex items-center justify-center gap-1 text-center">
                <span className="material-symbols-outlined text-[14px]">redeem</span>
                Complimentary luxury gift packaging included
              </p>
            </div>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-5">
            {[0, 1].map((s) => (
              <button
                key={s}
                onClick={() => setMobileStep(s)}
                className={`transition-all duration-300 rounded-full ${s === mobileStep ? 'w-5 h-2 bg-secondary' : 'w-2 h-2 bg-outline-variant/50'}`}
              />
            ))}
          </div>
        </div>

        {/* ── DESKTOP: Visual Cards Layout ── */}
        <div className="hidden sm:block p-8 lg:p-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Gift Finder</span>
            <h2 className="font-headline-lg text-[22px] sm:text-headline-lg text-primary mt-1">Find Something They&apos;ll Treasure Forever</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3">Select the occasion and price range to find the perfect jewellery gifts.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Occasion Cards */}
            <div className="mb-10">
              <div className="grid grid-cols-4 gap-6">
                {occasions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setSelectedOccasion(occ)}
                    className={`group flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedOccasion === occ
                        ? 'border-secondary bg-secondary/10 text-primary shadow-md scale-[1.02]'
                        : 'border-outline-variant/40 bg-surface text-on-surface-variant hover:border-secondary/60 hover:shadow-sm'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[48px] transition-transform duration-300 ${
                        selectedOccasion === occ ? 'text-secondary scale-110' : 'text-outline group-hover:scale-110 group-hover:text-secondary/70'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      {occasionIcons[occ]}
                    </span>
                    <span className="font-label-lg text-[16px] text-center">{occ}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Pills */}
            <div className="mb-12">
              <div className="flex items-center justify-center gap-4">
                {budgets.map((b, i) => (
                  <button
                    key={b.label}
                    onClick={() => setSelectedBudget(i)}
                    className={`px-8 py-3.5 rounded-full font-label-lg text-[15px] border-2 transition-all duration-200 ${
                      selectedBudget === i
                        ? 'border-secondary bg-secondary text-on-secondary shadow-md'
                        : 'border-outline-variant/60 bg-surface text-on-surface-variant hover:border-secondary/60'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={handleFind}
                className="px-12 py-4 bg-primary-container text-surface hover:bg-tertiary-container font-label-lg text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                Find the Perfect Gift
                <span className="material-symbols-outlined">search</span>
              </button>
              <p className="font-label-sm text-label-sm text-outline mt-4 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">redeem</span>
                Complimentary luxury gift packaging included with all orders
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
