"use client";

import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useToast } from '@/lib/context/ToastContext';
import ImgWithSkeleton from '@/components/ui/ImgWithSkeleton';

interface BestsellerCardProps {
  id: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  certification: string;
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

/** Compact luxury card used only by the homepage "Most Loved Creations" section. */
export default function BestsellerCard({ id, imageSrc, imageAlt, title, certification, slug }: BestsellerCardProps) {
  const { wishlistIds, toggleWishlist: toggleWishlistBase, pendingIds } = useWishlist();
  const isLikePending = pendingIds.has(id);
  const { showToast } = useToast();
  const isSaved = wishlistIds.has(id);

  const optimizedImage = getOptimizedImageUrl(imageSrc);

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
      {/* ── Image Block ── */}
      <div className="relative overflow-hidden">
        <Link href={`/product/${slug}`} className="block">
          <ImgWithSkeleton src={optimizedImage} alt={imageAlt} />
        </Link>

        {/* Heart / Wishlist — top right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(id);
          }}
          aria-label="Save to Wishlist"
          disabled={isLikePending}
          aria-busy={isLikePending || undefined}
          className={`absolute top-2.5 right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200 z-10 shadow-sm hover:scale-110 ${
            isSaved ? 'text-[#C94040]' : 'text-[#2D2024]/50 hover:text-[#C94040]'
          }`}
        >
          {isLikePending ? (
            <Spinner size={14} />
          ) : (
            <span className={`material-symbols-outlined text-[15px] sm:text-[17px] leading-none transition-transform duration-200 ${isSaved ? 'font-variation-fill-1 scale-110' : ''}`}>
              favorite
            </span>
          )}
        </button>

        {/* Quick-add "+" — bottom right */}
        <Link
          href={`/product/${slug}`}
          aria-label="View Details"
          className="absolute bottom-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#2D2024] flex items-center justify-center shadow-md hover:bg-[#2D2024] hover:text-white active:scale-90 transition-all duration-200 z-10"
        >
          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add</span>
        </Link>
      </div>

      {/* ── Info Block ── */}
      <div className="pt-2.5 pb-3 px-1 flex flex-col gap-0.5">
        <Link href={`/product/${slug}`} className="block">
          <h3 className="text-[12px] sm:text-[13.5px] font-medium text-[#2D2024] leading-snug line-clamp-2 hover:text-[#8A6F3C] transition-colors">
            {title}
          </h3>
        </Link>
        <span className="text-[11px] sm:text-[12px] font-semibold text-[#2D2024] mt-0.5">
          Price on Request
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[11px] sm:text-[12px] text-[#8A6F3C]">verified</span>
          <span className="text-[9px] sm:text-[10px] text-[#2D2024]/50">{certification}</span>
        </div>
      </div>
    </article>
  );
}
