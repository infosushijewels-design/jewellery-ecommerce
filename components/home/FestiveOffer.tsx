"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/context/ToastContext';

export default function FestiveOffer() {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const couponCode = "FESTIVE10";

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    showToast('✨ Coupon code FESTIVE10 copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="festive-offer">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D2024] via-[#3D2B31] to-[#1A1215] text-surface p-6 sm:p-10 lg:p-16 shadow-xl border border-secondary/30">
          
          {/* Subtle Background Glow Decorative Pattern */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Offer Info & Copy */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/20 border border-secondary/40 text-secondary text-xs sm:text-sm font-medium uppercase tracking-widest">
                <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
                Festive Celebration Offer
              </div>

              <h2 className="font-headline-lg text-2xl sm:text-4xl lg:text-5xl font-serif text-surface leading-tight">
                Flat 10% OFF on Making Charges
              </h2>

              <p className="font-body-md text-sm sm:text-base text-surface-variant/90 leading-relaxed max-w-xl">
                Celebrate your cherished moments with pure 100% BIS Hallmarked gold and certified diamonds. Enjoy zero insurance fee and insured delivery nationwide.
              </p>

              {/* Coupon Box & CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                
                {/* Coupon Code Pill */}
                <button
                  onClick={handleCopyCoupon}
                  className="flex items-center justify-between gap-3 px-5 py-3 rounded-full bg-surface/10 hover:bg-surface/20 border border-secondary/40 text-surface text-sm font-mono transition-all group active:scale-95"
                  title="Click to copy coupon code"
                >
                  <span className="text-secondary font-bold tracking-wider">{couponCode}</span>
                  <span className="text-xs text-outline-variant group-hover:text-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                    {copied ? 'Copied!' : 'Copy Code'}
                  </span>
                </button>

                {/* Primary Button */}
                <Link
                  href="/collections/festive-collection"
                  className="px-7 py-3.5 rounded-full bg-secondary hover:bg-secondary-fixed text-on-secondary font-label-lg text-sm sm:text-base font-semibold text-center transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  Shop Festive Offer
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>

              {/* Small Guarantee Highlights */}
              <div className="pt-4 border-t border-surface/10 flex flex-wrap gap-4 text-xs text-surface-variant/80">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-sm">verified</span>
                  100% BIS 916 Hallmarked Gold
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-sm">local_shipping</span>
                  Free Insured Express Delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-sm">currency_exchange</span>
                  Lifetime Buyback Guarantee
                </span>
              </div>

            </div>

            {/* Right Column: Visual Product Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-2xl overflow-hidden border border-secondary/30 shadow-2xl group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-H9Xvu3YmPXsf6OF_Qrys1lz3BoPTufC3vXf9bOM0RXDIT6zQPix_VCRp4mjk5kFPMl2iRWofjkSbb8bm-THKprCk07xVq4XlIjOi8Tx4ffcq815fp26tn8ENmKTctiFTPngpHmaLkB25aahzaTvuJD7IGbwsGqe7yYKY3ECHuSRfmd-9iSnpWUS5B3rnX2lP6d7J4RnTjR0VAEaJJCbAzAbOh_vzpWAn86HOKkdzDAoKVvLXhbuz8A"
                  alt="Festive Gold Collection"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1215]/80 via-transparent to-transparent flex items-end p-4 sm:p-6">
                  <div className="bg-surface/90 backdrop-blur-md border border-secondary/30 rounded-xl p-3 sm:p-4 w-full flex items-center justify-between text-primary">
                    <div>
                      <span className="text-[10px] sm:text-xs text-secondary font-semibold uppercase tracking-wider block">Exclusive Design</span>
                      <h4 className="text-xs sm:text-sm font-bold truncate">Royal Jadau Festive Necklace</h4>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-secondary">Special Price</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
