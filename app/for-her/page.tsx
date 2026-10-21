import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OurProductCard from '@/components/home/OurProductCard';
import { getProductsByAudience } from '@/lib/supabase/queries';
import Link from 'next/link';

export const revalidate = 0;

export const metadata = {
  title: "For Her | Sushi Jewels",
  description: "Women's fine jewellery — luminous diamond necklaces, solitaire rings, chokers and heirloom bangles.",
};

export default async function ForHerPage() {
  const products = await getProductsByAudience('women');

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-6 pb-16 sm:pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-6">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">For Her</li>
          </ol>
        </nav>

        <div className="mb-8 sm:mb-10 text-center">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Women&rsquo;s Edit</span>
          <h1 className="font-headline-lg text-[26px] sm:text-headline-lg text-primary mt-1">For Her</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl mx-auto">
            Luminous diamond necklaces, solitaire rings, chokers and heirloom bangles.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">New arrivals coming soon</h3>
            <p className="text-on-surface-variant font-body-sm text-body-sm max-w-md mx-auto">
              We&rsquo;re curating our women&rsquo;s collection. Check back shortly, or explore our full catalogue in the meantime.
            </p>
            <Link href="/collections" className="inline-block mt-6 bg-primary text-surface px-6 py-2.5 rounded-full font-label-md uppercase hover:bg-tertiary transition-colors">
              Browse All Collections
            </Link>
          </div>
        ) : (
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
        )}
      </main>
      <Footer />
    </>
  );
}
