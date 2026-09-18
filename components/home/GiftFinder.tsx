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

export default function GiftFinder() {
  const [selectedOccasion, setSelectedOccasion] = useState('Anniversary');
  const [selectedBudget, setSelectedBudget] = useState(1);
  const router = useRouter();
  const { showToast } = useToast();

  const handleFind = () => {
    const budget = budgets[selectedBudget];
    const params = new URLSearchParams({
      minPrice: budget.min.toString(),
      maxPrice: budget.max.toString(),
    });
    showToast(`Finding perfect ${selectedOccasion} gifts for you...`, 'success');
    router.push(`/new-arrivals?${params.toString()}`);
  };

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="gift-finder">
      <div className="bg-surface rounded-2xl border border-outline-variant/60 p-5 sm:p-8 lg:p-16 shadow-[0_8px_24px_-4px_rgba(45,32,36,0.04)]">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Concierge Assistant</span>
          <h2 className="font-headline-lg text-[22px] sm:text-headline-lg text-primary mt-1">Find Something They&apos;ll Treasure Forever</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Select the chapter and investment range to reveal tailor-made curations.</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          {/* Occasion Selectors */}
          <div>
            <label className="block font-label-md text-label-md text-primary mb-3 text-center sm:text-left">1. Select the Occasion</label>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
              {occasions.map((occ) => (
                <button
                  key={occ}
                  onClick={() => setSelectedOccasion(occ)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-label-md text-label-md transition-all ${
                    selectedOccasion === occ
                      ? 'bg-primary text-surface'
                      : 'bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Selectors */}
          <div>
            <label className="block font-label-md text-label-md text-primary mb-3 text-center sm:text-left">2. Choose Investment Range</label>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
              {budgets.map((b, i) => (
                <button
                  key={b.label}
                  onClick={() => setSelectedBudget(i)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-label-md text-label-md transition-all ${
                    selectedBudget === i
                      ? 'bg-primary text-surface'
                      : 'bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 sm:pt-6 text-center">
            <button
              onClick={handleFind}
              className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-primary-container text-surface hover:bg-tertiary-container font-label-lg text-label-lg rounded-full shadow hover:scale-[1.01] active:scale-95 transition-all"
            >
              Find the Perfect Gift
            </button>
            <p className="font-label-sm text-label-sm text-outline mt-3 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">redeem</span>
              Complimentary luxury gift packaging included with all orders
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
