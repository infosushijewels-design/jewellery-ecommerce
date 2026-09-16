"use client";

import React from 'react';
import { useCart } from '@/lib/context/CartContext';

export default function CartButton() {
  const { items, toggleCart } = useCart();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button 
      onClick={toggleCart}
      className="p-2 text-on-surface-variant hover:text-primary relative transition-colors" 
      title="Shopping Bag"
    >
      <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
      {totalItems > 0 && (
        <span className="absolute top-1 right-1 bg-primary text-surface font-label-sm text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  );
}
