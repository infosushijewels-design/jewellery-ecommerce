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

  const trustBadges = [
    { icon: 'verified', label: '100% BIS 916 Hallmarked Gold' },
    { icon: 'local_shipping', label: 'Free Insured Express Delivery' },
    { icon: 'diamond', label: '100% Certified Diamonds' },
  ];

  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="festive-offer">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">

        {/* ── MOBILE: Option A — Image top, content + button below ── */}
        <div className="sm:hidden rounded-3xl overflow-hidden bg-gradient-to-br from-[#2D2024] via-[#3D2B31] to-[#1A1215] border border-secondary/30 shadow-xl">

          {/* Full-width image on top */}
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80"
              alt="Festive Gold Collection"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content block */}
          <div className="p-5 space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 border border-secondary/40 text-secondary text-[11px] font-medium uppercase tracking-widest">
              <span className="material-symbols-outlined text-[14px] animate-pulse">auto_awesome</span>
              Festive Celebration Offer
            </div>

            {/* Title */}
            <h2 className="font-headline-lg text-[26px] font-serif text-surface leading-tight">
              Flat 10% OFF on Making Charges
            </h2>

            {/* Description */}
            <p className="text-sm text-surface-variant/90 leading-relaxed">
              Celebrate your cherished moments with pure 100% BIS Hallmarked gold and certified diamonds. Enjoy zero insurance fee and insured delivery nationwide.
            </p>

            {/* Trust badges — horizontal row */}
            <div className="pt-2 border-t border-surface/10 grid grid-cols-3 gap-2 text-center">
              {trustBadges.map((b) => (
                <div key={b.icon} className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[22px]">{b.icon}</span>
                  <span className="text-[9px] text-surface-variant/80 leading-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Button — clearly outside content, at the very bottom */}
          <div className="px-5 pb-6 pt-1">
            <Link
              href="/collections/festive-collection"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-secondary hover:bg-secondary-fixed text-on-secondary font-semibold text-base transition-all duration-200 shadow-md active:scale-95"
            >
              Shop Festive Offer
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* ── DESKTOP: Original two-column layout ── */}
        <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D2024] via-[#3D2B31] to-[#1A1215] text-surface p-10 lg:p-16 shadow-xl border border-secondary/30">

          {/* Glow decorations */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left: text */}
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

              <div className="pt-2">
                <Link
                  href="/collections/festive-collection"
                  className="px-7 py-3.5 rounded-full bg-secondary hover:bg-secondary-fixed text-on-secondary font-label-lg text-sm sm:text-base font-semibold text-center transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-95 inline-flex items-center gap-2"
                >
                  Shop Festive Offer
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>

              <div className="pt-4 border-t border-surface/10 flex flex-wrap gap-4 text-xs text-surface-variant/80">
                {trustBadges.map((b) => (
                  <span key={b.icon} className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-sm">{b.icon}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: image */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-2xl overflow-hidden border border-secondary/30 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80"
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
