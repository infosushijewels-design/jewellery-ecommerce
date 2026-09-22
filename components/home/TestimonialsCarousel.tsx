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

export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
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
    // Initial state comes from the scroll/resize callbacks rather than a synchronous setState
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

  if (items.length === 0) return null;

  const arrowClass =
    'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface shadow-[0_4px_14px_rgba(45,32,36,0.15)] border border-outline-variant/40 items-center justify-center text-primary hover:bg-surface-container-low transition-opacity disabled:opacity-0 disabled:pointer-events-none';

  return (
    <div className="relative">
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
            className="snap-start flex-shrink-0 w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] bg-surface rounded-2xl p-6 shadow-[0_2px_12px_rgba(45,32,36,0.06)] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-0.5 text-[#E0A526]" aria-label={`${t.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: `'FILL' ${i <= t.rating ? 1 : 0}` }}
                  >
                    star
                  </span>
                ))}
              </div>
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
        ))}
      </div>

      <button type="button" onClick={() => scrollBy(1)} disabled={!canNext} className={`${arrowClass} -right-3 lg:-right-5`} aria-label="Next reviews">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}
