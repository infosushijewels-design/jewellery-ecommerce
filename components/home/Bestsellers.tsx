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
    </section>
  );
}
