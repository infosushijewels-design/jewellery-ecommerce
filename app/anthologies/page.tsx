import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductCard from '@/components/product/ProductCard';
import { getAllCollections } from '@/lib/supabase/queries';
import Link from 'next/link';

export default async function AnthologiesPage() {
  const collections = await getAllCollections();

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-16 pt-6 pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-6">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">Anthologies</li>
          </ol>
        </nav>

        <section className="mb-10 text-center md:text-left bg-surface-container-low rounded-xl p-8 lg:p-12 border border-outline-variant/40 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <span className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-2 block">
              Heritage Series
            </span>
            <h1 className="text-headline-lg md:text-display-md font-headline-lg md:font-display-md text-primary font-normal leading-tight mb-4">
              View All Anthologies
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              Timeless designs inspired by history and nature.
            </p>
          </div>
        </section>

        {collections.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">No anthologies available</h3>
            <p className="text-on-surface-variant font-body-sm text-body-sm">Check back later for historic creations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {collections.map(collection => (
              <div key={collection.id} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-4 hover:shadow-lg transition-all duration-300">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2">{collection.name}</h3>
                {collection.description && <p className="text-on-surface-variant font-body-sm text-body-sm line-clamp-2">{collection.description}</p>}
                <Link href={`/collections/${collection.slug}`} className="text-secondary font-label-sm text-label-sm hover:underline mt-4 inline-block">
                  View Anthology →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
