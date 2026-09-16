"use client";

import React from 'react';
import { useCart } from '@/lib/context/CartContext';
import Link from 'next/link';

export default function CartSidebar() {
  const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, subtotal, tax, total } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-surface-container-highest/80 backdrop-blur-sm z-[100] transition-opacity"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface shadow-2xl z-[101] flex flex-col transform transition-transform duration-300 ease-in-out border-l border-outline-variant/30">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-primary uppercase tracking-wider">Your Bag ({items.length})</h2>
          <button 
            onClick={closeCart}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-50">shopping_bag</span>
              <p className="font-body-md text-body-md">Your bag is empty.</p>
              <button onClick={closeCart} className="text-secondary font-label-sm hover:underline">Continue Shopping</button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-24 h-24 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-label-md text-label-md text-primary">{item.title}</h3>
                      <button onClick={() => removeFromCart(item.id)} className="text-on-surface-variant hover:text-error">
                         <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    <p className="text-label-sm text-on-surface-variant mt-1">{item.metal} • Size {item.size}</p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center border border-outline-variant/60 rounded">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-on-surface-variant hover:bg-surface-container"
                      >
                        -
                      </button>
                      <span className="px-2 font-label-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-on-surface-variant hover:bg-surface-container"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-label-md text-primary font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="border-t border-outline-variant/30 p-6 bg-surface-container-lowest">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Tax (3% GST)</span>
                <span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-headline-sm text-primary border-t border-outline-variant/30 pt-3">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <button className="w-full bg-primary text-surface py-4 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2">
              Proceed to Checkout
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <p className="text-center text-label-sm text-on-surface-variant mt-4">
              Complimentary shipping on all orders.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
