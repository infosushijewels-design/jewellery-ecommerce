"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCart } from '@/lib/context/CartContext';
import { useToast } from '@/lib/context/ToastContext';

interface ProductCardProps {
  id: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  material: string;
  title: string;
  certification: string;
  price: number;
  mrp?: number | null;
  stock?: number;
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
  price,
  mrp,
  stock,
  isNewArrival,
  isFeatured,
  slug
}: ProductCardProps) {
  const { wishlistIds, toggleWishlist: toggleWishlistBase } = useWishlist();
  const { addToCart, openCart } = useCart();
  const { showToast } = useToast();
  const isSaved = wishlistIds.has(id);
  const [justAdded, setJustAdded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const hasDiscount = !!mrp && mrp > price;
  const discountPercent = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0;
  const isSoldOut = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 3;
  const optimizedImage = getOptimizedImageUrl(imageSrc);

  const handleAcquire = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut) return;

    addToCart({
      productId: id,
      title,
      price,
      imageUrl: imageSrc,
      metal: material,
      size: 'Standard',
    });
    openCart();
    showToast('✨ Added to your shopping bag!', 'success');

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const toggleWishlist = async (productId: string) => {
    const result = await toggleWishlistBase(productId);
    if (result === 'added') showToast('❤️ Saved to your Wishlist!', 'success');
    else if (result === 'removed') showToast('Removed from Wishlist.', 'info');
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
            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
              {badge && (
                <span className="bg-surface px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm border border-secondary text-primary uppercase">
                  {badge}
                </span>
              )}
              {isNewArrival && (
                <span className="bg-green-700 text-green-50 px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  New
                </span>
              )}
              {isFeatured && (
                <span className="bg-purple-700 text-purple-50 px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  Featured
                </span>
              )}
              {hasDiscount && (
                <span className="bg-emerald-700 text-emerald-50 px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  Save {discountPercent}%
                </span>
              )}
            </div>
            {isSoldOut ? (
              <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
                <span className="bg-red-700 text-red-50 px-3 py-1 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  Sold Out
                </span>
              </div>
            ) : isLowStock ? (
              <div className="absolute bottom-2 left-2">
                <span className="bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  Only {stock} Left
                </span>
              </div>
            ) : null}

            {/* Quick Add overlay (always visible on mobile/touch, hover-triggered on desktop) */}
            {!isSoldOut && (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2.5 sm:pb-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto z-10">
                <button
                  onClick={handleAcquire}
                  className="bg-primary/95 backdrop-blur-xs text-surface text-[9px] sm:text-xs font-semibold uppercase tracking-widest px-4 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg hover:bg-tertiary active:scale-95 transition-all duration-200 border border-outline-variant/30"
                >
                  {justAdded ? '✓ Added' : 'Quick Add'}
                </button>
              </div>
            )}
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(id);
          }}
          aria-label="Save to Wishlist"
          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center transition-colors z-10
            ${isSaved ? 'text-error' : 'text-on-surface-variant hover:text-error'}
          `}
        >
          <span className={`material-symbols-outlined text-[16px] sm:text-[18px] ${isSaved ? 'font-variation-fill-1' : ''}`}>
            favorite
          </span>
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
        </div>
      </Link>
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-1">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-body-md text-[14px] sm:text-[17px] font-semibold text-primary block tabular-nums tracking-tight">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-label-sm font-label-sm text-on-surface-variant line-through">
                ₹{mrp!.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span className="block text-[9px] sm:text-label-sm font-label-sm text-on-surface-variant">Incl. taxes</span>
        </div>
        <button
          onClick={handleAcquire}
          disabled={isSoldOut}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-label-sm text-[9px] sm:text-label-sm uppercase tracking-wider transition-all duration-200 flex-shrink-0 active:scale-95 flex items-center gap-1 ${
            isSoldOut
              ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
              : justAdded
              ? 'bg-secondary text-primary'
              : 'bg-primary text-surface hover:bg-tertiary'
          }`}
        >
          {isSoldOut ? (
            'Sold Out'
          ) : justAdded ? (
            <>
              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check</span>
              Added
            </>
          ) : (
            'Buy Now'
          )}
        </button>
      </div>
      </div>
    </article>
  );
}
