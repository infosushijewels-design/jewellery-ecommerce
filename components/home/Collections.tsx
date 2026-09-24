import Link from 'next/link';

export default function Collections() {
  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="collections">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Featured Collections</span>
            <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Curated Collections</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Handcrafted gold and diamond jewellery for every special occasion.</p>
          </div>
          <Link className="font-label-lg text-label-lg text-primary hover:text-secondary flex items-center gap-1 group flex-shrink-0" href="/collections">
            View All Collections
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Collection 1 */}
          <Link href="/collections/best-sellers" className="group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col">
            <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1000&q=80" alt="Everyday Luxury" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Daily Wear</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-1">The Everyday Edit</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Lightweight 18K gold jewellery designed for work, home, and daily elegance.</p>
              </div>
              <div className="pt-4 sm:pt-6">
                <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                  Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Collection 2 */}
          <Link href="/collections/festive-collection" className="group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col">
            <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80" alt="Royal Provenance" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Royal &amp; Antique</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-1">Modern Heirlooms</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Classic Jadau and antique designs crafted for festive celebrations and weddings.</p>
              </div>
              <div className="pt-4 sm:pt-6">
                <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                  Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Collection 3 */}
          <Link href="/collections/bridal-collection" className="group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col sm:col-span-2 md:col-span-1">
            <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?auto=format&fit=crop&w=1000&q=80" alt="The Vivaha Suite" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Bridal Special</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-1">Celebration &amp; Bridal</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Stunning bridal sets with certified natural diamonds designed for your wedding day.</p>
              </div>
              <div className="pt-4 sm:pt-6">
                <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                  Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
