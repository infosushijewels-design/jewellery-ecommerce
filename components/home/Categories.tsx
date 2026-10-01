"use client";

import Link from 'next/link';
import { useState } from 'react';

const categoriesData = [
  { name: 'Rings', href: '/category/rings', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOYxVJY_ToSSiEr0r7EOQKbys6_0lQsg7mW41f1zRoVjobYjjhqg1IEQooTvhcgx2mswkzGUinEv6sUPppwFYHvgURIusQq0fmH_u8oj5K1IbhvGNx3RJ4b0a8t7Hk6-D1PQCCz05oUfBxfLzNyfuwCP0RiEvDoZj0BtEpnIHeQho0HEvsl27g41kpoiKFRl4HefuKsmW7v_S8L_3811k_iqcVWvlZMmkO2sFBz-Twd6N1-qRz3q0anQ', bold: true },
  { name: 'Earrings', href: '/category/earrings', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6qUYyElB8wCXbqcO1xhPQF_hA64Q6egLl1PYpWV94ogd9-u9FAf--6REiSYN4qE4NYN9oD1tXfZutK8E5peM3SwtDZPEePtHQV_zDYahiRMa4mHr-eCFgwDmvPH0lA6F_heBHo0Hx9E6yUiQWM_IzoUOwMbEIFZdNuXodyXSubbJF49sJbYmXC9pbe3Cg204sveBWWYkHAEjE53fNtsSFM27ZN6sag6Q-TMJ8on9RTivw87EZqFpm1A' },
  { name: 'Necklaces', href: '/category/necklaces', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3yhgDSqMi6hvGcuYYbRuCb511X1TBltq8x7ArVN-eBNS_vYSQ3i2vRtBAPS6JB8_epfCjzK-9o4y21ImVQDVO74zk3Z6RohGmecYDE5YfjFdin59rsj2NZFYxPM1V60NOGlSMeaeGnwGLMESlxnk1hXTvYgB65dKjtswSNhtdFjpgn2HljDYB7cDg4crRceOP0sHyffGVhMYRtij3TV3wjVE4Q_YoGqfo0Zyz2ODIeQidetugxWfoOA' },
  { name: 'Bracelets', href: '/category/bracelets', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCdwyBjLtIH2wJ72ckqQ_ensYSUN2apMHPlLF0O5zIZ5RP0e9UdswrZN1besrow0Gb38F-0M9YqYfnd37FPktH1dVtFsLSGOzHF38MQD21oX2AAslm2u713dssYS1ds2ApE0qaEKMJu_Qb71Srfdi-ky9UitY8UmkOftZbWx_Fn1GYMIy0fq3LE9dkQIXrSvK_sFwbyG0r4wALX6N0oVakDnCJJI1N9PGGYl2XzzENWYPBfHVqUKS2w' },
  { name: 'Bangles', href: '/category/bangles', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl3UixI1cR0dZvSdyZO3g2ogohppy2eabEyxywfLKHADYpkKSXWPTb_gFzRD9OO_pPTWRf-wnbsxwiwLAIYQUCBhz_66GMkpY-lrxSv3UUKv1LsbWKE0ycoZin1bK_qoeZhUJKRsCilP7N9Duwqpsp_DM4thOr7fB-6Yk0bmN_YMpffbKI92X9SlkS_mJEzZPKkrh9TIfbkzL5Tir-sStvssUsU5AzR0AIHNu5efGCqCrajbKC_q4xKg' },
  { name: 'Solitaires', href: '/search?q=solitaire', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYaFTGzA8QjnJ4sd8JPMjITqQ-LuydJBs8Y0mKciPl4t2hHGx9c7CaXWLCrod9RC_lnHX5ElH_fXKjVsTpK72-RlqoXAiQpaqPMOzhtqZat2tF3DJgpogAV-Mf6zn_5tq40aB9mqGl8vYa65O7lgIOpQlB98kREKS8Id7cDFHRx0gQmS4qyilcfwo_aCmb3peyI0mb485mu_Dsk91uhIbk5B8CvGzbIR1DKi-1e4YPuzNTAyq8RVZamQ' },
  { name: 'Mangalsutras', href: '/category/necklaces?style=mangalsutra', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbTDRspPlaZdrt95j9IdK0vFArW_cjhYuuq-_OOoAoAHMD9-W-EwaMe839rg5ziZOf2nYNBaM5AMSnoKxGJ8Ryo6Dan-OCcf8XDjTgEPLJjFGAi73gNszawfDgQ234-xm4uVu643VXBrj9euiTvAoS76jwNmCvicXXEDEzht017mFmVjQGiF7hYkWqYDJAt6m-QYmIJgP3GmyVP3zylg7GqZM6RlE3zxL5G2R7kvd5KErY8QPih0QpBg' },
  { name: 'Gold Coins', href: '/search?q=gold%20coin', image: 'https://images.unsplash.com/photo-1708714290523-e9f76878bf53?auto=format&fit=crop&q=80&w=300' },
];

// Duplicated for seamless infinite loop
const marqueeItems = [...categoriesData, ...categoriesData];

/**
 * These category photos are hosted on a third-party "aida-public" preview
 * URL, not our own storage, so any of them can go missing or hang without
 * ever firing `onError`. Rendering the letter fallback underneath from the
 * start (instead of only creating it once `onError` fires) means a slow or
 * silently-failing image never leaves the browser's raw broken-image + alt
 * text showing on top of the circle — the photo simply fades in over the
 * fallback once (if) it actually loads.
 */
function CatImg({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-full h-full rounded-full overflow-hidden">
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-amber-800"
        style={{ background: 'linear-gradient(135deg, #f5e6c8 0%, #e8c97a 100%)' }}
      >
        {alt.charAt(0)}
      </div>
      {!failed && (
        <img
          className={`absolute inset-0 w-full h-full object-cover rounded-full group-hover:scale-105 transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          // The <img> is server-rendered, so it can finish loading before React
          // hydrates and attaches onLoad/onError — those events are then lost
          // and the photo would stay at opacity-0. Check the real state on mount.
          ref={(el) => {
            if (el?.complete) {
              if (el.naturalWidth > 0) setLoaded(true);
              else setFailed(true);
            }
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function Categories() {
  return (
    <section className="py-10 sm:py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 relative" id="categories">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Explore Categories</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Shop by Category</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Discover beautiful jewellery designed for every day and special occasions.</p>
      </div>

      {/* Marquee — works on both mobile & desktop */}
      <div className="relative overflow-hidden">
        {/* Left fade edge */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-12 sm:w-20 z-10"
          style={{ background: 'linear-gradient(to right, var(--color-surface, #fffaf5), transparent)' }}
        />
        {/* Right fade edge */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-12 sm:w-20 z-10"
          style={{ background: 'linear-gradient(to left, var(--color-surface, #fffaf5), transparent)' }}
        />

        {/* Scrolling track */}
        <div className="marquee-track flex gap-4 sm:gap-8 w-max py-2">
          {marqueeItems.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="group flex flex-col items-center flex-shrink-0 w-[72px] sm:w-[110px]"
            >
              <div className="w-[60px] h-[60px] sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-0.5 sm:p-1 group-hover:border-secondary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <CatImg src={cat.image} alt={cat.name} />
              </div>
              <span className={`text-[10px] sm:text-label-lg text-primary mt-1.5 sm:mt-3 group-hover:text-secondary transition-colors text-center leading-tight w-full ${cat.bold ? 'font-semibold' : ''}`}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 18s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
