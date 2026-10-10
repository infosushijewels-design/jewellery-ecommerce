"use client";

import { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';

import { useWishlist } from '@/lib/context/WishlistContext';
import { useToast } from '@/lib/context/ToastContext';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import TryItOnModal from '@/components/product/TryItOnModal';

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    sku?: string | null;
    imageUrl: string;
    availableSizes?: string[];
  };
}

const DEFAULT_SIZES = ["8", "10", "12", "14", "16", "18", "20", "22"];

export default function ProductActions({ product }: ProductActionsProps) {
  const sizes = product.availableSizes && product.availableSizes.length > 0 ? product.availableSizes : DEFAULT_SIZES;

  const [selectedMetal, setSelectedMetal] = useState("18K Yellow Gold");
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isTryItOnOpen, setIsTryItOnOpen] = useState(false);

  const { wishlistIds, toggleWishlist: toggleWishlistBase, pendingIds } = useWishlist();
  const isLikePending = pendingIds.has(product.id);
  const { showToast } = useToast();
  const { contact } = useStoreSettings();

  const isSaved = wishlistIds.has(product.id);

  const metals = ["18K Yellow Gold", "18K Rose Gold", "18K White Gold", "Platinum"];

  const toggleWishlist = async (productId: string) => {
    const result = await toggleWishlistBase(productId);
    if (result === 'added') {
      showToast('🌸 Saved to your Wishlist!', 'success');
    } else if (result === 'removed') {
      showToast('Removed from Wishlist.', 'info');
    }
  };

  // Same number-normalising logic as the footer's WhatsApp link, kept local since it's a one-off here.
  const waDigits = (contact.whatsapp || '').replace(/\D/g, '');
  const waNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;
  const enquiryMessage = [
    `Hi! I'd like to enquire about "${product.title}"`,
    product.sku ? `(SKU: ${product.sku})` : null,
    `— Metal: ${selectedMetal}, Size: ${selectedSize}.`,
  ]
    .filter(Boolean)
    .join(' ');
  const whatsappHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(enquiryMessage)}` : null;

  return (
    <div className="space-y-8 mt-8">
      {/* Virtual Try-On */}
      <button
        type="button"
        onClick={() => setIsTryItOnOpen(true)}
        className="w-full border border-secondary text-secondary hover:bg-secondary-container/20 py-3.5 rounded-full font-label-lg text-label-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        Try It On (AI)
      </button>

      {/* Metal Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-label-lg text-label-lg text-primary">Metal Choice</span>
          <span className="font-body-sm text-body-sm text-secondary">{selectedMetal}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {metals.map(metal => (
            <button
              key={metal}
              onClick={() => setSelectedMetal(metal)}
            className={`px-4 py-2 rounded-lg border font-label-md text-label-md transition-colors ${
                selectedMetal === metal
                  ? 'border-secondary bg-surface-container font-bold text-primary'
                  : 'border-outline-variant hover:border-primary text-on-surface-variant'
              }`}
            >
              {metal}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-label-lg text-label-lg text-primary">Ring Size (Indian)</span>
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="text-secondary font-label-sm text-label-sm hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[14px]">straighten</span>
            Find Your Ring Size
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {sizes.map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`py-2 border rounded font-label-md text-label-md transition-colors ${selectedSize === size ? 'border-secondary bg-surface-container font-bold text-primary' : 'border-outline-variant hover:border-primary text-on-surface-variant'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Craftsmanship note */}
      <div className="flex items-start gap-2.5 bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
        <span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-primary">Handcrafted to Order.</span> Every piece is made to measure by our master artisans — reach out and we&apos;ll guide you through metal, stone and sizing.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary text-surface px-6 py-4 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">chat</span>
              Enquire on WhatsApp
            </a>
          ) : (
            <Link
              href="/contact"
              className="flex-1 bg-primary text-surface px-6 py-4 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">mail</span>
              Enquire
            </Link>
          )}
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label="Save to Wishlist"
            disabled={isLikePending}
            aria-busy={isLikePending || undefined}
            className={`flex-shrink-0 w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-200
              ${isSaved ? 'border-[#C98A7D]/70 text-[#C98A7D] bg-[#FAF4F0]' : 'border-outline-variant/60 text-on-surface-variant hover:text-[#C98A7D] hover:border-[#C98A7D]'}
            `}
          >
            {isLikePending ? <Spinner size={22} /> : <span className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${isSaved ? 'font-variation-fill-1 scale-110' : ''}`}>favorite</span>}
          </button>
        </div>
        <Link
          href="/book-appointment"
          className="flex-1 border border-secondary text-secondary px-6 py-4 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-secondary-container/20 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">event</span>
          Book Boutique / Video Appointment
        </Link>
      </div>

      <div className="bg-surface-container-low p-4 rounded-xl border border-secondary/40 text-center space-y-2 mt-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="material-symbols-outlined text-secondary">local_shipping</span>
          <h4 className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">Complimentary Shipping</h4>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
          Insured delivery Pan-India. Made to order, dispatched within 10-14 days.
        </p>
      </div>

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
      <TryItOnModal
        isOpen={isTryItOnOpen}
        onClose={() => setIsTryItOnOpen(false)}
        productTitle={product.title}
        productImageUrl={product.imageUrl}
      />
    </div>
  );
}
