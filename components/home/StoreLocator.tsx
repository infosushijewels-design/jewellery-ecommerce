import Link from 'next/link';
import StoreFinder from '@/components/stores/StoreFinder';
import { getPublicStores } from '@/lib/supabase/public';

/** Homepage "Experience At Our Store" — nearest 4 branches + link to all stores. */
export default async function StoreLocator() {
  const stores = await getPublicStores();

  return (
    <section className="py-12 sm:py-20 border-y border-outline-variant/30" id="stores">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Our Boutiques</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Experience At Our Store</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Enjoy a private, personalised shopping experience with our jewellery experts.
          </p>
        </div>

        <StoreFinder stores={stores} limit={4} />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-8">
          <Link href="/stores" className="font-label-lg text-label-lg text-primary underline underline-offset-4 hover:text-secondary">
            View all stores{stores.length > 4 ? ` (${stores.length})` : ''}
          </Link>
          <span className="hidden sm:block w-px h-4 bg-outline-variant" />
          <Link href="/contact" className="font-label-lg text-label-lg text-primary underline underline-offset-4 hover:text-secondary">
            Book A Personalized Appointment
          </Link>
        </div>
      </div>
    </section>
  );
}
