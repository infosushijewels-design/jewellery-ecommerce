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
  slug: string;
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
  slug
}: ProductCardProps) {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();
  const { showToast } = useToast();
  const isSaved = wishlistIds.has(id);
  const [justAdded, setJustAdded] = useState(false);

  const hasDiscount = !!mrp && mrp > price;
  const discountPercent = hasDiscount ? Math.round(((mrp! - price) / mrp!) * 100) : 0;
  const isSoldOut = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 3;

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
    showToast(`Added ${title} to your jewellery bag`, 'success');

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <article className="group bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-3 sm:p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <Link href={`/product/${slug}`} className="block">
          <div className="relative aspect-[3/4] w-full bg-surface-container-low rounded-lg overflow-hidden mb-3 sm:mb-4">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
              {badge && (
                <span className="bg-surface px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm border border-secondary text-primary uppercase">
                  {badge}
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
                <span className="bg-surface px-3 py-1 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase text-primary">
                  Made to Order
                </span>
              </div>
            ) : isLowStock ? (
              <div className="absolute bottom-2 left-2">
                <span className="bg-error-container text-error px-2 py-0.5 rounded-full text-[9px] sm:text-label-sm font-label-sm uppercase">
                  Only {stock} Left
                </span>
              </div>
            ) : null}

            {/* Quick Add hover overlay */}
            {!isSoldOut && (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={handleAcquire}
                  className="bg-primary text-surface text-[10px] sm:text-xs font-semibold uppercase tracking-widest px-5 py-2 rounded-full shadow-lg hover:bg-tertiary active:scale-95 transition-all duration-200"
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
            <span className="font-headline-sm text-[13px] sm:text-headline-sm font-semibold text-primary block">
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
              Acquired
            </>
          ) : (
            'Acquire'
          )}
        </button>
      </div>
    </article>
  );

}
