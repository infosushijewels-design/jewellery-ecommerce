"use client";

import CartButton from '@/components/cart/CartButton';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useWishlist } from '@/lib/context/WishlistContext';

export default function Header() {
  const { user, signOut } = useAuth();
  const { wishlistIds } = useWishlist();
  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/60 transition-all duration-200 shadow-[0_8px_24px_-4px_rgba(45,32,36,0.05)]">
      <div className="w-full px-6 lg:px-16 max-w-[1440px] mx-auto flex items-center justify-between h-20">
        {/* Brand Logo */}
        <a className="flex flex-col items-start group" href="#">
          <span className="font-headline-lg text-headline-lg text-primary tracking-tight group-hover:text-secondary transition-colors duration-200">Sushi Jewels</span>
          <span className="font-label-sm text-label-sm text-outline tracking-[0.25em] -mt-1 font-normal">FINE JEWELLERY</span>
        </a>
        
        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center space-x-7">
          <a className="font-label-lg text-label-lg text-primary font-semibold border-b border-secondary pb-1" href="#new-arrivals">New Arrivals</a>
          <Link className="font-label-lg text-label-lg text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="/category/rings">Jewellery</Link>
          <a className="font-label-lg text-label-lg text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="#collections">Collections</a>
          <a className="font-label-lg text-label-lg text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="#materials">Diamonds</a>
          <a className="font-label-lg text-label-lg text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="#materials">Gold</a>
          <a className="font-label-lg text-label-lg text-on-surface-variant font-normal hover:text-primary transition-colors duration-200" href="#gift-finder">Gifts</a>
          <a className="font-label-lg text-label-lg text-secondary font-semibold hover:text-primary transition-colors duration-200 flex items-center gap-1" href="#campaign">
            Offers
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim inline-block animate-pulse"></span>
          </a>
        </nav>
        
        {/* Trailing Action Cluster */}
        <div className="flex items-center space-x-4">
          {/* Integrated Search */}
          <div className="relative hidden xl:block w-48 focus-within:w-60 transition-all duration-300">
            <input className="w-full bg-surface-container-low border border-outline-variant/60 rounded-full py-1.5 pl-8 pr-8 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-0" placeholder="Search heirloom gems..." type="text"/>
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[16px]">search</span>
            <kbd className="absolute right-2.5 top-2 font-label-sm text-[10px] text-outline px-1 rounded border border-outline-variant">⌘K</kbd>
          </div>
          {user ? (
            <div className="group relative">
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center" title="Account">
                <span className="material-symbols-outlined text-[22px]">person</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-outline-variant/30 hidden group-hover:block z-50">
                <div className="p-4 border-b border-outline-variant/30 text-label-sm truncate">
                  {user.email}
                </div>
                <button onClick={signOut} className="w-full text-left px-4 py-3 text-label-sm hover:bg-surface-container-low transition-colors text-error">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="Login">
              <span className="material-symbols-outlined text-[22px]">login</span>
            </Link>
          )}

          <Link href="/wishlist" className="p-2 text-on-surface-variant hover:text-primary relative transition-colors" title="Wishlist">
            <span className="material-symbols-outlined text-[22px]">favorite</span>
            {wishlistIds.size > 0 && (
              <span className="absolute top-1 right-1 bg-secondary text-surface font-label-sm text-[10px] h-4 w-4 rounded-full flex items-center justify-center">
                {wishlistIds.size}
              </span>
            )}
          </Link>
          <CartButton />
          <a className="hidden md:inline-flex items-center px-4 py-2 bg-primary-container text-surface hover:bg-tertiary-container transition-all duration-200 rounded-full font-label-md text-label-md scale-[1.01]" href="#salon">
            Book Appointment
          </a>
        </div>
      </div>
    </header>
  );
}
