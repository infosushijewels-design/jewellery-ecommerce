import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { getNewArrivals } from '@/lib/supabase/queries';

export default async function NewArrivals() {
  const products = (await getNewArrivals()).slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="new-arrivals">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
        <div>
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Atelier Release</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">New Arrivals</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Fresh creations hand-set by master artisans, ready for your moments.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            imageSrc={product.image_url}
            imageAlt={product.title}
            badge={product.badge || undefined}
            material={product.material}
            title={product.title}
            certification={product.certification || 'Verified'}
            price={product.price}
            mrp={product.mrp}
            stock={product.stock}
            isNewArrival={product.is_new_arrival}
            isFeatured={product.is_featured}
            slug={product.slug}
          />
        ))}
      </div>

      {/* View All */}
      <div className="mt-8 sm:mt-12 text-center">
        <Link
          className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 border border-primary text-primary hover:bg-primary hover:text-surface font-label-lg text-label-lg rounded-full transition-all duration-200"
          href="/new-arrivals"
        >
          View All New Arrivals
          <span className="material-symbols-outlined text-[18px]">east</span>
        </Link>
      </div>
    </section>
  );
}
