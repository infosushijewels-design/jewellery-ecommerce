import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import StoreFinder from '@/components/stores/StoreFinder';
import { getPublicStores } from '@/lib/supabase/public';

export const metadata: Metadata = {
  title: 'Store Locator | Sushi Jewels',
  description: 'Find a Sushi Jewels boutique near you — addresses, opening hours, directions and WhatsApp chat.',
};

export default async function StoresPage() {
  const stores = await getPublicStores();
  const cityCount = new Set(stores.map((s) => s.city)).size;

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-6">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">Stores</li>
          </ol>
        </nav>

        <section className="mb-8 sm:mb-10 text-center bg-surface-container-low rounded-xl p-6 sm:p-10 border border-outline-variant/40">
          <span className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-2 block">Store Locator</span>
          <h1 className="text-[26px] sm:text-headline-lg md:text-display-md font-headline-lg md:font-display-md text-primary font-normal leading-tight">
            Find a Boutique Near You
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3">
            {stores.length} {stores.length === 1 ? 'store' : 'stores'} across {cityCount} {cityCount === 1 ? 'city' : 'cities'} — try on, customise and collect in person.
          </p>
        </section>

        <StoreFinder stores={stores} showCityFilter />
      </main>
      <Footer />
    </>
  );
}
