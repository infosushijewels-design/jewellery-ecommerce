"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useToast } from '@/lib/context/ToastContext';
import SizeGuideModal from '@/components/product/SizeGuideModal';

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    stock: number;
    availableSizes?: string[];
  };
}

const DEFAULT_SIZES = ["8", "10", "12", "14", "16", "18", "20", "22"];

export default function ProductActions({ product }: ProductActionsProps) {
  const sizes = product.availableSizes && product.availableSizes.length > 0 ? product.availableSizes : DEFAULT_SIZES;

  const [selectedMetal, setSelectedMetal] = useState("18K Yellow Gold");
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const { addToCart, openCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();

  const isSaved = wishlistIds.has(product.id);
  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;

  const metals = ["18K Yellow Gold", "18K Rose Gold", "18K White Gold", "Platinum"];

  const buildCartItem = () => ({
    productId: product.id,
    title: product.title,
    price: product.price,
    imageUrl: product.imageUrl,
    metal: selectedMetal,
    size: selectedSize,
  });

  const handleAddToBag = () => {
    if (isSoldOut) return;
    addToCart(buildCartItem());
    openCart();
    showToast(`Added ${product.title} to your jewellery bag`, 'success');
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addToCart(buildCartItem());
    router.push('/checkout');
  };

  return (
    <div className="space-y-8 mt-8">
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
              className={`px-4 py-2 rounded border transition-colors ${selectedMetal === metal ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant text-on-surface-variant hover:border-secondary hover:text-primary'}`}
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

      {/* Stock Scarcity Indicator */}
      {isSoldOut ? (
        <div className="flex items-start gap-2.5 bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">inventory_2</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-primary">Exclusively Made to Order.</span> This piece is currently sold out — reach out to our concierge team to commission a bespoke remake.
          </p>
        </div>
      ) : isLowStock ? (
        <div className="flex items-start gap-2.5 bg-error-container/40 rounded-xl p-4 border border-error/30">
          <span className="material-symbols-outlined text-error text-[20px]">local_fire_department</span>
          <p className="font-body-sm text-body-sm text-primary leading-relaxed">
            Only <span className="font-semibold">{product.stock}</span> {product.stock === 1 ? 'piece' : 'pieces'} handcrafted in this atelier edition — once gone, this design retires.
          </p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <button
            onClick={handleAddToBag}
            disabled={isSoldOut}
            className="flex-1 bg-primary text-surface px-6 py-4 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            {isSoldOut ? 'Sold Out' : 'Add to Bag'}
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label="Save to Wishlist"
            className={`flex-shrink-0 w-14 h-14 rounded-full border flex items-center justify-center transition-colors
              ${isSaved ? 'border-error text-error bg-error-container/20' : 'border-outline-variant/60 text-on-surface-variant hover:text-error hover:border-error'}
            `}
          >
            <span className={`material-symbols-outlined ${isSaved ? 'font-variation-fill-1' : ''}`}>favorite</span>
          </button>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={isSoldOut}
          className="flex-1 bg-secondary text-primary px-6 py-4 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-secondary-fixed-dim transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">bolt</span>
          Buy Now
        </button>
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
    </div>
  );
}
