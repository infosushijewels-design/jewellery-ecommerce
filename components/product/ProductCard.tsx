"use client";

import React, { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useToast } from '@/lib/context/ToastContext';
import ImgWithSkeleton from '@/components/ui/ImgWithSkeleton';

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
  const [isNavigating, setIsNavigating] = useState(false);

  const optimizedImage = getOptimizedImageUrl(imageSrc);
  const richImageAlt = material ? `${imageAlt}, ${material}` : imageAlt;

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
    <article className="group bg-white flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative overflow-hidden">
        <Link href={`/product/${slug}`} className="block">
          <ImgWithSkeleton src={optimizedImage} alt={richImageAlt} />
        </Link>
        <div className="absolute top-2.5 left-2.5 flex items-start z-10">
          {badge ? (
            <span className="bg-[#2D2024] text-[#FAF7F2] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em]">{badge}</span>
          ) : isNewArrival ? (
            <span className="bg-[#1A2D1A] text-[#D4F0D8] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em]">New</span>
          ) : isFeatured ? (
            <span className="bg-[#2D2024] text-[#FAF7F2] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em]">Featured</span>
          ) : null}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(id); }}
          aria-label="Save to Wishlist"
          disabled={isLikePending}
          className={`absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-10 shadow-sm hover:scale-110 ${isSaved ? 'text-[#C94040]' : 'text-[#2D2024]/50 hover:text-[#C94040]'}`}
        >
          {isLikePending ? (
            <Spinner size={14} />
          ) : (
            <span className={`material-symbols-outlined text-[15px] sm:text-[17px] leading-none transition-transform duration-200 ${isSaved ? 'font-variation-fill-1 scale-110' : ''}`}>favorite</span>
          )}
        </button>
        <button
          onClick={handleViewDetails}
          disabled={isNavigating}
          aria-label="View Details"
          title="View Details"
          className="absolute bottom-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#2D2024] flex items-center justify-center shadow-md hover:bg-[#2D2024] hover:text-white active:scale-90 transition-all duration-200 z-10 disabled:opacity-70 disabled:cursor-wait"
        >
          {isNavigating ? (
            <span className="material-symbols-outlined text-[15px] sm:text-[17px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
          )}
        </button>
      </div>
      <div className="pt-2.5 pb-3 px-0.5 flex flex-col gap-1">
        <Link href={`/product/${slug}`} className="block">
          <h3 className="text-[12px] sm:text-[13.5px] font-medium text-[#2D2024] leading-snug line-clamp-2 hover:text-[#8A6F3C] transition-colors">{title}</h3>
        </Link>
        <span className="text-[10px] sm:text-[11px] text-[#2D2024]/50 uppercase tracking-wider">{material}</span>
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[12px] sm:text-[13px] font-semibold text-[#2D2024]">Price on Request</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[11px] sm:text-[12px] text-[#8A6F3C]">verified</span>
          <span className="text-[9px] sm:text-[10px] text-[#2D2024]/50">{certification}</span>
        </div>
      </div>
    </article>
  );
}
