"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Swipe left/right on touch devices
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) nextSlide();
    else prevSlide();
  };

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
    </section>
  );
}
