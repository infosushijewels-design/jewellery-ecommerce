import Link from 'next/link';
import { getPublicStores } from '@/lib/supabase/public';
import { directionsUrl } from '@/lib/stores';

/** Homepage "Experience At Our Store" — single flagship boutique showcase. */
export default async function StoreLocator() {
  const stores = await getPublicStores();
  // getPublicStores() already sorts flagship-first, so this is our one store to showcase.
  const store = stores[0];

  if (!store) return null;

  return (
    <section className="py-12 sm:py-20 border-y border-outline-variant/30" id="stores">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Our Boutique</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Experience At Our Store</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Enjoy a private, personalised shopping experience with our jewellery experts.
          </p>
        </div>

        <article className="max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden shadow-[0_8px_28px_-10px_rgba(45,32,36,0.12)] grid grid-cols-1 sm:grid-cols-2">
          <div className="aspect-[4/3] sm:aspect-auto bg-surface-container flex items-center justify-center">
            {store.image_url ? (
              <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[56px] text-secondary">storefront</span>
            )}
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-center">
            {store.is_flagship && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1">Flagship Store</span>
            )}
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold leading-snug">{store.name}</h3>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mt-1">{store.city}, {store.state}</p>

            <p className="text-body-md text-on-surface-variant mt-3 leading-relaxed">
              {store.address}, {store.city}, {store.state} {store.pincode}
            </p>

            {store.hours && (
              <p className="text-label-md text-on-surface-variant/90 mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                Store Hours: {store.hours}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {store.phone ? (
                <a
                  href={`tel:${store.phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant/60 text-primary font-label-md text-label-md hover:border-primary hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  Call Store
                </a>
              ) : (
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant/60 text-primary font-label-md text-label-md hover:border-primary hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Enquire
                </Link>
              )}
              <a
                href={directionsUrl(store)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-surface font-label-md text-label-md hover:bg-tertiary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">directions</span>
                Visit Store
              </a>
            </div>
          </div>
        </article>

        <div className="flex items-center justify-center mt-8">
          <Link href="/book-appointment" className="font-label-lg text-label-lg text-primary underline underline-offset-4 hover:text-secondary">
            Book A Personalized Appointment
          </Link>
        </div>
      </div>
    </section>
  );
}
