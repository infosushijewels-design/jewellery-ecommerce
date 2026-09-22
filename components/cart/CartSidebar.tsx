"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function CartSidebar() {
  const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, subtotal, tax, total } = useCart();
  const storeSettings = useStoreSettings();

  // Esc closes the drawer; the page behind doesn't scroll while it's open
  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const threshold = storeSettings.commerce.freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, threshold - subtotal);
  const shippingProgress = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]" onClick={closeCart} />

      {/* Panel */}
      <aside className="absolute top-0 right-0 bottom-0 sm:top-3 sm:right-3 sm:bottom-3 w-full sm:w-[420px] bg-surface sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[drawerIn_0.25s_ease-out]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-primary">shopping_bag</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-[20px] leading-tight text-primary">Shopping Cart</h2>
              <p className="text-body-sm text-on-surface-variant">
                {itemCount === 0 ? 'Empty' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
            aria-label="Close cart"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-10">
            <div className="w-20 h-20 border border-outline-variant/60 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[34px] text-primary">shopping_bag</span>
            </div>
            <h3 className="font-headline-sm text-[20px] text-primary mb-2">Your cart is empty</h3>
            <p className="text-body-sm text-on-surface-variant max-w-[260px] leading-relaxed mb-7">
              Looks like you haven&apos;t added anything yet. Explore our hallmarked gold and natural diamond jewellery.
            </p>
            <Link
              href="/new-arrivals"
              onClick={closeCart}
              className="bg-primary text-surface px-7 py-3 font-label-md text-label-md uppercase tracking-wider hover:bg-tertiary transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Free-shipping progress */}
            {threshold > 0 && (
              <div className="px-5 sm:px-6 pt-4">
                <p className="text-body-sm text-on-surface-variant mb-2">
                  {remainingForFreeShipping > 0 ? (
                    <>
                      Add <span className="font-semibold text-primary">{inr(remainingForFreeShipping)}</span> more for free insured shipping
                    </>
                  ) : (
                    <span className="text-tertiary font-medium">✓ You&apos;ve unlocked free insured shipping</span>
                  )}
                </p>
                <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${shippingProgress}%` }} />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 divide-y divide-outline-variant/30">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-label-md text-label-md text-primary leading-snug line-clamp-2">{item.title}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-on-surface-variant hover:text-error flex-shrink-0 p-0.5"
                          aria-label={`Remove ${item.title}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                      {(item.metal || item.size) && (
                        <p className="text-label-sm text-on-surface-variant mt-1">
                          {[item.metal, item.size && `Size ${item.size}`].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-outline-variant/60 rounded-full">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary"
                          aria-label="Decrease quantity"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="w-6 text-center font-label-sm tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary"
                          aria-label="Increase quantity"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                      <span className="font-label-md text-primary font-semibold tabular-nums">{inr(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-outline-variant/30 px-5 sm:px-6 py-5 bg-surface-container-lowest">
              <div className="space-y-2 mb-5 text-body-md">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{inr(subtotal)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>GST ({storeSettings.commerce.gstRate}%)</span>
                  <span className="tabular-nums">{inr(tax)}</span>
                </div>
                <div className="flex justify-between text-headline-sm text-primary border-t border-outline-variant/30 pt-3">
                  <span>Total</span>
                  <span className="tabular-nums">{inr(total)}</span>
                </div>
                <p className="text-label-sm text-on-surface-variant">Shipping is calculated at checkout.</p>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full bg-primary text-surface py-3.5 font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <button
                onClick={closeCart}
                className="w-full mt-3 text-label-md font-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary py-2"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
