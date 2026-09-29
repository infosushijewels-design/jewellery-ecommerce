"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Testimonial {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  date: string;
  text: string;
}

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase();

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#E0A526]" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: `'FILL' ${i <= rating ? 1 : 0}` }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="bg-surface rounded-2xl p-6 shadow-[0_2px_12px_rgba(45,32,36,0.06)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <StarRating rating={t.rating} />
        <span className="text-label-sm text-on-surface-variant tracking-wider">{monthYear(t.date)}</span>
      </div>
      <p className="font-body-md text-[15px] text-on-surface leading-relaxed flex-1 line-clamp-6">{t.text}</p>
      <div className="flex items-center gap-3 pt-5 mt-6 border-t border-outline-variant/40">
        <span className="w-12 h-12 rounded-full bg-secondary-container/60 text-primary flex items-center justify-center font-headline-sm text-lg flex-shrink-0">
          {t.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-headline-sm text-[16px] text-primary truncate">{t.name}</p>
          <p className="text-label-sm text-on-surface-variant truncate">{t.subtitle}</p>
        </div>
      </div>
    </article>
  );
}

/* ─── Mobile Auto Carousel ─────────────────────────────────────────── */
function MobileCarousel({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  function goTo(idx: number) {
    setActive(idx);
    setPaused(true);
    setTimeout(() => setPaused(false), 8000); // resume after 8s
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goTo((active + 1) % items.length);
    else goTo((active - 1 + items.length) % items.length);
  }

  return (
    <div className="sm:hidden">
      {/* Card wrapper */}
      <div
        className="relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Sliding track */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {items.map((t) => (
            <div key={t.id} className="w-full flex-shrink-0 px-1">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-5">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to review ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === active
                ? 'w-6 h-2 bg-secondary'
                : 'w-2 h-2 bg-outline-variant/60 hover:bg-outline'
            }`}
          />
        ))}
      </div>

      {/* Prev / Next buttons */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => goTo((active - 1 + items.length) % items.length)}
          className="w-9 h-9 rounded-full border border-outline-variant/50 flex items-center justify-center text-primary hover:bg-surface-container transition-colors"
          aria-label="Previous review"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span className="flex items-center text-label-sm text-on-surface-variant">
          {active + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={() => goTo((active + 1) % items.length)}
          className="w-9 h-9 rounded-full border border-outline-variant/50 flex items-center justify-center text-primary hover:bg-surface-container transition-colors"
          aria-label="Next review"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Desktop Scroll Carousel (original) ───────────────────────────── */
function DesktopCarousel({ items }: { items: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(updateArrows);
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const arrowClass =
    'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface shadow-[0_4px_14px_rgba(45,32,36,0.15)] border border-outline-variant/40 items-center justify-center text-primary hover:bg-surface-container-low transition-opacity disabled:opacity-0 disabled:pointer-events-none';

  return (
    <div className="hidden sm:block relative">
      <button type="button" onClick={() => scrollBy(-1)} disabled={!canPrev} className={`${arrowClass} -left-3 lg:-left-5`} aria-label="Previous reviews">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth pb-2"
        aria-label="Customer reviews"
        role="region"
      >
        {items.map((t) => (
          <article
            key={t.id}
            data-card
            className="snap-start flex-shrink-0 w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
          >
            <TestimonialCard t={t} />
          </article>
        ))}
      </div>

      <button type="button" onClick={() => scrollBy(1)} disabled={!canNext} className={`${arrowClass} -right-3 lg:-right-5`} aria-label="Next reviews">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────── */
export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <MobileCarousel items={items} />
      <DesktopCarousel items={items} />
    </>
  );
}
