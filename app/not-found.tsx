import Link from 'next/link';
import Bestsellers from '@/components/home/Bestsellers';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-surface flex flex-col pt-32 pb-12">
      {/* 404 Hero Section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 w-full text-center mb-12 sm:mb-20">
        <span className="font-label-lg text-secondary tracking-widest uppercase mb-4 block">404 Error</span>
        <h1 className="font-headline-lg text-[40px] sm:text-[56px] text-primary mb-4 leading-tight">
          We couldn't find that piece...
        </h1>
        <p className="font-body-md text-[16px] sm:text-[18px] text-on-surface-variant max-w-2xl mx-auto mb-8">
          ...but we have many more timeless designs waiting for you. The page you are looking for has vanished or never existed. Let us guide you back to our exquisite collections.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/"
            className="bg-primary text-surface px-8 py-3 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors border border-primary"
          >
            Return to Home
          </Link>
          <Link
            href="/new-arrivals"
            className="bg-transparent text-primary border border-outline-variant px-8 py-3 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:border-primary transition-colors"
          >
            Shop New Arrivals
          </Link>
        </div>
      </div>

      {/* Discover Something New (Bestsellers) */}
      <div className="border-t border-outline-variant/30 pt-8">
        <Bestsellers />
      </div>
    </div>
  );
}
