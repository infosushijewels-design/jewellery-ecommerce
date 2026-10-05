"use client";

import Link from 'next/link';
import { useState } from 'react';

export interface CategoryItem {
  name: string;
  href: string;
  image: string;
  bold?: boolean;
}

/**
 * These category photos are hosted on a third-party "aida-public" preview
 * URL, not our own storage, so any of them can go missing or hang without
 * ever firing `onError`. Rendering the letter fallback underneath from the
 * start (instead of only creating it once `onError` fires) means a slow or
 * silently-failing image never leaves the browser's raw broken-image + alt
 * text showing on top of the circle — the photo simply fades in over the
 * fallback once (if) it actually loads.
 */
function CatImg({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-full h-full rounded-full overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-amber-800"
        style={{ background: 'linear-gradient(135deg, #f5e6c8 0%, #e8c97a 100%)' }}
      >
        {alt.charAt(0)}
      </div>
      {!failed && (
        <img
          className={`absolute inset-0 w-full h-full object-cover rounded-full group-hover:scale-105 transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          // The <img> is server-rendered, so it can finish loading before React
          // hydrates and attaches onLoad/onError — those events are then lost
          // and the photo would stay at opacity-0. Check the real state on mount.
          ref={(el) => {
            if (el?.complete) {
              if (el.naturalWidth > 0) setLoaded(true);
              else setFailed(true);
            }
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function CategoryMarquee({ items }: { items: CategoryItem[] }) {
  // Duplicated for seamless infinite loop
  const marqueeItems = [...items, ...items];

  return (
    <section className="py-10 sm:py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 relative" id="categories">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Explore Categories</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Shop by Category</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Discover beautiful jewellery designed for every day and special occasions.</p>
      </div>

      {/* Marquee — works on both mobile & desktop */}
      <div className="relative overflow-hidden">
        {/* Left fade edge */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-12 sm:w-20 z-10"
          style={{ background: 'linear-gradient(to right, var(--color-surface, #fffaf5), transparent)' }}
        />
        {/* Right fade edge */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-12 sm:w-20 z-10"
          style={{ background: 'linear-gradient(to left, var(--color-surface, #fffaf5), transparent)' }}
        />

        {/* Scrolling track */}
        <div className="marquee-track flex gap-4 sm:gap-8 w-max py-2">
          {marqueeItems.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="group flex flex-col items-center flex-shrink-0 w-[72px] sm:w-[110px]"
            >
              <div className="w-[60px] h-[60px] sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-0.5 sm:p-1 group-hover:border-secondary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <CatImg src={cat.image} alt={cat.name} />
              </div>
              <span className={`text-[10px] sm:text-label-lg text-primary mt-1.5 sm:mt-3 group-hover:text-secondary transition-colors text-center leading-tight w-full ${cat.bold ? 'font-semibold' : ''}`}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 18s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
