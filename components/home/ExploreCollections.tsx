'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

const COLLECTIONS: CollectionItem[] = [
  {
    id: 'necklaces',
    title: 'Necklaces',
    subtitle: 'Layered & Chokers',
    image: '/images/pure_necklaces.jpg',
    href: '/category/necklaces',
  },
  {
    id: 'earrings',
    title: 'Earrings',
    subtitle: 'Solitaires & Drops',
    image: '/images/pure_earrings.jpg',
    href: '/category/earrings',
  },
  {
    id: 'officewear',
    title: 'Office Wear',
    subtitle: 'Minimal & Daily',
    image: '/images/pure_officewear.jpg',
    href: '/search?q=minimal',
  },
  {
    id: 'bridal',
    title: 'Bridal Sets',
    subtitle: 'Royal Polki & Gold',
    image: '/images/pure_bridal.jpg',
    href: '/category/bridal',
  },
  {
    id: 'rings',
    title: 'Rings',
    subtitle: 'Bands & Cocktails',
    image: '/images/pure_rings.jpg',
    href: '/category/rings',
  },
];

export default function ExploreCollections() {
  const [activeIndex, setActiveIndex] = useState(2); // Start with Office Wear in center
  const [isPaused, setIsPaused] = useState(false);
  const total = COLLECTIONS.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotation every 3.5s, cleanly pauses when hovered
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, total]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % total);
  };

  return (
    <section
      className="relative py-14 sm:py-20 lg:py-24 bg-[#FAF6F0] overflow-hidden"
      id="explore-collections"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Explore Our Collections"
    >
      {/* Decorative Ambient Rose Petals on Left & Right Margins */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -left-10 top-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#F4D0D8]/40 blur-[80px]" />
        <div className="absolute -right-10 top-1/3 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#F6CAD4]/35 blur-[80px]" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Heading with Luxury Emblem and Gold Divider Rules */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-4 mb-2.5">
            <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#B89758]/70" />
            <svg
              className="w-5 h-5 text-[#B89758]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            </svg>
            <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#B89758]/70" />
          </div>

          <h2 className="font-headline-lg text-primary text-2xl sm:text-3xl lg:text-4xl uppercase tracking-[0.2em] font-medium">
            Explore Our Collections
          </h2>
          <div className="w-10 h-0.5 bg-[#B89758]/40 mx-auto mt-3" />
        </div>

        {/* 
          Stable 5-Slot Carousel Container:
          - Uses relative flow with proper height and padding
          - Cards NEVER overlap horizontally; each has its own dedicated slot
          - Center card (slot 2) is scaled up 1.1x with high elevation
          - Side cards are cleanly visible, upright or subtley framed, with no covering of text or image
        */}
        <div className="relative w-full max-w-6xl mx-auto flex items-center justify-center py-4">
          
          {/* Navigation Arrows positioned on outer perimeter without touching cards */}
          <button
            onClick={handlePrev}
            aria-label="Previous collection"
            className="absolute left-0 sm:left-1 lg:-left-4 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-primary border border-[#B89758]/35 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">chevron_left</span>
          </button>

          <button
            onClick={handleNext}
            aria-label="Next collection"
            className="absolute right-0 sm:right-1 lg:-right-4 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-primary border border-[#B89758]/35 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">chevron_right</span>
          </button>

          {/* Cards Track (Flex layout on Desktop for guaranteed ZERO horizontal overlap) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 items-center w-full px-8 sm:px-10 lg:px-6">
            {COLLECTIONS.map((item, index) => {
              // Calculate offset relative to activeIndex (-2, -1, 0, 1, 2)
              let offset = (index - activeIndex + total) % total;
              if (offset > 2) offset -= total;

              const isCenter = offset === 0;
              const isImmediate = Math.abs(offset) === 1;

              // Hide far cards on mobile & tablet gracefully
              const visibilityClass = isCenter
                ? 'block'
                : isImmediate
                ? 'hidden sm:block'
                : 'hidden lg:block';

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`${visibilityClass} cursor-pointer transition-all duration-500 ease-out will-change-transform ${
                    isCenter
                      ? 'scale-105 sm:scale-110 z-30'
                      : 'scale-95 opacity-85 hover:opacity-100 hover:scale-100 z-10'
                  }`}
                >
                  <Link
                    href={item.href}
                    className={`block w-full bg-white rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 shadow-md ${
                      isCenter
                        ? 'border-[#B89758] ring-2 ring-[#B89758]/30 shadow-2xl -translate-y-1'
                        : 'border-[#B89758]/25 hover:border-[#B89758]/60 hover:shadow-xl'
                    }`}
                  >
                    {/* Consistent Fixed Aspect Ratio Image Container */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F6EDE3]">
                      <Image
                        src={item.image}
                        alt={`${item.title} fine jewellery`}
                        fill
                        sizes="(max-width: 640px) 260px, (max-width: 1024px) 200px, 220px"
                        className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                      />
                    </div>

                    {/* Clean Polaroid Caption Bar at Bottom */}
                    <div className="p-3 sm:p-4 text-center bg-white border-t border-[#B89758]/15">
                      <h3 className="font-headline-sm text-primary text-base sm:text-lg font-medium tracking-wide">
                        {item.title}
                      </h3>
                      <p className="font-body-sm text-[#745A29] text-[11px] sm:text-xs mt-0.5 tracking-wider font-semibold">
                        {isCenter ? 'Explore Collection →' : item.subtitle}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

        </div>

        {/* Carousel Pagination Indicator Dots */}
        <div className="flex justify-center items-center gap-2 mt-8 sm:mt-10">
          {COLLECTIONS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === i
                  ? 'w-10 bg-[#745A29]'
                  : 'w-2 bg-[#745A29]/25 hover:bg-[#745A29]/60'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
