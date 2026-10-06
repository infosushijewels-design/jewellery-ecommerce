"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

export interface CartItem {
  id: string; // combination of productId + size + metal to make unique
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  metal: string;
  size: string;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: number;
  tax: number; // GST at the rate configured in Admin → Settings (default 3%)
  total: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // The saved bag is only written back once it has been read. Before this guard, the first render saved the empty
  // starting list over the real bag — so a page reload (or a second effect run in development) wiped the cart.
  const [hydrated, setHydrated] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    let saved: CartItem[] | null = null;
    try {
      const raw = localStorage.getItem('sushi-cart');
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load cart from local storage", e);
    }
    const timer = setTimeout(() => {
      if (Array.isArray(saved)) setItems(saved);
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('sushi-cart', JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to local storage", e);
    }
  }, [items, hydrated]);

  const addToCart = (newItem: Omit<CartItem, 'id' | 'quantity'>) => {
    const id = `${newItem.productId}-${newItem.metal}-${newItem.size}`;
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...newItem, id, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const storeSettings = useStoreSettings();

  const toggleCart = () => setIsCartOpen((prev) => !prev);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (storeSettings.commerce.gstRate / 100);
  const total = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleCart,
        openCart,
        closeCart,
        clearCart,
        subtotal,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
