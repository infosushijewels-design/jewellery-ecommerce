"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  { id: 1, src: '/images/hero/banner-1.png', alt: 'Timeless Beauty in Every Detail', href: '/collections' },
  { id: 2, src: '/images/hero/banner-2.png', alt: 'Timeless Elegance for Every You', href: '/new-arrivals' },
  { id: 3, src: '/images/hero/banner-3.png', alt: 'Jewellery that Blooms with You', href: '/anthologies' },
  { id: 4, src: '/images/hero/banner-4.png', alt: 'Timeless Bangles for Every Occasion', href: '/collections' },
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
    <section className="relative w-full overflow-hidden bg-surface-container-low group">
      {/* Slider Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9]" style={{ position: 'relative' }}>
            <Link href={slide.href} className="block w-full h-full absolute inset-0">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover object-center"
                priority={slide.id === 1}
              />
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
    </section>
  );
}
