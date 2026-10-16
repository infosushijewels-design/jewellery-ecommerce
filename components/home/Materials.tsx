'use client';

import { useState } from 'react';
import Link from 'next/link';

const METALS = [
  {
    id: 'yellow-gold',
    tab: 'Yellow Gold',
    badge: 'Pure Gold',
    title: 'Yellow Gold',
    tag: 'Pure Gold',
    desc: 'Warm heritage sheen with government BIS Hallmarking.',
    image: '/images/yellow_gold.jpg',
    alt: 'BIS hallmarked pure yellow gold handcrafted fine jewellery',
    href: '/search?q=yellow%20gold',
  },
  {
    id: 'white-gold',
    tab: 'White Gold',
    badge: 'Precious White',
    title: 'White Gold',
    tag: 'Precious White',
    desc: 'Lustrous rhodium finish with contemporary modern brilliance.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    alt: 'Lustrous 18K white gold fine diamond ring with contemporary brilliance',
    href: '/search?q=white%20gold',
  },
  {
    id: 'rose-gold',
    tab: 'Rose Gold',
    badge: 'Rose Gold',
    title: 'Rose Gold',
    tag: 'Rose Gold',
    desc: 'Subtle blush alloys formulated for daily skin comfort.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    alt: 'Subtle blush rose gold fine earrings crafted for everyday luxury',
    href: '/search?q=rose%20gold',
  },
  {
    id: 'three-tone',
    tab: 'Three Tone',
    badge: 'Tricolor',
    title: 'Three Tone',
    tag: 'Tricolor',
    desc: 'Exquisite harmony of yellow, white, and rose gold in one piece.',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
    alt: 'Tricolor gold jewellery in yellow, white, and rose gold harmony',
    href: '/search?q=three%20tone',
  },
  {
    id: 'heritage',
    tab: 'Heritage',
    badge: 'Artisan Craft',
    title: 'Heritage & Vintage',
    tag: 'Artisan Craft',
    desc: 'Intricately handcrafted antique finishes inspired by royal heirlooms.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    alt: 'Handcrafted heritage and antique finished gold jewellery',
    href: '/collections/premium-collection',
  },
];

export default function Materials() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="materials" className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">

      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8">
        <div className="min-w-0">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase block mb-0.5">
            Precious Metals &amp; Finishes
          </span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary leading-tight">
            Shop by <em className="italic text-secondary">Metal</em>
          </h2>
        </div>
        <Link
          href="/collections"
          className="font-label-sm text-[11px] sm:text-label-sm text-primary uppercase tracking-wider hover:text-secondary transition-colors flex items-center gap-1 whitespace-nowrap pb-1 flex-shrink-0"
        >
          View All
          <span className="material-symbols-outlined text-[14px] sm:text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Tab Pills - wrapping on mobile */}
      <div className="flex flex-wrap gap-2 mb-5 sm:mb-8">
        {METALS.map((metal, idx) => (
          <button
            key={metal.id}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-label-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-all duration-200 border ${
              activeTab === idx
                ? 'bg-gradient-to-r from-[#D4AF6A] to-[#B99A62] text-white border-transparent shadow-sm'
                : 'bg-transparent text-on-surface-variant border-outline-variant/60 hover:border-secondary hover:text-primary'
            }`}
          >
            {metal.tab}
          </button>
        ))}
      </div>

      {/* MOBILE: 2-column grid - all cards visible */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        {METALS.map((metal) => (
          <a
            key={metal.id}
            href={metal.href}
            className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-surface-container"
          >
            <img
              className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500"
              src={metal.image}
              alt={metal.alt}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent flex flex-col justify-end p-3 text-white">
              <h3 className="text-[14px] font-semibold leading-tight mt-0.5">{metal.title}</h3>
            </div>
          </a>
        ))}
      </div>

      {/* DESKTOP: 5-column grid */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {METALS.map((metal) => (
          <a
            key={metal.id}
            href={metal.href}
            className="group relative rounded-xl overflow-hidden aspect-[4/5] bg-surface-container border border-outline-variant/50 hover:border-secondary/60 transition-all duration-300"
          >
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src={metal.image}
              alt={metal.alt}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
              <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1 leading-tight">
                {metal.title}
              </h3>
            </div>
          </a>
        ))}
      </div>

    </section>
  );
}