"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductCard from '@/components/product/ProductCard';
import { useAuth } from '@/lib/context/AuthContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Product = Database['public']['Tables']['products']['Row'];

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { wishlistIds, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProducts() {
      if (wishlistIds.size === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', Array.from(wishlistIds));

      if (error) {
        console.error('Error fetching wishlist products:', error);
      } else {
        setProducts(data || []);
      }
      setIsLoading(false);
    }

    if (!wishlistLoading) {
      fetchProducts();
    }
  }, [wishlistIds, wishlistLoading]);

  if (authLoading || (user && isLoading)) {
    return (
      <>
        <AnnouncementBar />
        <Header />
        <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-16 pt-20 pb-20 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-surface-container mb-4"></div>
            <div className="h-6 w-32 bg-surface-container rounded mb-2"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null; // Redirecting

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-[26px] sm:text-display-md text-primary font-normal mb-2">Your Wishlist</h1>
          <p className="text-body-md text-on-surface-variant">Curated pieces saved for later.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
            <span className="material-symbols-outlined text-[48px] text-outline mb-4">heart_broken</span>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Your wishlist is empty</h3>
            <p className="text-on-surface-variant font-body-sm text-body-sm mb-6">Explore our collections and find something you love.</p>
            <Link href="/new-arrivals" className="bg-primary text-surface px-6 py-3 rounded-full font-label-md uppercase hover:bg-tertiary transition-colors">
              Discover Jewellery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                imageSrc={product.image_url}
                imageAlt={product.title}
                badge={product.badge || undefined}
                material={product.material}
                title={product.title}
                certification={product.certification || 'Verified'}
                price={product.price}
                mrp={product.mrp}
                stock={product.stock}
                slug={product.slug}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
