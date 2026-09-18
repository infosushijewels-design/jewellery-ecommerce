"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { checkIsAdmin } from '@/lib/supabase/orderService';
import { isDemoAdminActive, clearDemoAdmin } from '@/lib/utils/adminDemoAccess';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute) return;

    async function verifyAdmin() {
      if (authLoading) return;

      if (isDemoAdminActive()) {
        setIsAdmin(true);
        return;
      }

      if (!user) {
        setIsAdmin(false);
        router.replace('/admin/login');
        return;
      }

      const adminStatus = await checkIsAdmin(user.id);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        router.replace('/admin/login');
      }
    }
    verifyAdmin();
  }, [user, authLoading, isLoginRoute, router]);

  const handleSignOut = async () => {
    clearDemoAdmin();
    await signOut();
    router.push('/admin/login');
  };

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/orders', label: 'Orders & Fulfillment', icon: 'shopping_bag' },
    { href: '/admin/products', label: 'Products & Inventory', icon: 'diamond' },
    { href: '/admin/customers', label: 'Customer Directory', icon: 'group' },
  ];

  // The login page renders as a clean, standalone screen — no sidebar chrome.
  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (authLoading || isAdmin === null || isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-tertiary animate-spin mb-4">progress_activity</span>
        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Verifying Concierge Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] text-gray-100 flex flex-col lg:flex-row">
      
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#17171A] border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-2xl">diamond</span>
          <span className="font-serif text-lg tracking-widest text-amber-200 font-bold uppercase">Sushi Admin</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white"
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined">{mobileNavOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#141417] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:w-72 ${
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-400 text-3xl">diamond</span>
              <div>
                <span className="font-serif text-lg font-bold tracking-widest text-amber-200 block">SUSHI JEWELS</span>
                <span className="text-[10px] uppercase tracking-widest bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                  Atelier Concierge
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-amber-400">storefront</span>
            <span>Return to Boutique</span>
          </Link>
          <div className="px-4 py-2 text-[11px] text-gray-400 flex items-center justify-between">
            <span className="truncate">{user?.email || 'Demo Admin'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Admin Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* Main Admin Content Canvas */}
      <main className="flex-1 min-w-0 bg-[#0F0F11] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
