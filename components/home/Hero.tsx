"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSwipe } from '@/lib/hooks/useSwipe';

const slides = [
  { id: 1, src: '/images/hero/banner-1.png', alt: 'Sushi Jewels - Fine handcrafted gold and diamond jewellery showcase', href: '/collections', cta: 'Shop Now' },
  { id: 2, src: '/images/hero/banner-2.png', alt: 'Sushi Jewels Premium Collection - Timeless elegance and artisan bridal designs', href: '/collections/premium-collection', cta: 'Explore Collections' },
  { id: 3, src: '/images/hero/banner-3.png', alt: 'Sushi Jewels - Natural diamond jewellery anthology and timeless statement pieces', href: '/anthologies', cta: 'Explore Now' },
  { id: 4, src: '/images/hero/banner-4.png', alt: 'Sushi Jewels - Handcrafted BIS hallmarked gold bangles collection', href: '/category/bangles', cta: 'Shop Bangles' },
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

  // Swipe left/right on touch devices
  const { onTouchStart, onTouchEnd } = useSwipe({ onSwipeLeft: nextSlide, onSwipeRight: prevSlide, threshold: 50 });

  return (
    <section className="w-full bg-surface-container-low">
      <div className="relative overflow-hidden group" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
              {/* CTA button removed — the full banner is clickable */}
            </Link>
          </div>
        ))}
      </div>

      </div>

      {/* Custom design entry point — sits below the slider so it never overlaps the
          slide links, dots, or swipe area. */}
      <div className="border-t border-outline-variant/30 py-3.5 sm:py-4 px-4">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant italic">
            Have a design in mind? Let us bring it to life.
          </p>
          <Link
            href="/customize-your-design"
            className="flex-shrink-0 px-6 py-2.5 bg-primary text-surface rounded-full font-label-md text-label-md uppercase tracking-wider hover:bg-tertiary transition-colors"
          >
            Customize Your Jewellery
          </Link>
        </div>
      </div>
    </section>
  );
}
