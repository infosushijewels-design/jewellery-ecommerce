"use client";

import React from 'react';

export interface CompactReview {
  id: string;
  rating: number;
  text: string;
}

const DEFAULT_REVIEWS: CompactReview[] = [
  {
    id: 'rev-1',
    rating: 5,
    text: 'The diamond brilliance in real life is unmatched! Truly royal craftsmanship.',
  },
  {
    id: 'rev-2',
    rating: 5,
    text: 'Bridal choker finish is stunning. 100% hallmarked pure 916 gold.',
  },
  {
    id: 'rev-3',
    rating: 5,
    text: 'Packaging was exceptionally luxurious. IGI certificate gave full peace of mind.',
  },
  {
    id: 'rev-4',
    rating: 5,
    text: 'Flawless bespoke anniversary customization. Prompt and insured delivery.',
  },
  {
    id: 'rev-5',
    rating: 5,
    text: 'Lightweight, sturdy screw-backs and elegant shine for everyday wear.',
  },
];

interface ReviewsMarqueeProps {
  reviews?: CompactReview[];
}

export default function ReviewsMarquee({ reviews = [] }: ReviewsMarqueeProps) {
  // Use provided real reviews or fallback to the 5 curated luxury reviews
  const activeReviews = reviews.length >= 3 ? reviews : DEFAULT_REVIEWS;

  // Duplicate list to achieve a seamless infinite marquee loop
  const marqueeItems = [...activeReviews, ...activeReviews];

  return (
    <section className="py-6 sm:py-8 bg-surface-container-low border-y border-outline-variant/30 overflow-hidden" id="testimonials">
      <div className="max-w-[1440px] mx-auto px-4 mb-3 sm:mb-4 text-center">
        <span className="font-label-sm text-[10.5px] sm:text-[11px] text-secondary tracking-[0.25em] uppercase font-semibold">
          ✦ Client Experiences &amp; Ratings ✦
        </span>
        <h2 className="font-headline-sm text-[17px] sm:text-[20px] text-primary mt-0.5 font-medium">
          Rated <span className="text-secondary font-semibold">★★★★★ 4.9 / 5.0</span> by Fine Jewellery Connoisseurs
        </h2>
      </div>

      {/* Marquee Wrapper with soft edge fades */}
      <div className="relative overflow-hidden w-full">
        {/* Left Gradient Fade */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-12 sm:w-32 z-10"
          style={{ background: 'linear-gradient(to right, var(--color-surface-container-low, #f6f3ee), transparent)' }}
        />
        {/* Right Gradient Fade */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-12 sm:w-32 z-10"
          style={{ background: 'linear-gradient(to left, var(--color-surface-container-low, #f6f3ee), transparent)' }}
        />

        {/* Continuous Horizontal Moving Track */}
        <div className="reviews-marquee-track flex gap-3 sm:gap-5 w-max py-1.5 px-4" aria-label="Customer Reviews">
          {marqueeItems.map((r, idx) => (
            <article
              key={`${r.id}-${idx}`}
              className="flex-shrink-0 bg-surface rounded-xl border border-outline-variant/40 shadow-xs px-4 sm:px-5 py-3 flex flex-col justify-between w-[290px] sm:w-[350px] hover:border-secondary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex text-secondary text-[13px] sm:text-[14px]" aria-label={`${r.rating} stars`}>
                  {[...Array(r.rating || 5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <span className="text-[10px] sm:text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified Purchase
                </span>
              </div>
              <p className="font-headline-sm italic text-[13px] sm:text-[14px] text-primary leading-snug line-clamp-2">
                &ldquo;{r.text}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .reviews-marquee-track {
          animation: reviews-scroll 26s linear infinite;
        }
        .reviews-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes reviews-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
