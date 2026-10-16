"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipe } from '@/lib/hooks/useSwipe';

export interface Testimonial {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  date: string;
  /** Short highlight line from the review's own title field — real data, not generated. */
  headline: string;
  text: string;
  /** The reviewed product's real title, when the review is linked to one. */
  productName?: string;
}

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-secondary" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[16px]"
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
    <article className="bg-surface rounded-[18px] border border-[#EDE4D8] shadow-[0_4px_20px_rgba(22,11,14,0.06)] p-6 sm:p-7 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={t.rating} />
        <span className="font-label-sm text-[10px] text-on-surface-variant tracking-wider bg-surface-container-low px-2.5 py-1 rounded-full">
          {monthYear(t.date)}
        </span>
      </div>

      <span className="font-headline-lg text-[40px] text-secondary/60 leading-none select-none" aria-hidden="true">&ldquo;</span>

      {t.headline && (
        <h3 className="font-headline-sm text-[17px] sm:text-headline-sm text-primary leading-snug -mt-2 mb-2 line-clamp-2">
          &ldquo;{t.headline}&rdquo;
        </h3>
      )}

      <p className="font-body-md text-[14px] text-[#6B5A5F] leading-relaxed flex-1 line-clamp-3">{t.text}</p>

      {t.productName && (
        <div className="mt-4 bg-[#FAF6F0] border border-[#EFE7DA] rounded-lg px-3 py-2 flex items-center gap-1.5">
          <span className="text-secondary text-[12px]" aria-hidden="true">✦</span>
          <span className="font-body-sm text-[12px] text-on-surface-variant">
            Purchased: <span className="text-primary font-medium">{t.productName}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 mt-5 border-t border-outline-variant/40">
        <span className="w-10 h-10 rounded-full bg-[#24181C] text-secondary flex items-center justify-center font-headline-sm text-base flex-shrink-0">
          {t.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="font-headline-sm text-[15px] text-primary truncate">{t.name}</p>
          <p className="font-body-sm text-[11px] text-on-surface-variant truncate flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-secondary">verified</span>
            {t.subtitle}
          </p>
        </div>
      </div>
    </article>
  );
}

/* ─── Mobile Auto Carousel ─────────────────────────────────────────── */
function MobileCarousel({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

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

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => goTo((active + 1) % items.length),
    onSwipeRight: () => goTo((active - 1 + items.length) % items.length),
  });

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
