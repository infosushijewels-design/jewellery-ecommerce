"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSwipe } from '@/lib/hooks/useSwipe';

const slides = [
  {
    id: 1,
    src: '/images/hero/banner-1.png',
    alt: 'Sushi Jewels - Fine handcrafted gold and diamond jewellery showcase',
    href: '/collections',
    cta: 'Shop Now',
  },
  {
    id: 2,
    src: '/images/hero/banner-2.png',
    alt: 'Sushi Jewels Premium Collection - Timeless elegance and artisan bridal designs',
    href: '/collections/premium-collection',
    cta: 'Explore Collections',
  },
  {
    id: 3,
    src: '/images/hero/banner-3.png',
    alt: 'Sushi Jewels - Natural diamond jewellery anthology and timeless statement pieces',
    href: '/anthologies',
    cta: 'Explore Now',
  },
  {
    id: 4,
    src: '/images/hero/banner-4.png',
    alt: 'Sushi Jewels - Handcrafted BIS hallmarked gold bangles collection',
    href: '/category/bangles',
    cta: 'Shop Bangles',
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, []);

  // Auto-advance every 5 seconds, pauses when user hovers or interacts
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  // Touch swipe gestures for mobile & tablet
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    threshold: 40,
  });

  return (
    <section className="w-full bg-surface-container-low" aria-label="Featured Collections Carousel">
      <div
        className="relative overflow-hidden group select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slider Track */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={slide.id}
                className="min-w-full relative aspect-[3/1] bg-surface-container"
                aria-hidden={current !== index}
              >
                <Link
                  href={slide.href}
                  className="block w-full h-full absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  tabIndex={current === index ? 0 : -1}
                  aria-label={slide.alt}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    // Native aspect ratio of the banner PNGs is exactly 3:1 (2172x724).
                    // Centered object-cover at 3:1 ensures the jewellery on the left
                    // and typography on the right are both 100% visible across mobile, tablet & desktop.
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1440px"
                    className="object-cover object-center"
                    priority={isFirst}
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Previous Navigation Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-surface/85 hover:bg-surface text-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 -translate-x-1 group-hover:translate-x-0 z-10"
          aria-label="Previous banner slide"
        >
          <span className="material-symbols-outlined text-[18px] sm:text-[22px]">chevron_left</span>
        </button>

        {/* Next Navigation Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-surface/85 hover:bg-surface text-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 translate-x-1 group-hover:translate-x-0 z-10"
          aria-label="Next banner slide"
        >
          <span className="material-symbols-outlined text-[18px] sm:text-[22px]">chevron_right</span>
        </button>

        {/* Slide Indicator Dots (Positioned cleanly at bottom without obscuring content) */}
        <div
          className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-xs"
          role="tablist"
          aria-label="Slide dots"
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`transition-all duration-300 rounded-full ${
                current === index
                  ? 'w-5 sm:w-6 h-1 sm:h-1.5 bg-secondary-fixed shadow-xs'
                  : 'w-1.5 sm:w-2 h-1 sm:h-1.5 bg-surface/60 hover:bg-surface'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              role="tab"
              aria-selected={current === index}
            />
          ))}
        </div>
      </div>

      {/* Custom design entry point — sits below the slider so it never overlaps the slide area */}
      <div className="border-t border-outline-variant/30 py-3 sm:py-3.5 px-4 bg-surface">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-center">
          <p className="font-body-sm text-[12px] sm:text-body-sm text-on-surface-variant italic">
            Have a design in mind? Let us bring it to life.
          </p>
          <Link
            href="/customize-your-design"
            className="flex-shrink-0 px-5 sm:px-6 py-2 bg-primary text-surface rounded-full font-label-md text-[11px] sm:text-label-md uppercase tracking-wider hover:bg-secondary transition-colors"
          >
            Customize Your Jewellery
          </Link>
        </div>
      </div>
    </section>
  );
}
