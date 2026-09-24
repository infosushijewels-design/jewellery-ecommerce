"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

interface WishlistContextType {
  wishlistIds: Set<string>;
  // Resolves to 'added' | 'removed', or null if the user was redirected to log in first.
  toggleWishlist: (productId: string) => Promise<'added' | 'removed' | null>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    async function fetchWishlist() {
      if (!user) {
        setWishlistIds(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setWishlistIds(new Set(data.map(item => item.product_id)));
      } else {
        console.error('Error fetching wishlist:', error);
      }
      setIsLoading(false);
    }

    fetchWishlist();
  }, [user, supabase]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      router.push('/login');
      return null;
    }

    const newSet = new Set(wishlistIds);
    const isAdding = !newSet.has(productId);

    // Optimistic UI update
    if (isAdding) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    setWishlistIds(newSet);

    // Background database update
    if (isAdding) {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: user.id, product_id: productId });
      
      if (error) {
        console.error('Error adding to wishlist:', error);
        // Revert optimistic update on failure
        const revertSet = new Set(wishlistIds);
        revertSet.delete(productId);
        setWishlistIds(revertSet);
      }
    } else {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) {
        console.error('Error removing from wishlist:', error);
        // Revert optimistic update on failure
        const revertSet = new Set(wishlistIds);
        revertSet.add(productId);
        setWishlistIds(revertSet);
      }
    }

    return isAdding ? 'added' : 'removed';
  };

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
