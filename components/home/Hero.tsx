"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  { id: 1, src: '/images/hero/banner-1.png', alt: 'Timeless Beauty in Every Detail', href: '/collections', cta: 'Shop Now' },
  { id: 2, src: '/images/hero/banner-2.png', alt: 'Timeless Elegance for Every You', href: '/new-arrivals', cta: 'Shop New Arrivals' },
  { id: 3, src: '/images/hero/banner-3.png', alt: 'Jewellery that Blooms with You', href: '/anthologies', cta: 'Explore Now' },
  { id: 4, src: '/images/hero/banner-4.png', alt: 'Timeless Bangles for Every Occasion', href: '/category/bangles', cta: 'Shop Bangles' },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="w-full bg-surface-container-low">
      <div className="relative overflow-hidden group">
      {/* Slider Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full relative aspect-[9/4] md:aspect-[3/1]" style={{ position: 'relative' }}>
            <Link href={slide.href} className="block w-full h-full absolute inset-0">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                // Banners are 3:1 with the headline baked into the right half. On mobile keep the
                // right side (headline + product) in frame; from md up the full banner fits exactly.
                sizes="100vw"
                className="object-cover object-right md:object-center"
                priority={slide.id === 1}
              />
              {/* CTA — a span, since the whole banner is already the link */}
              <span className="hidden lg:inline-flex absolute bottom-[5%] left-[75.5%] -translate-x-1/2 items-center gap-2 bg-primary text-surface px-6 py-2.5 xl:py-3 font-label-md text-label-md uppercase tracking-[0.15em] shadow-lg transition-colors hover:bg-tertiary whitespace-nowrap">
                {slide.cta}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* Prev Button */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-primary shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none"
        aria-label="Previous Slide"
      >
        <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
      </button>

      {/* Next Button */}
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-primary shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none"
        aria-label="Next Slide"
      >
        <span className="material-symbols-outlined text-2xl leading-none">chevron_right</span>
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              current === index 
                ? 'w-6 h-1.5 bg-primary' 
                : 'w-2 h-1.5 bg-primary/40 hover:bg-primary/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      </div>

      {/* Below lg the banner is too small to overlay a button without covering its text */}
      <div className="lg:hidden flex justify-center py-4 bg-surface">
        <Link
          href={slides[current].href}
          className="inline-flex items-center gap-2 bg-primary text-surface px-6 py-2.5 font-label-md text-label-md uppercase tracking-[0.15em] hover:bg-tertiary transition-colors"
        >
          {slides[current].cta}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </section>
  );
}
