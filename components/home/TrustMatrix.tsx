"use client";

import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

/** "Sushi Jewels Promises" — trust badges with Zomato-style marquee animation. */
export default function TrustMatrix() {
  const { store } = useStoreSettings();

  const promises = [
    { icon: 'verified', title: '100% Certified Jewellery', href: '/terms' },
    { icon: 'workspace_premium', title: 'BIS Hallmarked Gold', href: '/terms' },
    { icon: 'diamond', title: 'Certified Diamonds & Gems', href: '/search?q=diamond' },
    { icon: 'local_shipping', title: 'Pan-India Insured Shipping', href: '/shipping-policy' },
    { icon: 'draw', title: 'Bespoke Custom Atelier', href: '/#customize-design' },
  ];

  // Duplicate for seamless infinite loop
  const marqueeItems = [...promises, ...promises];

  return (
    <section className="py-10 sm:py-16 bg-surface border-b border-outline-variant/30" aria-labelledby="promises-heading">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <h2 id="promises-heading" className="font-headline-md text-[22px] sm:text-headline-md text-primary text-center mb-8 sm:mb-12">
          {store.name} Promises <span className="text-on-surface-variant/70">—</span> Excellence You Can Trust
        </h2>

        {/* Marquee wrapper */}
        <div className="relative overflow-hidden">
          {/* Left fade */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-12 sm:w-20 z-10"
            style={{ background: 'linear-gradient(to right, var(--color-surface, #fffaf5), transparent)' }}
          />
          {/* Right fade */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-12 sm:w-20 z-10"
            style={{ background: 'linear-gradient(to left, var(--color-surface, #fffaf5), transparent)' }}
          />

          {/* Scrolling track */}
          <ul className="trust-marquee-track flex gap-6 sm:gap-10 w-max py-2" aria-label="Trust promises">
            {marqueeItems.map((p, idx) => (
              <li key={idx} className="flex-shrink-0">
                <Link href={p.href} className="group flex flex-col items-center text-center w-[80px] sm:w-[130px]">
                  <span className="w-[64px] h-[64px] sm:w-[104px] sm:h-[104px] rounded-full border border-secondary/60 bg-surface flex items-center justify-center transition-all duration-300 group-hover:border-secondary group-hover:bg-secondary/5 group-hover:scale-110 group-hover:shadow-md">
                    <span
                      className="material-symbols-outlined text-secondary text-[28px] sm:text-[44px]"
                      style={{ fontVariationSettings: "'wght' 200" }}
                    >
                      {p.icon}
                    </span>
                  </span>
                  <span className="mt-2 sm:mt-4 font-body-sm text-[10px] sm:text-body-md text-on-surface leading-snug group-hover:text-primary">
                    {p.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-label-sm text-on-surface-variant/70 mt-8">*100% Certified authenticity and insured transit on every order.</p>
      </div>

      <style jsx>{`
        .trust-marquee-track {
          animation: trust-scroll 16s linear infinite;
        }
        .trust-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes trust-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
