"use client";

import React, { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useToast } from '@/lib/context/ToastContext';
import ImgWithSkeleton from '@/components/ui/ImgWithSkeleton';

interface OurProductCardProps {
  id: string;
  imageSrc: string;
  title: string;
  material: string | null;
  slug: string;
}

// Real metal tones this site's jewellery is actually crafted in (see every
// product's `material` field) — shown as a decorative swatch row, not a
// per-card variant picker, since metal selection only happens on the
// product detail page (ProductActions.tsx) where each variant is real.
const METAL_SWATCHES = [
  { label: 'Yellow Gold', color: '#D4AF37' },
  { label: 'Rose Gold', color: '#B76E79' },
  { label: 'White Gold', color: '#E5E4E2' },
];

function getOptimizedImageUrl(url: string) {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=600&q=80`;
  }
  return url;
}

/** Strips a trailing "(SKU: 123)" and title-cases the rest, e.g.
 *  "Chain necklace (SKU: 453)" -> "Chain Necklace". Display-only — the
 *  underlying product title in the database is left untouched. */
function formatProductName(title: string): string {
  const withoutSku = title.replace(/\s*\(SKU:[^)]*\)\s*$/i, '').trim();
  return withoutSku.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/** The only badge claim every product's real `material` field actually supports. */
function getMetalBadge(material: string | null): string | null {
  if (!material) return null;
  return /18k/i.test(material) ? '18K Gold' : null;
}

export default function OurProductCard({ id, imageSrc, title, material, slug }: OurProductCardProps) {
  const { wishlistIds, toggleWishlist: toggleWishlistBase, pendingIds } = useWishlist();
  const isLikePending = pendingIds.has(id);
  const { showToast } = useToast();
  const router = useRouter();
  const isSaved = wishlistIds.has(id);
  const [isNavigating, setIsNavigating] = useState(false);

  const optimizedImage = getOptimizedImageUrl(imageSrc);
  const displayName = formatProductName(title);
  const metalBadge = getMetalBadge(material);

  const handleViewDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNavigating(true);
    router.push(`/product/${slug}`);
  };

  const toggleWishlist = async (productId: string) => {
    const result = await toggleWishlistBase(productId);
    if (result === 'added') {
      showToast('🌸 Saved to your Wishlist!', 'success');
    } else if (result === 'removed') {
      showToast('Removed from Wishlist.', 'info');
    }
  };

  return (
    <article className="group bg-surface flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 hover:shadow-[0_12px_32px_-8px_rgba(22,11,14,0.12)] transition-shadow duration-300">
      <div className="relative overflow-hidden">
        <Link href={`/product/${slug}`} className="block">
          <ImgWithSkeleton src={optimizedImage} alt={displayName} />
        </Link>

        {metalBadge && (
          <span className="absolute top-2.5 left-2.5 bg-surface/90 backdrop-blur-sm text-primary text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full z-10">
            {metalBadge}
          </span>
        )}

        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(id); }}
          aria-label="Save to Wishlist"
          disabled={isLikePending}
          className={`absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center transition-all duration-200 z-10 shadow-sm hover:scale-110 ${isSaved ? 'text-[#C94040]' : 'text-[#2D2024]/60 hover:text-[#C94040]'}`}
        >
          {isLikePending ? (
            <Spinner size={14} />
          ) : (
            <span className={`material-symbols-outlined text-[15px] sm:text-[17px] leading-none transition-transform duration-200 ${isSaved ? 'font-variation-fill-1 scale-110' : ''}`}>favorite</span>
          )}
        </button>
      </div>

      <div className="pt-3 pb-4 px-3 text-center flex flex-col items-center gap-2">
        <Link href={`/product/${slug}`} className="block">
          <h3 className="font-headline-sm text-[14px] sm:text-headline-sm text-primary leading-snug line-clamp-2 hover:text-secondary transition-colors">{displayName}</h3>
        </Link>

        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {METAL_SWATCHES.map((metal) => (
            <span
              key={metal.label}
              title={metal.label}
              className="w-3 h-3 rounded-full border border-outline-variant/50"
              style={{ backgroundColor: metal.color }}
            />
          ))}
        </div>

        {/* Every product requires a metal/size choice on its own page (ProductActions.tsx),
            so this opens that existing selection interface rather than adding an incomplete
            cart line with a guessed metal, size, or price. */}
        <button
          onClick={handleViewDetails}
          disabled={isNavigating}
          className="mt-1 w-full border border-primary/70 text-primary text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] py-2.5 rounded-full hover:bg-primary hover:text-surface transition-colors duration-200 disabled:opacity-60"
        >
          {isNavigating ? (
            <span className="material-symbols-outlined text-[16px] align-middle animate-spin">progress_activity</span>
          ) : (
            'Explore Piece'
          )}
        </button>
      </div>
    </article>
  );
}
