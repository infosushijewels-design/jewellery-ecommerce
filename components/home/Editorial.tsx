"use client";

import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

const DEFAULT_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDOz-P_QEyALRQOzazI3u8leIDYBTzfuhKbtqWA297SOi6y9VSdeUCp8FWZqhNrSfM9BOuOhr66eRBgotf-Wyt-Y6l5tCxURf1Ma_XTS6o652hdeUZ2QRKVd1LAca3L6Jl27SFPltgKNvxOnf7gDXNsE0akFurR4r1Owbsz0KHpyV6zO96pDcLBk_RXFfIBZvdtntEs4lT05acgnaZ7pL0IOfvNmq_domEN21H-IK96H-ElXfxpDFRb-w';

// Same three claims already live in TrustMatrix.tsx ("Sushi Jewels Promises") — reused
// here rather than inventing unverified claims like a specific lab name or founding year
// that aren't backed anywhere else on the site.
const TRUST_BADGES = [
  { icon: 'workspace_premium', title: 'BIS Hallmarked', subtitle: 'Pure Gold' },
  { icon: 'diamond', title: 'Certified', subtitle: 'Diamonds & Gems' },
  { icon: 'verified', title: '100% Certified', subtitle: 'Jewellery' },
];

/** "The Philosophy" block — copy and image are editable in Admin → Settings → Homepage. */
export default function Editorial() {
  const { homepage, store } = useStoreSettings();
  const quote = homepage.philosophyQuote.trim();

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-surface-container-low overflow-x-hidden">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="bg-surface rounded-2xl sm:rounded-[28px] shadow-[0_20px_50px_-20px_rgba(22,11,14,0.15)] p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* Portrait */}
          <div className="lg:col-span-5 relative rounded-xl sm:rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[420px] lg:min-h-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-full h-full object-cover absolute inset-0"
              src={homepage.philosophyImageUrl.trim() || DEFAULT_IMAGE}
              alt={`${store.name} atelier`}
            />

            {homepage.founderTitle.trim() && (
              <span className="absolute top-4 left-4 sm:top-5 sm:left-5 flex items-center gap-1.5 bg-primary/70 backdrop-blur-sm border border-secondary/50 text-surface text-[10px] sm:text-[11px] font-label-sm uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-[13px] text-secondary-fixed">auto_awesome</span>
                {homepage.founderTitle}
              </span>
            )}

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pt-16 pb-4 sm:pb-5 px-4 sm:px-5">
              <span className="block font-label-sm text-[10px] sm:text-label-sm text-secondary-fixed uppercase tracking-widest">Master Craftsmanship</span>
              <h3 className="font-headline-sm text-[16px] sm:text-headline-sm text-surface mt-0.5">Every Piece Has a Soul</h3>
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-7 relative p-2 sm:p-4 lg:pr-6">
            <span
              className="hidden sm:block absolute -top-6 -left-2 font-headline-lg text-[120px] text-secondary/10 leading-none select-none"
              aria-hidden="true"
            >
              &ldquo;
            </span>

            <div className="relative">
              {homepage.philosophyEyebrow.trim() && (
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase mb-3 sm:mb-4 block">
                  {homepage.philosophyEyebrow}
                </span>
              )}

              {quote && (
                <blockquote className="font-headline-lg text-[22px] sm:text-[28px] lg:text-[32px] xl:text-[36px] text-primary leading-[1.3] tracking-[0.005em] [text-wrap:balance]">
                  &ldquo;{quote}&rdquo;
                </blockquote>
              )}

              {homepage.philosophyText.trim() && (
                <p className="font-body-md text-body-md text-on-surface-variant mt-4 sm:mt-5 leading-relaxed max-w-xl">
                  {homepage.philosophyText}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 sm:mt-8">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.title} className="flex flex-col items-center sm:items-start gap-1.5 bg-surface-container-low border border-outline-variant/40 rounded-xl p-2.5 sm:p-3.5 text-center sm:text-left">
                    <span className="material-symbols-outlined text-secondary text-[18px] sm:text-[20px]">{badge.icon}</span>
                    <span className="font-label-sm text-[10px] sm:text-label-sm font-semibold text-primary leading-tight">{badge.title}</span>
                    <span className="font-body-sm text-[9px] sm:text-body-sm text-on-surface-variant leading-tight">{badge.subtitle}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {homepage.founderName.trim() && (
                    <p className="font-headline-sm italic text-headline-sm text-primary">{homepage.founderName}</p>
                  )}
                  {homepage.founderTitle.trim() && (
                    <p className="font-label-sm text-label-sm text-outline tracking-wider uppercase mt-0.5">{homepage.founderTitle}</p>
                  )}
                </div>
                <Link
                  className="px-6 sm:px-7 py-3 sm:py-3.5 bg-primary text-surface hover:bg-tertiary font-label-md text-label-md uppercase tracking-wider rounded-full transition-all duration-200 flex-shrink-0 text-center inline-flex items-center gap-1.5"
                  href="/about"
                >
                  Our Story
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
