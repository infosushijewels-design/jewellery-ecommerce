"use client";

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/context/WishlistContext';

interface ProductCardProps {
  id: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  material: string;
  title: string;
  certification: string;
  price: string;
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
  slug
}: ProductCardProps) {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const isSaved = wishlistIds.has(id);
  
  return (
    <article className="group bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <Link href={`/product/${slug}`} className="block">
          <div className="relative aspect-[3/4] w-full bg-surface-container-low rounded-lg overflow-hidden mb-4">
            <img 
              src={imageSrc} 
              alt={imageAlt} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            {badge && (
              <div className="absolute top-3 left-3">
                <span className="bg-surface px-2.5 py-1 rounded-full text-label-sm font-label-sm border border-secondary text-primary uppercase">
                  {badge}
                </span>
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
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center transition-colors z-10
            ${isSaved ? 'text-error' : 'text-on-surface-variant hover:text-error'}
          `}
        >
          <span className={`material-symbols-outlined text-[18px] ${isSaved ? 'font-variation-fill-1' : ''}`}>
            favorite
          </span>
        </button>
      </div>
      <Link href={`/product/${slug}`} className="block">
        <div className="text-center space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
            {material}
          </span>
          <h3 className="font-headline-sm text-headline-sm text-primary hover:text-secondary cursor-pointer transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant pt-0.5">
            <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
            {certification}
          </div>
        </div>
      </Link>
      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
        <div>
          <span className="font-headline-sm text-headline-sm font-semibold text-primary">{price}</span>
          <span className="block text-label-sm font-label-sm text-on-surface-variant">Includes all taxes</span>
        </div>
        <button className="bg-primary text-surface px-4 py-2 rounded-full font-label-sm text-label-sm uppercase tracking-wider hover:bg-tertiary transition-colors">
          Acquire
        </button>
      </div>
    </article>
  );
}
