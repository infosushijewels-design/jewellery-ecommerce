import Link from 'next/link';
import OurProductCard from './OurProductCard';
import { getHomeProducts } from '@/lib/supabase/queries';

export default async function OurProducts() {
  const products = await getHomeProducts();

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="our-products">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="relative flex flex-col items-center sm:block mb-8 sm:mb-12">
          <div className="text-center">
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Our Products</span>
            <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Discover our jewellery collection</h2>
          </div>
          <Link className="mt-3 sm:mt-0 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 font-label-lg text-label-lg text-primary hover:text-secondary flex items-center gap-1 group flex-shrink-0" href="/collections">
            View All
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((product) => (
            <OurProductCard
              key={product.id}
              id={product.id}
              imageSrc={product.image_url}
              title={product.title}
              material={product.material}
              slug={product.slug}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
