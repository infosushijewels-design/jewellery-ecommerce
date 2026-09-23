"use client";

import CartButton from '@/components/cart/CartButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { Suspense, useEffect, useState } from 'react';
import { checkIsAdmin } from '@/lib/supabase/orderService';
import SearchBox from './SearchBox';

interface DropdownColumn {
  heading: string;
  links: { label: string; href: string }[];
}

interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  dropdown?: DropdownColumn[];
}

const navLinks: NavItem[] = [
  {
    label: 'New Arrivals',
    href: '/new-arrivals',
    dropdown: [
      {
        heading: 'Shop by Type',
        links: [
          { label: 'Latest Rings', href: '/new-arrivals?category=rings' },
          { label: 'Latest Earrings', href: '/new-arrivals?category=earrings' },
          { label: 'Latest Necklaces', href: '/new-arrivals?category=necklaces' },
          { label: 'Latest Bangles', href: '/new-arrivals?category=bangles' },
        ],
      },
      {
        heading: 'Shop by Metal',
        links: [
          { label: 'Yellow Gold', href: '/new-arrivals?metal=18k-yellow' },
          { label: 'Rose Gold', href: '/new-arrivals?metal=18k-rose' },
          { label: 'White Gold', href: '/new-arrivals?metal=18k-white' },
        ],
      },
      {
        heading: 'Shop by Price',
        links: [
          { label: 'Under ₹25,000', href: '/new-arrivals?maxPrice=25000' },
          { label: '₹25k – ₹50k', href: '/new-arrivals?minPrice=25000&maxPrice=50000' },
          { label: 'Above ₹50,000', href: '/new-arrivals?minPrice=50000' },
        ],
      },
    ],
  },
  {
    label: 'Rings',
    href: '/category/rings',
    dropdown: [
      {
        heading: 'Shop by Style',
        links: [
          { label: 'Engagement Rings', href: '/category/rings?style=engagement' },
          { label: 'Solitaire Rings', href: '/category/rings?style=solitaire' },
          { label: 'Cocktail Rings', href: '/category/rings?style=cocktail' },
          { label: 'Bands', href: '/category/rings?style=bands' },
        ],
      },
      {
        heading: 'Shop by Metal',
        links: [
          { label: 'Yellow Gold', href: '/category/rings?metal=18k-yellow' },
          { label: 'Rose Gold', href: '/category/rings?metal=18k-rose' },
          { label: 'White Gold', href: '/category/rings?metal=18k-white' },
        ],
      },
      {
        heading: 'Shop by Price',
        links: [
          { label: 'Under ₹25,000', href: '/category/rings?maxPrice=25000' },
          { label: '₹25k – ₹50k', href: '/category/rings?minPrice=25000&maxPrice=50000' },
          { label: 'Above ₹50,000', href: '/category/rings?minPrice=50000' },
        ],
      },
    ],
  },
  {
    label: 'Earrings',
    href: '/category/earrings',
    dropdown: [
      {
        heading: 'Shop by Style',
        links: [
          { label: 'Studs', href: '/category/earrings?style=studs' },
          { label: 'Hoops', href: '/category/earrings?style=hoops' },
          { label: 'Drops & Dangles', href: '/category/earrings?style=drops' },
          { label: 'Chandeliers', href: '/category/earrings?style=chandeliers' },
        ],
      },
      {
        heading: 'Shop by Metal',
        links: [
          { label: 'Yellow Gold', href: '/category/earrings?metal=18k-yellow' },
          { label: 'Rose Gold', href: '/category/earrings?metal=18k-rose' },
          { label: 'White Gold', href: '/category/earrings?metal=18k-white' },
        ],
      },
      {
        heading: 'Shop by Price',
        links: [
          { label: 'Under ₹25,000', href: '/category/earrings?maxPrice=25000' },
          { label: '₹25k – ₹50k', href: '/category/earrings?minPrice=25000&maxPrice=50000' },
          { label: 'Above ₹50,000', href: '/category/earrings?minPrice=50000' },
        ],
      },
    ],
  },
  {
    label: 'Necklaces',
    href: '/category/necklaces',
    dropdown: [
      {
        heading: 'Shop by Style',
        links: [
          { label: 'Lightweight Necklaces', href: '/category/necklaces?style=lightweight' },
          { label: 'Everyday Pendants', href: '/category/necklaces?style=pendants' },
          { label: 'Statement Pieces', href: '/category/necklaces?style=statement' },
          { label: 'Mangalsutras', href: '/category/necklaces?style=mangalsutra' },
        ],
      },
      {
        heading: 'Shop by Metal',
        links: [
          { label: 'Yellow Gold', href: '/category/necklaces?metal=18k-yellow' },
          { label: 'Rose Gold', href: '/category/necklaces?metal=18k-rose' },
          { label: 'White Gold', href: '/category/necklaces?metal=18k-white' },
        ],
      },
      {
        heading: 'Shop by Price',
        links: [
          { label: 'Under ₹25,000', href: '/category/necklaces?maxPrice=25000' },
          { label: '₹25k – ₹1L', href: '/category/necklaces?minPrice=25000&maxPrice=100000' },
          { label: 'Above ₹1L', href: '/category/necklaces?minPrice=100000' },
        ],
      },
    ],
  },
  {
    label: 'Bracelets',
    href: '/category/bracelets',
    dropdown: [
      {
        heading: 'Shop by Style',
        links: [
          { label: 'Tennis Bracelets', href: '/category/bracelets?style=tennis' },
          { label: 'Charm Bracelets', href: '/category/bracelets?style=charm' },
          { label: 'Bangles', href: '/category/bangles' },
        ],
      },
      {
        heading: 'Shop by Metal',
        links: [
          { label: 'Yellow Gold', href: '/category/bracelets?metal=18k-yellow' },
          { label: 'Rose Gold', href: '/category/bracelets?metal=18k-rose' },
          { label: 'White Gold', href: '/category/bracelets?metal=18k-white' },
        ],
      },
    ],
  },
  {
    label: 'Bangles',
    href: '/category/bangles',
    dropdown: [
      {
        heading: 'Shop by Style',
        links: [
          { label: 'Traditional Bangles', href: '/category/bangles?style=traditional' },
          { label: 'Diamond Bangles', href: '/category/bangles?style=diamond' },
          { label: 'Gold Bangles', href: '/category/bangles?style=gold' },
        ],
      },
      {
        heading: 'Shop by Price',
        links: [
          { label: 'Under ₹25,000', href: '/category/bangles?maxPrice=25000' },
          { label: '₹25k – ₹75k', href: '/category/bangles?minPrice=25000&maxPrice=75000' },
          { label: 'Above ₹75,000', href: '/category/bangles?minPrice=75000' },
        ],
      },
    ],
  },
  { label: 'Collections', href: '/collections' },
  { label: 'Offers', href: '/#campaign', highlight: true },
];

export default function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { wishlistIds } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Only admins see the Admin Panel shortcut
  useEffect(() => {
    let active = true;
    if (!user) {
      void Promise.resolve().then(() => active && setIsAdmin(false));
      return () => {
        active = false;
      };
    }
    checkIsAdmin(user.id)
      .then((result) => active && setIsAdmin(result))
      .catch(() => active && setIsAdmin(false));
    return () => {
      active = false;
    };
  }, [user]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface shadow-[0_2px_8px_rgba(45,32,36,0.08)] border-b border-outline-variant/40">

        {/* ── ROW 1: Logo | Search | Icons ─────────────────────────── */}
        <div className="w-full px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto flex items-center gap-4 h-16 sm:h-20">

          {/* Brand Logo */}
          <Link href="/" prefetch={true} onClick={handleLogoClick} className="flex flex-col items-start flex-shrink-0 group">
            <span className="font-headline-lg text-[20px] sm:text-[22px] text-primary tracking-tight group-hover:text-secondary transition-colors leading-tight">
              Sushi Jewels
            </span>
            <span className="font-label-sm text-[7px] sm:text-[8px] text-outline tracking-[0.25em] font-normal">
              FINE JEWELLERY
            </span>
          </Link>

          {/* Center Search Bar */}
          <div className="hidden lg:flex flex-1 mx-6 xl:mx-12 relative">
            <Suspense fallback={<div className="w-full h-[46px] rounded-full bg-surface-container-low border border-outline-variant/60" />}>
              <SearchBox placeholder="Search rings, necklaces, diamonds..." />
            </Suspense>
          </div>

          {/* Trailing Icons */}
          <div className="flex items-center ml-auto lg:ml-0">
            <Link
              href="/stores"
              className="h-10 px-2 sm:px-3 flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
              title="Find a store"
            >
              <span className="material-symbols-outlined text-[22px]">location_on</span>
              <span className="hidden xl:inline font-label-md text-label-md uppercase tracking-wider">Stores</span>
            </Link>
            {user ? (
              <div className="group relative">
                <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container" title="Account">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </button>
                <div className="absolute right-0 mt-1 w-52 bg-surface rounded-xl shadow-xl border border-outline-variant/30 hidden group-hover:block z-50 overflow-hidden py-1">
                  <div className="px-4 py-2.5 border-b border-outline-variant/30 text-xs text-on-surface-variant truncate font-medium">{user.email}</div>
                  <Link href="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-surface-container-low transition-colors text-primary font-medium">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">package_2</span>My Orders
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-xs hover:bg-surface-container-low transition-colors text-primary font-medium">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">admin_panel_settings</span>Admin Panel
                    </Link>
                  )}
                  <button onClick={async () => { await signOut(); window.location.href = '/login'; }} className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-xs hover:bg-surface-container-low transition-colors text-error border-t border-outline-variant/20">
                    <span className="material-symbols-outlined text-[18px]">logout</span>Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container" title="Sign In">
                <span className="material-symbols-outlined text-[22px]">person</span>
              </Link>
            )}

            <Link href="/wishlist" className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary relative transition-colors rounded-full hover:bg-surface-container" title="Wishlist">
              <span className="material-symbols-outlined text-[22px]">favorite</span>
              {wishlistIds.size > 0 && (
                <span className="absolute top-1 right-1 bg-secondary text-surface font-label-sm text-[9px] h-4 w-4 rounded-full flex items-center justify-center">{wishlistIds.size}</span>
              )}
            </Link>

            <CartButton />


            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container ml-1" aria-label="Open menu">
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>

        {/* ── ROW 1b: Search (mobile only — desktop keeps it inside Row 1) ── */}
        <div className="block lg:hidden px-4 pb-3 pt-1 bg-surface border-b border-outline-variant/20">
          <Suspense fallback={<div className="w-full h-[40px] sm:h-[44px] rounded-full bg-surface-container-low border border-outline-variant/60" />}>
            <SearchBox placeholder="Search rings, necklaces, diamonds..." compact />
          </Suspense>
        </div>

        {/* ── ROW 2: Nav links with Dropdowns ───────────────────────── */}
        <nav className="hidden lg:block border-t border-outline-variant/30 bg-[#FAF8F5]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-center">
            {navLinks.map((link) => (
              <div key={link.label} className="group relative">
                {/* Nav Link */}
                <Link
                  href={link.href}
                  className={`flex items-center gap-1 px-4 py-3.5 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors border-b-2 border-transparent group-hover:border-primary group-hover:text-primary ${link.highlight
                      ? 'text-secondary font-semibold group-hover:border-secondary group-hover:text-secondary'
                      : 'text-on-surface-variant'
                    }`}
                >
                  {link.label}
                  {link.dropdown && (
                    <span className="material-symbols-outlined text-[14px] opacity-60">expand_more</span>
                  )}
                  {link.highlight && (
                    <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-secondary animate-pulse align-middle" />
                  )}
                </Link>

                {/* Dropdown Mega Menu */}
                {link.dropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 hidden group-hover:block z-50 min-w-[520px]">
                    <div className="mt-0 bg-surface border border-outline-variant/30 rounded-b-xl shadow-2xl p-6">
                      <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${link.dropdown.length}, 1fr)` }}>
                        {link.dropdown.map((col) => (
                          <div key={col.heading}>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary border-b border-outline-variant/40 pb-2 mb-3">
                              {col.heading}
                            </p>
                            <ul className="space-y-2">
                              {col.links.map((item) => (
                                <li key={item.label}>
                                  <Link
                                    href={item.href}
                                    className="text-[13px] text-on-surface-variant hover:text-primary hover:underline transition-colors"
                                  >
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[200]" onClick={closeMobileMenu} />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`fixed top-0 left-0 h-full w-[85vw] max-w-[340px] bg-surface z-[201] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
          <div className="flex flex-col">
            <span className="font-headline-lg text-[20px] text-primary tracking-tight leading-tight">Sushi Jewels</span>
            <span className="font-label-sm text-[8px] text-outline tracking-[0.25em]">FINE JEWELLERY</span>
          </div>
          <button onClick={closeMobileMenu} className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container" aria-label="Close menu">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="px-5 py-3 border-b border-outline-variant/20">
          <Suspense fallback={<div className="w-full h-[38px] rounded-full bg-surface-container-low border border-outline-variant/60" />}>
            <SearchBox placeholder="Search jewellery..." compact onNavigate={closeMobileMenu} />
          </Suspense>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-lg text-label-lg hover:bg-surface-container-low transition-colors ${link.highlight ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-primary'}`}>
                <span className="material-symbols-outlined text-secondary text-[20px]">chevron_right</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-outline-variant/30 mx-4 my-3" />

          <div className="px-2 space-y-1">
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div className="min-w-0">
                  <p className="text-primary font-label-lg text-label-lg truncate">{user.email}</p>
                  <p className="text-on-surface-variant text-[11px]">Logged in</p>
                </div>
              </div>
            )}

            <Link href="/stores" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-low hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">location_on</span>
              Store Locator
            </Link>
            <Link href="/wishlist" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-low hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-secondary text-[20px]">favorite</span>
              Wishlist
              {wishlistIds.size > 0 && <span className="ml-auto bg-secondary text-surface text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-semibold">{wishlistIds.size}</span>}
            </Link>

            {user ? (
              <>
                <Link href="/orders" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-low hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[20px]">package_2</span>My Orders
                </Link>
                <button onClick={async () => { await signOut(); closeMobileMenu(); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-error font-label-lg text-label-lg hover:bg-error-container/20 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">logout</span>Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-low hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-secondary text-[20px]">login</span>Sign In / Register
              </Link>
            )}
          </div>
        </nav>

        <div className="p-5 border-t border-outline-variant/30">
          <Link href="/contact" onClick={closeMobileMenu} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-surface rounded-full font-label-lg text-label-lg hover:bg-primary/90 transition-all">
            <span className="material-symbols-outlined text-[18px]">event</span>Book Appointment
          </Link>
        </div>
      </div>
    </>
  );
}
