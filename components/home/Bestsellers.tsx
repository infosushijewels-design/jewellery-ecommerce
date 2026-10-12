import { getFeaturedProducts } from '@/lib/supabase/queries';
import HomeCardSlider from './HomeCardSlider';
import BestsellerCard from './BestsellerCard';

export default async function Bestsellers() {
  const products = (await getFeaturedProducts()).slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <HomeCardSlider
      eyebrow="Customer Favorites"
      title="Most Loved"
      accent="Creations"
      subtitle="Top-selling designs loved by thousands of happy customers across India."
      viewAllHref="/collections"
      desktopGridClass="sm:grid-cols-2 lg:grid-cols-4"
      gapClass="gap-2 sm:gap-5"
    >
      {products.map((product) => (
        <div key={product.id} className="min-w-0">
          <BestsellerCard
            id={product.id}
            imageSrc={product.image_url}
            imageAlt={product.title}
            title={product.title}
            certification={product.certification || 'Verified'}
            slug={product.slug}
          />
        </div>
      ))}
    </HomeCardSlider>
  );
}
