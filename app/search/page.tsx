import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductCatalog from '@/components/product/ProductCatalog';
import { getCategoryList, searchProducts } from '@/lib/supabase/queries';

export const revalidate = 0;

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = '' } = await searchParams;
  return { title: q.trim() ? `Search: ${q.trim()} | Sushi Jewels` : 'Search | Sushi Jewels', robots: { index: false } };
}

const POPULAR = ['Rings', 'Earrings', 'Necklaces', 'Bangles', 'Diamond', 'Gold'];

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const query = q.trim().slice(0, 100);
  const [results, categories] = await Promise.all([query ? searchProducts(query) : Promise.resolve([]), getCategoryList()]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-4">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold normal-case">
              {query ? <>Search results for &lsquo;{query}&rsquo;</> : 'Search'}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 sm:mb-8">
          <h1 className="font-headline-md text-headline-md text-primary">
            {query ? <>Results for &ldquo;{query}&rdquo;</> : 'Search our jewellery'}
          </h1>
          {query && (
            <p className="text-body-sm text-on-surface-variant">
              {results.length} {results.length === 1 ? 'item' : 'items'} found
            </p>
          )}
        </div>

        {!query || results.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-6">
            <span className="material-symbols-outlined text-[40px] text-outline mb-3 block">{query ? 'search_off' : 'search'}</span>
            <h2 className="font-headline-sm text-headline-sm text-primary mb-2">
              {query ? `We couldn't find anything for “${query}”` : 'What are you looking for?'}
            </h2>
            <p className="text-on-surface-variant font-body-sm text-body-sm mb-6">
              {query ? 'Check the spelling or try a broader term.' : 'Search by jewellery type, metal or stone.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {POPULAR.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="px-4 py-2 rounded-full border border-outline-variant/60 bg-surface text-body-sm text-primary hover:border-primary transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Suspense fallback={null}>
            <ProductCatalog products={results} categories={categories} />
          </Suspense>
        )}
      </main>
      <Footer />
    </>
  );
}
