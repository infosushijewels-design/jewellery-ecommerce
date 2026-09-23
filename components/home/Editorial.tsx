"use client";

import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

const DEFAULT_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDOz-P_QEyALRQOzazI3u8leIDYBTzfuhKbtqWA297SOi6y9VSdeUCp8FWZqhNrSfM9BOuOhr66eRBgotf-Wyt-Y6l5tCxURf1Ma_XTS6o652hdeUZ2QRKVd1LAca3L6Jl27SFPltgKNvxOnf7gDXNsE0akFurR4r1Owbsz0KHpyV6zO96pDcLBk_RXFfIBZvdtntEs4lT05acgnaZ7pL0IOfvNmq_domEN21H-IK96H-ElXfxpDFRb-w';

/** "The Philosophy" block — copy and image are editable in Admin → Settings → Homepage. */
export default function Editorial() {
  const { homepage, store } = useStoreSettings();
  const quote = homepage.philosophyQuote.trim();

  return (
    <section className="border-y border-outline-variant/40 bg-surface-container-low">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-6 relative min-h-[240px] sm:min-h-[380px] lg:min-h-[620px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-cover absolute inset-0"
            src={homepage.philosophyImageUrl.trim() || DEFAULT_IMAGE}
            alt={`${store.name} atelier`}
          />
        </div>

        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-16 xl:p-20 flex flex-col justify-center bg-surface">
          {homepage.philosophyEyebrow.trim() && (
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase mb-4 sm:mb-5">
              {homepage.philosophyEyebrow}
            </span>
          )}

          {quote && (
            <blockquote className="font-headline-lg text-[21px] sm:text-[28px] lg:text-[32px] xl:text-[36px] text-primary leading-[1.35] tracking-[0.005em] [text-wrap:balance] pb-1">
              &ldquo;{quote}&rdquo;
            </blockquote>
          )}

          {homepage.philosophyText.trim() && (
            <p className="font-body-md text-body-md text-on-surface-variant mt-4 sm:mt-6 leading-relaxed max-w-xl">
              {homepage.philosophyText}
            </p>
          )}

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              {homepage.founderName.trim() && (
                <p className="font-headline-sm text-headline-sm text-primary">{homepage.founderName}</p>
              )}
              {homepage.founderTitle.trim() && (
                <p className="font-label-sm text-label-sm text-outline tracking-wider uppercase mt-0.5">{homepage.founderTitle}</p>
              )}
            </div>
            <Link
              className="px-5 sm:px-6 py-2.5 sm:py-3 border border-primary text-primary hover:bg-primary hover:text-surface font-label-md text-label-md rounded-full transition-all duration-200 flex-shrink-0 text-center"
              href="/about"
            >
              Discover Our Heritage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
