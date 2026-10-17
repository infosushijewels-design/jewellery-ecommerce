import { Suspense } from 'react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import CategoryBanners from '@/components/home/CategoryBanners';
import OurProducts from '@/components/home/OurProducts';
import ShopByGender from '@/components/home/ShopByGender';
import Heritage from '@/components/home/Heritage';
import FlagshipAtelier from '@/components/home/FlagshipAtelier';
import Testimonials from '@/components/home/Testimonials';
import ExploreCollections from '@/components/home/ExploreCollections';
import Footer from '@/components/layout/Footer';

export const revalidate = 60;

/**
 * Categories and OurProducts are the only homepage sections that query Supabase at render
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

function OurProductsSkeleton() {
  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" aria-hidden="true">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex items-end justify-between gap-3 mb-8 sm:mb-12 animate-pulse">
          <div>
            <div className="h-3 w-28 bg-surface rounded-full mb-2" />
            <div className="h-7 w-72 bg-surface rounded-full" />
          </div>
          <div className="h-5 w-16 bg-surface rounded-full flex-shrink-0" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-surface rounded-lg" />
          ))}
        </div>
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
        <Suspense fallback={<OurProductsSkeleton />}>
          <OurProducts />
        </Suspense>
        <ShopByGender />
        <CategoryBanners />
        <Heritage />
        <FlagshipAtelier />
        <Testimonials />
        <ExploreCollections />
      </main>
      <Footer />
    </>
  );
}
