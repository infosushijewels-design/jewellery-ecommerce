'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Image from 'next/image';
import Link from 'next/link';
import FlagshipAtelier from '@/components/home/FlagshipAtelier';

const certifications = [
  {
    seal: 'BIS',
    title: 'BIS 916 Hallmarking',
    subtitle: 'Bureau of Indian Standards',
    description: 'Every gram of gold across all our collections is certified 916 (22K) or 750 (18K) by the Government of India, complete with unique HUID laser marking.',
  },
  {
    seal: 'IGI / GIA',
    title: 'IGI & GIA Certified',
    subtitle: 'Natural Diamond Grading',
    description: 'All natural solitaire diamonds are accompanied by independent laboratory certificates verifying color, clarity, carat, and symmetry with complete transparency.',
  },
  {
    seal: '100%',
    title: 'Ethical & Conflict-Free',
    subtitle: 'Kimberley Process Compliant',
    description: 'We only procure ethical diamonds that strictly adhere to the Kimberley Process. Zero child labour, fair artisan remuneration, and sustainable gold recycling.',
  },
];

export default function AboutPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full bg-surface">
        
        {/* ============================================================ */}
        {/* 1. HERO BANNER: Golden Jewelry Portrait Banner (Exact 3:1)   */}
        {/* ============================================================ */}
        <section className="relative w-full bg-[#160B0E] text-surface overflow-hidden">
          
          {/* Full-bleed Hero Banner: 100% edge-to-edge across the entire screen */}
          <div className="relative w-full">
            <Image
              src="/images/sushi-jewels-banner.png?v=4"
              alt="Sushi Jewels - Made to Make You Feel Beautiful"
              width={2048}
              height={768}
              priority
              unoptimized
              sizes="100vw"
              className="w-full h-auto block"
            />
          </div>

          {/* Luxury Floating Status & Action Bar */}
          <div className="relative z-10 border-t border-white/10 bg-[#160B0E] py-3.5 px-4 sm:px-6 lg:px-16">
            <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-[#DCDAD5]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E4C286] animate-pulse" />
                <span className="tracking-wide">✦ BIS 916 Hallmarked Gold &amp; IGI/GIA Certified Solitaires</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-[#E4C286] font-serif italic text-xs sm:text-sm">
                  Flagship Boutique: Kota, Rajasthan
                </span>
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E4C286] text-[#160B0E] font-medium text-xs tracking-wider uppercase hover:bg-surface transition-all duration-300 shadow-sm hover:scale-105"
                >
                  <span>Explore Atelier</span>
                  <span className="material-symbols-outlined text-xs font-bold">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

        </section>

        {/* ============================================================ */}
        {/* 2. PURITY & TRUST MATRIX (Provenance You Can Verify)          */}
        {/* ============================================================ */}
        <section className="py-14 sm:py-24 bg-surface">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
            
            <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
              <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-semibold">
                Certification &amp; Purity Matrix
              </span>
              <h2 className="font-headline-lg text-[26px] sm:text-[34px] font-serif text-primary mt-1.5">
                Provenance You Can Verify
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2.5">
                Complete transparency on every karat, cut, and laboratory certificate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {certifications.map((cert) => (
                <div 
                  key={cert.title}
                  className="p-6 sm:p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 hover:border-secondary/50 transition-colors shadow-xs flex flex-col items-center text-center"
                >
                  {/* Royal Gold Seal Medallion */}
                  <div className="w-16 h-16 rounded-full bg-surface-container-low border-2 border-secondary/40 flex items-center justify-center text-secondary mb-5 shadow-inner">
                    <span className="font-serif font-bold text-xs tracking-wider text-secondary">
                      {cert.seal}
                    </span>
                  </div>

                  <h3 className="font-headline-sm text-lg sm:text-xl font-serif text-primary">
                    {cert.title}
                  </h3>
                  <p className="text-[12px] font-label-md uppercase tracking-wider text-secondary font-semibold mt-1">
                    {cert.subtitle}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 leading-relaxed">
                    {cert.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. VISIT OUR FLAGSHIP ATELIER                                 */}
        {/* ============================================================ */}
        <div className="border-t border-outline-variant/30 bg-surface-container-low">
          <FlagshipAtelier />
        </div>

      </main>
      <Footer />
    </>
  );
}
