'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Catches unexpected render/data-fetching errors anywhere in the app that no more specific
 * error.tsx handles. Next.js never passes a raw stack trace to this component in production,
 * so there is nothing sensitive to accidentally expose here.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-surface flex flex-col items-center justify-center pt-32 pb-12 px-4 sm:px-6 text-center">
      <span className="font-label-lg text-secondary tracking-widest uppercase mb-4 block">Something Went Wrong</span>
      <h1 className="font-headline-lg text-[32px] sm:text-[48px] text-primary mb-4 leading-tight max-w-2xl">
        We hit a snag crafting this page
      </h1>
      <p className="font-body-md text-[16px] text-on-surface-variant max-w-xl mx-auto mb-8">
        Our atelier has been notified. Please try again, or return home and continue browsing in the meantime.
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
          href="/"
          className="bg-transparent text-primary border border-outline-variant px-8 py-3 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:border-primary transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
