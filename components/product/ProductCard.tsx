"use client";

import React, { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useToast } from '@/lib/context/ToastContext';

interface ProductCardProps {
  id: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  material: string;
  title: string;
  certification: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  slug: string;
}

function getOptimizedImageUrl(url: string) {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=600&q=80`;
  }
  return url;
}

export default function ProductCard({
  id,
  imageSrc,
  imageAlt,
  badge,
  material,
  title,
  certification,
  isNewArrival,
  isFeatured,
  slug
}: ProductCardProps) {
  const { wishlistIds, toggleWishlist: toggleWishlistBase, pendingIds } = useWishlist();
  const isLikePending = pendingIds.has(id);
  const { showToast } = useToast();
  const router = useRouter();
  const isSaved = wishlistIds.has(id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const optimizedImage = getOptimizedImageUrl(imageSrc);

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
    <article className="group bg-surface-container-lowest rounded-xl border border-outline-variant/60 flex flex-col justify-between overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <Link href={`/product/${slug}`} className="block">
          <div className="relative aspect-[3/4] w-full bg-surface-container-low overflow-hidden">
            <img
              src={optimizedImage}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                isLoaded ? 'opacity-100' : 'opacity-80 blur-[2px]'
              }`}
            />
            <div className="absolute top-2 left-2 flex items-start">
              {badge ? (
                <span className="bg-surface px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm border border-secondary text-primary uppercase">
                  {badge}
                </span>
              ) : isNewArrival ? (
                <span className="bg-green-700 text-green-50 px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  New
                </span>
              ) : isFeatured ? (
                <span className="bg-purple-700 text-purple-50 px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  Featured
                </span>
              ) : null}
            </div>

            {/* Quick View overlay (always visible on mobile/touch, hover-triggered on desktop) */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2.5 sm:pb-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto z-10">
              <button
                onClick={handleViewDetails}
                disabled={isNavigating}
                className="bg-primary/95 backdrop-blur-xs text-surface text-[9px] sm:text-xs font-semibold uppercase tracking-widest px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg hover:bg-tertiary active:scale-95 transition-all duration-200 border border-outline-variant/30 flex items-center justify-center gap-1.5 disabled:opacity-80 disabled:cursor-wait"
              >
                {isNavigating ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] sm:text-[16px] animate-spin">progress_activity</span>
                    Loading...
                  </>
                ) : (
                  'View Details'
                )}
              </button>
            </div>
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(id);
          }}
          aria-label="Save to Wishlist"
          disabled={isLikePending}
          aria-busy={isLikePending || undefined}
          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface/85 backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-10 shadow-sm
            ${isSaved ? 'text-[#C98A7D] bg-[#FAF4F0]' : 'text-on-surface-variant hover:text-[#C98A7D] hover:scale-110'}
          `}
        >
          {isLikePending ? (
            <Spinner size={15} />
          ) : (
            <span className={`material-symbols-outlined text-[14px] sm:text-[16px] leading-none transition-transform duration-200 ${isSaved ? 'font-variation-fill-1 scale-110' : ''}`}>
              favorite
            </span>
          )}
        </button>
      </div>

      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
        <Link href={`/product/${slug}`} className="block">
        <div className="text-center space-y-0.5 sm:space-y-1">
          <span className="font-label-sm text-[9px] sm:text-label-sm uppercase tracking-wider text-secondary font-semibold block">
            {material}
          </span>
          <h3 className="font-headline-sm text-[13px] sm:text-headline-sm text-primary hover:text-secondary cursor-pointer transition-colors leading-snug">
            {title}
          </h3>
          <div className="flex items-center justify-center gap-1 text-label-sm font-label-sm text-on-surface-variant pt-0.5">
            <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-secondary">verified</span>
            <span className="text-[9px] sm:text-label-sm">{certification}</span>
          </div>
          <span className="block font-headline-sm text-[11px] sm:text-[13px] text-[#8A6F3C] font-medium tracking-wide pt-1">
            Price on Request
          </span>
        </div>
      </Link>
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-outline-variant/30 space-y-2">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 bg-[#FAF7F2] border border-[#E8D5C5] text-[#2D2024]/80 text-[8px] sm:text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[11px] sm:text-[12px]">diamond</span>
            Handcrafted to Order
          </span>
        </div>
        <button
          onClick={handleViewDetails}
          disabled={isNavigating}
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-label-sm text-[9px] sm:text-label-sm uppercase tracking-wider transition-all duration-200 flex-shrink-0 active:scale-95 flex items-center justify-center gap-1 bg-primary text-surface hover:bg-tertiary disabled:opacity-80 disabled:cursor-wait"
        >
          {isNavigating ? (
            <span className="material-symbols-outlined text-[14px] sm:text-[16px] animate-spin">progress_activity</span>
          ) : (
            'View Details'
          )}
        </button>
      </div>
      </div>
    </article>
  );
}
