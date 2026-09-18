import React, { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductCatalog from '@/components/product/ProductCatalog';
import { getNewArrivals } from '@/lib/supabase/queries';
import Link from 'next/link';

export const revalidate = 0;

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-6">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">New Arrivals</li>
          </ol>
        </nav>

        <section className="mb-6 sm:mb-10 text-center md:text-left bg-surface-container-low rounded-xl p-5 sm:p-8 lg:p-12 border border-outline-variant/40 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <span className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-2 block">
              The Latest Creations
            </span>
            <h1 className="text-[24px] sm:text-headline-lg md:text-display-md font-headline-lg md:font-display-md text-primary font-normal leading-tight mb-3 sm:mb-4">
              New Arrivals
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Discover the latest masterpieces from our ateliers.
            </p>
          </div>
        </section>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">No new arrivals right now</h3>
            <p className="text-on-surface-variant font-body-sm text-body-sm">Our ateliers are currently crafting new masterpieces. Please check back soon.</p>
          </div>
        ) : (
          <Suspense fallback={null}>
            <ProductCatalog products={products} />
          </Suspense>
        )}
      </main>
      <Footer />
    </>
  );
}
