'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/** Catches errors while loading a specific product (vs. a true 404, which uses notFound()/not-found.tsx). */
export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Error loading product page:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:px-6 text-center">
      <span className="font-label-lg text-secondary tracking-widest uppercase mb-4 block">Something Went Wrong</span>
      <h1 className="font-headline-lg text-[28px] sm:text-[40px] text-primary mb-4 leading-tight max-w-xl">
        We couldn&apos;t load this piece
      </h1>
      <p className="font-body-md text-[15px] sm:text-[16px] text-on-surface-variant max-w-lg mx-auto mb-8">
        Something interrupted us while fetching this product&apos;s details. Please try again, or explore the rest of our collections.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-surface px-8 py-3 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors border border-primary"
        >
          Try Again
        </button>
        <Link
          href="/collections"
          className="bg-transparent text-primary border border-outline-variant px-8 py-3 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:border-primary transition-colors"
        >
          Explore Collections
        </Link>
      </div>
    </div>
  );
}
