'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BannerSlide {
  id: string;
  image: string;
  alt: string;
  link: string;
  width: number;
  height: number;
}

const slides: BannerSlide[] = [
  {
    id: 'heritage',
    image: '/images/sushi-jewels-banner.png?v=4',
    alt: 'Sushi Jewels - Made to Feel Beautiful',
    link: '/collections',
    width: 2048,
    height: 768,
  },
];

export default function AboutHeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-swipe timer: transitions every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden group select-none bg-[#160B0E]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="About Hero Banner Carousel"
    >
      {/* Horizontal Sliding Track */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] w-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="w-full flex-shrink-0 relative">
            <Link
              href={slide.link}
              className="block w-full cursor-pointer focus:outline-none"
              tabIndex={currentIndex === index ? 0 : -1}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                priority={index === 0}
                unoptimized
                sizes="100vw"
                className="w-full h-auto block"
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Arrow: Previous */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          prevSlide();
        }}
        aria-label="Previous Slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 shadow-lg z-20 focus:opacity-100 focus:outline-none"
      >
        <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_left</span>
      </button>

      {/* Navigation Arrow: Next */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          nextSlide();
        }}
        aria-label="Next Slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 shadow-lg z-20 focus:opacity-100 focus:outline-none"
      >
        <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
      </button>

      {/* Pagination Pill Indicators */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
        {slides.map((slide, index) => {
          const isActive = currentIndex === index;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full h-2 ${
                isActive
                  ? 'w-7 bg-[#E4C286] shadow-sm'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
