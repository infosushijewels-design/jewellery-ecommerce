import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts } from '@/lib/supabase/queries';

export default async function Bestsellers() {
  const products = (await getFeaturedProducts()).slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Customer Favorites</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Most Loved Creations</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Top-selling designs loved by thousands of happy customers across India.</p>
      </div>
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 overflow-x-auto sm:overflow-x-visible pb-3 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[64vw] sm:w-auto flex-shrink-0 snap-start">
            <ProductCard
              id={product.id}
              imageSrc={product.image_url}
              imageAlt={product.title}
              badge={product.badge || undefined}
              material={product.material}
              title={product.title}
              certification={product.certification || 'Verified'}
              isNewArrival={product.is_new_arrival}
              isFeatured={product.is_featured}
              slug={product.slug}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
