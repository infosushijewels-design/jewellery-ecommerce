import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductCatalog from '@/components/product/ProductCatalog';
import { getAllCollections, getCategoryList, getProductsByCollectionSlug } from '@/lib/supabase/queries';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { collection } = await getProductsByCollectionSlug(slug);
  if (!collection) return { title: 'Collection not found | Sushi Jewels' };
  return { title: `${collection.name} | Sushi Jewels`, description: collection.description || undefined };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ collection, products }, categories, allCollections] = await Promise.all([
    getProductsByCollectionSlug(slug),
    getCategoryList(),
    getAllCollections(),
  ]);

  const otherCollections = allCollections.filter((c) => c.slug !== slug);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-6">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li><Link href="/collections" className="hover:text-primary transition-colors">Collections</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">{collection?.name || 'Not found'}</li>
          </ol>
        </nav>

        {!collection ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <span className="material-symbols-outlined text-[40px] text-outline mb-3 block">collections_bookmark</span>
            <h1 className="font-headline-sm text-headline-sm text-primary mb-2">Collection not found</h1>
            <p className="text-on-surface-variant font-body-sm text-body-sm mb-6">This collection may have been renamed or retired.</p>
            <Link href="/collections" className="bg-primary text-surface px-6 py-2.5 rounded-full font-label-md uppercase hover:bg-tertiary transition-colors">
              Browse All Collections
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-6 sm:mb-10 text-center md:text-left bg-surface-container-low rounded-xl p-5 sm:p-8 lg:p-12 border border-outline-variant/40 relative overflow-hidden">
              <div className="max-w-3xl relative z-10">
                <span className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-2 block">
                  Curated Collection
                </span>
                <h1 className="text-[24px] sm:text-headline-lg md:text-display-md font-headline-lg md:font-display-md text-primary font-normal leading-tight mb-3 sm:mb-4">
                  {collection.name}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                  {collection.description || 'A curated edit of hallmarked gold and natural diamond jewellery from our ateliers.'}
                </p>
              </div>
              <div className="absolute -right-12 -bottom-16 opacity-5 pointer-events-none hidden md:block">
                <span className="material-symbols-outlined text-[280px]">auto_awesome</span>
              </div>
            </section>

            {products.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-2">New pieces coming soon</h3>
                <p className="text-on-surface-variant font-body-sm text-body-sm">Our ateliers are crafting pieces for this collection.</p>
              </div>
            ) : (
              <Suspense fallback={null}>
                <ProductCatalog products={products} categories={categories} />
              </Suspense>
            )}
          </>
        )}

        {otherCollections.length > 0 && (
          <section className="mt-14">
            <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Explore More Collections</h2>
            <div className="flex flex-wrap gap-2.5">
              {otherCollections.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className="px-4 py-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest text-body-sm text-primary hover:border-primary transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
