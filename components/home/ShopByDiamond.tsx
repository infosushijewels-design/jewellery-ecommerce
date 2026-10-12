'use client';

import { useState } from 'react';
import Link from 'next/link';

const DIAMONDS = [
  {
    id: 'natural-diamond',
    tab: 'Natural Dia',
    badge: 'Natural Dia',
    title: 'Natural Dia Jewellery',
    tag: 'Earth Mined',
    desc: 'Certified authentic natural diamonds with everlasting prestige and fire.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    href: '/search?q=natural%20diamond',
  },
  {
    id: 'lab-grown',
    tab: 'Lab Grown',
    badge: 'Lab Grown',
    title: 'Lab Grown Jewellery',
    tag: 'Conscious Luxury',
    desc: 'Precision-created diamonds matching identical optical and physical brilliance.',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    href: '/search?q=lab%20grown',
  },
  {
    id: 'solitaires',
    tab: 'Solitaire',
    badge: 'Solitaire',
    title: 'Solitaire Essentials',
    tag: 'Statement Centerpiece',
    desc: 'Iconic single-stone masterpieces cut for maximum light dispersion.',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
    href: '/search?q=solitaire',
  },
  {
    id: 'dia-jewellery',
    tab: 'PavÃ©',
    badge: 'PavÃ©',
    title: 'PavÃ© Diamonds',
    tag: 'Timeless PavÃ©',
    desc: 'Versatile diamond designs crafted for daily elegance and grand occasions.',
    image: 'https://images.unsplash.com/photo-1611591475152-4735661db190?auto=format&fit=crop&w=800&q=80',
    href: '/search?q=diamond',
  },
  {
    id: 'gemstone',
    tab: 'Gemstone',
    badge: 'Gemstone',
    title: 'Gemstone Jewellery',
    tag: 'Royal Hues',
    desc: 'Vibrant rubies, emeralds, and sapphires harmonized with glittering diamonds.',
    image: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80',
    href: '/search?q=gemstone',
  },
];

export default function ShopByDiamond() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="shop-by-diamond" className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">

      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8">
        <div className="min-w-0">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase block mb-0.5">
            Certified Brilliance &amp; Cuts
          </span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary leading-tight">
            Shop by <em className="italic text-secondary">Diamond</em>
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

      {/* Tab Pills â€” wrapping on mobile */}
      <div className="flex flex-wrap gap-2 mb-5 sm:mb-8">
        {DIAMONDS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-label-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-all duration-200 border ${
              activeTab === idx
                ? 'bg-gradient-to-r from-[#D4AF6A] to-[#B99A62] text-white border-transparent shadow-sm'
                : 'bg-transparent text-on-surface-variant border-outline-variant/60 hover:border-secondary hover:text-primary'
            }`}
          >
            {item.tab}
          </button>
        ))}
      </div>

      {/* MOBILE: 2-column grid */}
      <div className="sm:hidden grid grid-cols-2 gap-2">
        {DIAMONDS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-surface-container"
          >
            <span className="absolute top-2 left-2 z-10 bg-white/85 backdrop-blur-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#2D2024]">
              {item.badge}
            </span>
            <img
              className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500"
              src={item.image}
              alt={item.title}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-end p-3 text-white">
              <span className="text-[8px] uppercase tracking-widest opacity-75 font-medium">{item.tag}</span>
              <h3 className="text-[13px] font-semibold leading-tight mt-0.5">{item.title}</h3>
            </div>
          </a>
        ))}
      </div>

      {/* DESKTOP: 5-column grid */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        {DIAMONDS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="group relative rounded-xl overflow-hidden aspect-[4/5] bg-surface-container border border-outline-variant/50 hover:border-secondary/60 transition-all duration-300"
          >
            <span className="absolute top-2 left-2 z-10 bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] sm:text-label-sm font-label-sm uppercase tracking-wider text-primary border border-secondary/40">
              {item.badge}
            </span>
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src={item.image}
              alt={item.title}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
              <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">
                {item.tag}
              </span>
              <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1 leading-tight">
                {item.title}
              </h3>
              <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block line-clamp-2">
                {item.desc}
              </p>
            </div>
          </a>
        ))}
      </div>

    </section>
  );
}