'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ShopByGender() {
  return (
    <section className="py-12 sm:py-20 bg-surface scroll-mt-[120px] lg:scroll-mt-[150px]" id="shop-by-gender">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-14">
          <span className="font-label-sm text-secondary uppercase tracking-[0.25em] text-[11px] sm:text-xs font-semibold block mb-2">
            Curated For Two
          </span>
          <h2 className="font-headline-lg text-primary text-2xl sm:text-4xl tracking-tight">
            Designed for <span className="italic font-normal text-secondary">Him</span>, Adored by{' '}
            <span className="italic font-normal text-secondary">Her</span>
          </h2>
          <div className="w-12 h-px bg-secondary/50 mx-auto mt-3 sm:mt-4" />
        </div>

        {/* Dual Split-Card Grid with Interactive Hover Expansion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          
          {/* Card 1: FOR HIM (Deep rich primary-container tones + Gold) */}
          <Link
            href="/for-him"
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl sm:rounded-3xl border border-[#371736]/30 bg-[#160B0E] min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] p-6 sm:p-10 transition-all duration-500 hover:shadow-2xl hover:border-secondary/60"
          >
            {/* Background Model Image with smooth zoom-in on hover */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/for_him_card.jpg"
                alt="Men's Fine Jewellery Collection - Chains, Bracelets & Rings"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top sm:object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-90"
              />
              {/* Gradient overlay matching the website's dark primary theme (#160b0e / #2d2024) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#160B0E] via-[#160B0E]/40 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#160B0E]/60 via-transparent to-transparent opacity-80" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 mb-auto flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-label-sm uppercase tracking-widest bg-[#2D2024]/80 text-secondary-fixed border border-secondary/30 backdrop-blur-md">
                Men&rsquo;s Edit
              </span>
              <span className="text-secondary/60 text-xs tracking-widest font-mono">
                01
              </span>
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 pt-16">
              <span className="text-secondary-fixed-dim text-xs uppercase tracking-[0.2em] font-label-sm block mb-1.5">
                Bold &amp; Timeless
              </span>
              <h3 className="font-headline-lg text-surface text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-2">
                For <span className="italic font-normal text-secondary-fixed">Him</span>
              </h3>
              <p className="font-body-md text-surface-dim/90 text-sm sm:text-base max-w-sm mb-6">
                Chains, signet rings, handcrafted kadas and understated diamond bracelets.
              </p>

              {/* Pill Button styled with website gold secondary tokens */}
              <div className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full border border-secondary text-secondary-fixed bg-surface-container-lowest/10 backdrop-blur-md group-hover:bg-secondary group-hover:text-surface transition-all duration-300 font-label-md text-xs sm:text-sm tracking-wide shadow-sm">
                <span>Explore Men&rsquo;s Collection</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>

            {/* Subtle inner gold border accent */}
            <div className="absolute inset-3 rounded-xl sm:rounded-2xl border border-secondary/20 pointer-events-none group-hover:border-secondary/40 transition-colors" />
          </Link>

          {/* Card 2: FOR HER (Warm Champagne surface-container-low tones + Gold) */}
          <Link
            href="/for-her"
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl sm:rounded-3xl border border-secondary/30 bg-[#F6F3EE] min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] p-6 sm:p-10 transition-all duration-500 hover:shadow-2xl hover:border-secondary/80"
          >
            {/* Background Model Image with smooth zoom-in on hover */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/for_her_card.jpg"
                alt="Women's Fine Jewellery Collection - Solitaires, Necklaces & Earrings"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top sm:object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-95"
              />
              {/* Gradient overlay matching the website's ivory surface theme (#fcf9f4 / #f6f3ee) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F6F3EE] via-[#F6EDE3]/60 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#F6F3EE]/60 via-transparent to-transparent opacity-80" />
            </div>

            {/* Top Badge */}
            <div className="relative z-10 mb-auto flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-label-sm uppercase tracking-widest bg-surface/90 text-secondary border border-secondary/30 backdrop-blur-md">
                Women&rsquo;s Edit
              </span>
              <span className="text-secondary/60 text-xs tracking-widest font-mono">
                02
              </span>
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 pt-16">
              <span className="text-secondary text-xs uppercase tracking-[0.2em] font-label-sm block mb-1.5 font-medium">
                Graceful &amp; Radiant
              </span>
              <h3 className="font-headline-lg text-primary text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-2">
                For <span className="italic font-normal text-secondary">Her</span>
              </h3>
              <p className="font-body-md text-on-surface-variant text-sm sm:text-base max-w-sm mb-6">
                Luminous diamond necklaces, solitaire rings, chokers and heirloom bangles.
              </p>

              {/* Pill Button styled with website gold secondary tokens */}
              <div className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full border border-secondary text-secondary bg-surface/80 backdrop-blur-md group-hover:bg-secondary group-hover:text-surface transition-all duration-300 font-label-md text-xs sm:text-sm tracking-wide shadow-sm">
                <span>Explore Women&rsquo;s Collection</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>

            {/* Subtle inner gold border accent */}
            <div className="absolute inset-3 rounded-xl sm:rounded-2xl border border-secondary/25 pointer-events-none group-hover:border-secondary/50 transition-colors" />
          </Link>

        </div>
      </div>
    </section>
  );
}
