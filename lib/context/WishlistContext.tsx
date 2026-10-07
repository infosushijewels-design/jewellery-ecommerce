"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: Set<string>;
  // Resolves to 'added' | 'removed' | null. Works for guests too (no login needed).
  toggleWishlist: (productId: string) => Promise<'added' | 'removed' | null>;
  isLoading: boolean;
  /** Products whose like/unlike is still being saved — their heart shows a spinner and ignores clicks. */
  pendingIds: Set<string>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

/**
 * Guests keep their wishlist in this browser's localStorage. When they sign in, those items are merged into
 * their saved (database) wishlist and the local copy is cleared — so nothing a visitor hearted is lost.
 */
const GUEST_KEY = 'sushi:guest-wishlist';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readGuestWishlist(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: Iterable<string>) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* storage blocked (private mode) — the heart still works for this visit */
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      if (!user) {
        // Guest: the wishlist lives in this browser.
        setWishlistIds(new Set(readGuestWishlist()));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Signed in: first fold any items hearted as a guest into the saved wishlist.
      const guestIds = readGuestWishlist().filter((id) => UUID_RE.test(id));
      if (guestIds.length > 0) {
        const rows = guestIds.map((product_id) => ({ user_id: user.id, product_id }));
        const { error: mergeError } = await supabase
          .from('wishlist_items')
          .upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
        if (mergeError) {
          // One bad id (e.g. a product that was deleted) would fail the whole batch — retry one by one.
          await Promise.allSettled(
            rows.map((row) =>
              supabase.from('wishlist_items').upsert(row, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
            )
          );
        }
      }
      // Clear the local copy either way so a stale id can never be retried forever.
      if (readGuestWishlist().length > 0) writeGuestWishlist([]);

      const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', user.id);
      if (!active) return;
      if (!error && data) {
        setWishlistIds(new Set(data.map((item) => item.product_id)));
      } else {
        console.error('Error fetching wishlist:', error);
      }
      setIsLoading(false);
    }

    loadWishlist();
    return () => {
      active = false;
    };
  }, [user, supabase]);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());
  const setPending = (productId: string, on: boolean) => {
    if (on) pendingRef.current.add(productId);
    else pendingRef.current.delete(productId);
    setPendingIds(new Set(pendingRef.current));
  };

  const toggleWishlist = async (productId: string) => {
    // A change for this product is already being saved: ignore the extra click
    if (pendingRef.current.has(productId)) return null;
    const newSet = new Set(wishlistIds);
    const isAdding = !newSet.has(productId);

    // Optimistic UI update
    if (isAdding) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    setWishlistIds(newSet);

    if (!user) {
      writeGuestWishlist(newSet);
      return isAdding ? 'added' : 'removed';
    }

    // Background database update
    setPending(productId, true);
    try {
    if (isAdding) {
      const { error } = await supabase.from('wishlist_items').insert({ user_id: user.id, product_id: productId });

      if (error) {
        console.error('Error adding to wishlist:', error);
        // Revert optimistic update on failure
        const revertSet = new Set(wishlistIds);
        revertSet.delete(productId);
        setWishlistIds(revertSet);
      }
    } else {
      const { error } = await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);

      if (error) {
        console.error('Error removing from wishlist:', error);
        // Revert optimistic update on failure
        const revertSet = new Set(wishlistIds);
        revertSet.add(productId);
        setWishlistIds(revertSet);
      }
    }
    } finally {
      setPending(productId, false);
    }

    return isAdding ? 'added' : 'removed';
  };

  return <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isLoading, pendingIds }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
