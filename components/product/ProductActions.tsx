"use client";

import React, { useState } from 'react';

import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [selectedMetal, setSelectedMetal] = useState("18K Yellow Gold");
  const [selectedSize, setSelectedSize] = useState("12");
  
  const { addToCart, openCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  
  const isSaved = wishlistIds.has(product.id);

  const metals = ["18K Yellow Gold", "18K Rose Gold", "18K White Gold", "Platinum"];
  const sizes = ["8", "10", "12", "14", "16", "18", "20", "22"];

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
          <a href="#size-guide" className="text-secondary font-label-sm text-label-sm hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">straighten</span>
            Size Guide
          </a>
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

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/30">
        <button 
          onClick={() => {
            addToCart({
              productId: product.id,
              title: product.title,
              price: product.price,
              imageUrl: product.imageUrl,
              metal: selectedMetal,
              size: selectedSize
            });
            openCart();
          }}
          className="flex-grow bg-primary text-surface px-6 py-4 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          Add to Cart
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

      <div className="bg-surface-container-low p-4 rounded-xl border border-secondary/40 text-center space-y-2 mt-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="material-symbols-outlined text-secondary">local_shipping</span>
          <h4 className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">Complimentary Shipping</h4>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
          Insured delivery Pan-India. Made to order, dispatched within 10-14 days.
        </p>
      </div>
    </div>
  );
}
