"use client";

import Link from "next/link";
import { useState, useRef } from "react";

const collections = [
  {
    href: "/collections/best-sellers",
    image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1000&q=80",
    alt: "Everyday Luxury",
    label: "Daily Wear",
    title: "The Everyday Edit",
    desc: "Lightweight 18K gold jewellery designed for work, home, and daily elegance.",
  },
  {
    href: "/collections/festive-collection",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
    alt: "Royal Provenance",
    label: "Royal & Antique",
    title: "Modern Heirlooms",
    desc: "Classic Jadau and antique designs crafted for festive celebrations and weddings.",
  },
  {
    href: "/collections/bridal-collection",
    image: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&w=1000&q=80",
    alt: "The Vivaha Suite",
    label: "Bridal Special",
    title: "Celebration & Bridal",
    desc: "Stunning bridal sets with certified natural diamonds designed for your wedding day.",
  },
];

export default function Collections() {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function goTo(idx: number) {
    setActive(Math.max(0, Math.min(collections.length - 1, idx)));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goTo(active + 1);
    else goTo(active - 1);
  }

  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="collections">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Featured Collections</span>
            <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Curated Collections</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Handcrafted gold and diamond jewellery for every special occasion.</p>
          </div>
          <Link className="font-label-lg text-label-lg text-primary hover:text-secondary flex items-center gap-1 group flex-shrink-0" href="/collections">
            View All Collections
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        {/* ── MOBILE: swipe carousel — each card is ~88% of the screen width, centred, so there is a comfortable margin either side ── */}
        <div className="sm:hidden">
          <div
            className="overflow-hidden rounded-xl"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Sliding track */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {collections.map((col, i) => (
                <div key={i} className="w-full flex-shrink-0">
                  <Link href={col.href} className="group block w-[88vw] max-w-[420px] mx-auto bg-surface rounded-xl overflow-hidden border border-outline-variant/50">
                    {/* Image */}
                    <div className="aspect-[10/9] overflow-hidden bg-surface-container">
                      <img
                        className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500"
                        src={col.image}
                        alt={col.alt}
                      />
                    </div>
                    {/* Text */}
                    <div className="p-4 flex flex-col gap-0.5">
                      <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">{col.label}</span>
                      <h3 className="font-headline-md text-headline-md text-primary">{col.title}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{col.desc}</p>
                      <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1 mt-2.5">
                        Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots + prev/next + counter */}
          <div className="flex items-center justify-between mt-4 w-[88vw] max-w-[420px] mx-auto">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              className="w-9 h-9 rounded-full border border-outline-variant/50 flex items-center justify-center text-primary disabled:opacity-30 transition-opacity"
              aria-label="Previous"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div className="flex items-center gap-2">
              {collections.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === active ? "w-6 h-2 bg-secondary" : "w-2 h-2 bg-outline-variant/60"
                  }`}
                  aria-label={`Go to collection ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-label-sm text-on-surface-variant">{active + 1}/{collections.length}</span>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                disabled={active === collections.length - 1}
                className="w-9 h-9 rounded-full border border-outline-variant/50 flex items-center justify-center text-primary disabled:opacity-30 transition-opacity"
                aria-label="Next"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP: Original 3-col grid ── */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {collections.map((col, i) => (
            <Link
              key={i}
              href={col.href}
              className={`group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col ${i === 2 ? "sm:col-span-2 md:col-span-1" : ""}`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-surface-container">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={col.image} alt={col.alt} />
              </div>
              <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">{col.label}</span>
                  <h3 className="font-headline-md text-headline-md text-primary mt-1">{col.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{col.desc}</p>
                </div>
                <div className="pt-4 sm:pt-6">
                  <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                    Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
