import { Suspense } from 'react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import Collections from '@/components/home/Collections';
import Campaign from '@/components/home/Campaign';
import Bestsellers from '@/components/home/Bestsellers';
import Editorial from '@/components/home/Editorial';
import Materials from '@/components/home/Materials';
import ShopByDiamond from '@/components/home/ShopByDiamond';
import CustomizeDesignCard from '@/components/home/CustomizeDesignCard';
import Heritage from '@/components/home/Heritage';
import TrustMatrix from '@/components/home/TrustMatrix';
import FlagshipAtelier from '@/components/home/FlagshipAtelier';
import Testimonials from '@/components/home/Testimonials';
import Footer from '@/components/layout/Footer';

export const revalidate = 60;

/**
 * Categories and Bestsellers are the only homepage sections that query Supabase at render
 * time. Without a Suspense boundary, Next.js must wait for every section on the page
 * (including these) to resolve before it can send any HTML — on an ISR cache-miss/
 * regeneration request, that gates the Hero banner's paint behind two Supabase round-trips
 * it has nothing to do with. Wrapping just these two lets the rest of the page (Hero
 * included) stream immediately; these two sections pop in once their query resolves.
 * Fallbacks are sized to match each section's real layout so nothing shifts when they do.
 */
function CategoriesSkeleton() {
  return (
    <section className="py-10 sm:py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" aria-hidden="true">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12 animate-pulse">
        <div className="h-3 w-40 bg-surface-container mx-auto rounded-full mb-3" />
        <div className="h-7 w-56 bg-surface-container mx-auto rounded-full mb-3" />
        <div className="h-4 w-80 max-w-full bg-surface-container mx-auto rounded-full" />
      </div>
      <div className="flex justify-center gap-4 sm:gap-8 overflow-hidden lg:hidden animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-[60px] h-[60px] sm:w-24 sm:h-24 rounded-full bg-surface-container flex-shrink-0" />
        ))}
      </div>
      <div className="hidden lg:flex justify-center gap-x-10 xl:gap-x-14 max-w-5xl mx-auto animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-24 h-24 xl:w-28 xl:h-28 rounded-full bg-surface-container" />
        ))}
      </div>
    </section>
  );
}

function BestsellerCardSkeleton() {
  return (
    <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
      <div className="aspect-[3/4] bg-surface-container" />
      <div className="p-2.5 sm:p-3.5 space-y-2">
        <div className="h-3 bg-surface-container rounded-full w-full" />
        <div className="h-3 bg-surface-container rounded-full w-2/3 mx-auto" />
        <div className="border-t border-outline-variant/30 mt-2 pt-2 space-y-1.5">
          <div className="h-3 w-20 bg-surface-container rounded-full mx-auto" />
          <div className="h-2.5 w-16 bg-surface-container rounded-full mx-auto" />
        </div>
        <div className="h-5 w-28 bg-surface-container rounded-full mx-auto mt-2" />
      </div>
    </div>
  );
}

function BestsellersSkeleton() {
  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" aria-hidden="true">
      <div className="flex items-end justify-between gap-3 mb-5 sm:mb-8 animate-pulse">
        <div>
          <div className="h-3 w-32 bg-surface-container rounded-full mb-2" />
          <div className="h-7 w-48 bg-surface-container rounded-full" />
        </div>
        <div className="h-9 w-24 bg-surface-container rounded-full flex-shrink-0" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-5 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <BestsellerCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
        <Collections />
        <Campaign />
        <Suspense fallback={<BestsellersSkeleton />}>
          <Bestsellers />
        </Suspense>
        <Editorial />
        <Materials />
        <ShopByDiamond />
        <CustomizeDesignCard />
        <Heritage />
        <TrustMatrix />
        <FlagshipAtelier />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
