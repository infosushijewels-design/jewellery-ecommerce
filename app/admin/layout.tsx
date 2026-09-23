"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { checkIsAdmin } from '@/lib/supabase/orderService';
import { isDemoAdminActive, clearDemoAdmin, getDemoAdminEmail } from '@/lib/utils/adminDemoAccess';
import { AdminAccessProvider, SUPER_ADMIN_ACCESS, loadAdminAccess, type AdminAccess } from '@/components/admin/AdminAccessContext';
import { moduleForPath, type PermissionModule } from '@/lib/permissions';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import ProfileMenu from '@/components/admin/ProfileMenu';
import NotificationsBell from '@/components/admin/NotificationsBell';
import CommandPalette from '@/components/admin/CommandPalette';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { store } = useStoreSettings();

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute) return;

    async function verifyAdmin() {
      if (authLoading) return;

      if (isDemoAdminActive()) {
        setAccess(await loadAdminAccess(null));
        setIsAdmin(true);
        return;
      }

      if (!user) {
        setIsAdmin(false);
        router.replace('/admin/login');
        return;
      }

      const adminStatus = await checkIsAdmin(user.id);
      if (adminStatus) setAccess(await loadAdminAccess(user.id));
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        router.replace('/admin/login');
      }
    }
    verifyAdmin();
  }, [user, authLoading, isLoginRoute, router]);

  // Remember the collapsed sidebar between visits
  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem('sj_admin_sidebar_collapsed') === '1';
    } catch {
      return; // storage blocked — keep it expanded
    }
    if (stored) Promise.resolve().then(() => setCollapsed(true));
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sj_admin_sidebar_collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Ctrl/Cmd + K opens the command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSignOut = async () => {
    clearDemoAdmin();
    await signOut();
    router.push('/admin/login');
  };

  type NavLink = { href: string; label: string; icon: string; module: PermissionModule | null };
  const navSections: { title: string; links: NavLink[] }[] = [
    {
      title: 'Main',
      links: [
        { href: '/admin', label: 'Dashboard', icon: 'dashboard', module: 'dashboard' },
        { href: '/admin/orders', label: 'Orders', icon: 'shopping_bag', module: 'orders' },
        { href: '/admin/products', label: 'Products', icon: 'diamond', module: 'products' },
        { href: '/admin/categories', label: 'Categories', icon: 'category', module: 'categories' },
      ],
    },
    {
      title: 'Management',
      links: [
        { href: '/admin/customers', label: 'Customers', icon: 'group', module: 'customers' },
        { href: '/admin/stores', label: 'Stores', icon: 'storefront', module: 'stores' },
      ],
    },
    {
      title: 'Engagement',
      links: [
        { href: '/admin/coupons', label: 'Coupons', icon: 'sell', module: 'coupons' },
        { href: '/admin/reviews', label: 'Reviews', icon: 'star', module: 'reviews' },
        { href: '/admin/inquiries', label: 'Contact Inquiries', icon: 'mail', module: 'inquiries' },
      ],
    },
    {
      title: 'System',
      links: [
        { href: '/admin/legal', label: 'Legal Pages', icon: 'gavel', module: 'legal' },
        { href: '/admin/staff', label: 'Staff & Roles', icon: 'badge', module: 'staff' },
        { href: '/admin/settings', label: 'Settings', icon: 'settings', module: 'settings' },
      ],
    },
  ];

  const canView = (module: PermissionModule | null) => !module || !access || access.can(module, 'view');
  const visibleSections = navSections
    .map((section) => ({ ...section, links: section.links.filter((l) => canView(l.module)) }))
    .filter((section) => section.links.length > 0);
  const firstAllowedHref = visibleSections[0]?.links[0]?.href || '/';
  // Exact match for the dashboard; nested routes (e.g. /admin/products/new) keep their section highlighted
  const isLinkActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : !href.includes('?') && (pathname === href || pathname.startsWith(`${href}/`));
  const allLinks = navSections.flatMap((sec) => sec.links.map((l) => ({ ...l, section: sec.title })));
  const currentLink = allLinks.find((l) => isLinkActive(l.href));

  // Contextual "create" shortcut for the current section
  const QUICK_ACTIONS: Partial<Record<PermissionModule, { label: string; href: string; action: 'create' }>> = {
    products: { label: 'Add Product', href: '/admin/products/new', action: 'create' },
    categories: { label: 'Add Category', href: '/admin/categories?new=1', action: 'create' },
    coupons: { label: 'Create Coupon', href: '/admin/coupons?new=1', action: 'create' },
    stores: { label: 'Add Store', href: '/admin/stores?new=1', action: 'create' },
    legal: { label: 'Add Page', href: '/admin/legal?new=1', action: 'create' },
  };
  const quickAction = currentLink?.module ? QUICK_ACTIONS[currentLink.module] : undefined;
  const canQuickAction = !!quickAction && (!access || access.can(currentLink!.module!, 'create'));
  const currentModule = moduleForPath(pathname);
  const pageAllowed = canView(currentModule);


  // The login page renders as a clean, standalone screen — no sidebar chrome.
  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (authLoading || isAdmin === null || isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-[#B99A62] animate-spin mb-4">progress_activity</span>
        <p className="font-label-sm text-label-sm text-[#2D2024]/70 uppercase tracking-wider">Verifying Admin Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D2024]">

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#FFFCF7] border-r border-[#E8D5C5]/70 flex flex-col transition-all duration-300 lg:translate-x-0 lg:fixed lg:inset-y-0 lg:h-screen flex-shrink-0 ${collapsed ? 'lg:w-[84px]' : 'lg:w-72'} ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Collapse handle (desktop) */}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-[#FFFCF7] border border-[#E8D5C5] items-center justify-center text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#F5EEE7] shadow-sm"
        >
          <span className={`material-symbols-outlined text-[16px] transition-transform ${collapsed ? 'rotate-180' : ''}`}>chevron_left</span>
        </button>
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Brand Header */}
          <div className={`py-3.5 border-b border-[#E8D5C5]/70 flex-shrink-0 ${collapsed ? 'lg:px-0' : ''} px-5`}>
            <Link href="/admin" className={`flex items-center gap-2.5 ${collapsed ? 'lg:justify-center' : ''}`} title={store.name}>
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt={store.name} className="h-9 w-auto max-w-[56px] object-contain" />
              ) : (
                <span className="material-symbols-outlined text-[#B99A62] text-3xl">diamond</span>
              )}
              <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                <span className="font-headline-sm text-lg font-bold tracking-wide text-[#2D2024] block uppercase truncate">{store.name}</span>
                <span className="font-label-sm text-[10px] uppercase tracking-widest bg-[#B99A62]/15 text-[#8A6F3C] px-2 py-0.5 rounded-full font-semibold">
                  Admin Panel
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          {/* Scrolls only on very short screens; scrollbar hidden so the menu reads as fixed */}
          <nav className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-3 py-2.5 space-y-2.5">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <p className={`px-4 mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2D2024]/40 ${collapsed ? 'lg:hidden' : ''}`}>{section.title}</p>
                {collapsed && <div className="hidden lg:block mx-3 mb-2 border-t border-[#E8D5C5]/70" />}
                <div className="space-y-0.5">
                  {section.links.map((item) => {
                    const isActive = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center lg:px-0' : ''} px-4 py-1.5 rounded-md font-label-sm text-label-sm uppercase tracking-wider transition-colors border-l-4 ${isActive
                            ? 'bg-[#B99A62]/12 text-[#8A6F3C] border-[#B99A62]'
                            : 'text-[#2D2024]/65 border-transparent hover:text-[#2D2024] hover:bg-[#E8D5C5]/35'
                          }`}
                      >
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

      </aside>

      {/* Backdrop for mobile */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-[#2D2024]/40 backdrop-blur-[2px] z-30 lg:hidden"
        />
      )}

      {/* Main Admin Content Canvas */}
      {/* The sidebar is fixed and the canvas is offset, so a wide table scrolling
          sideways can never drag the menu off-screen. */}
      <main className={`min-w-0 bg-[#FAF7F2] min-h-screen transition-[margin] duration-300 ${collapsed ? 'lg:ml-[84px]' : 'lg:ml-72'}`}>
        {/* Top Admin Profile Bar */}
        <div className="sticky top-0 z-20 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#E8D5C5]/40 px-4 sm:px-8 lg:px-10 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 -ml-1 rounded-lg border border-[#E8D5C5] bg-[#FFFCF7] text-[#2D2024] hover:bg-[#E8D5C5]/40 transition-colors"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <span className="material-symbols-outlined block">{mobileNavOpen ? 'close' : 'menu'}</span>
          </button>
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
            {currentLink && currentLink.href !== '/admin' ? (
              <>
                <Link href="/admin" className="text-[#2D2024]/50 hover:text-[#2D2024]">Dashboard</Link>
                <span className="material-symbols-outlined text-base text-[#2D2024]/30">chevron_right</span>
                <span className="text-[#2D2024] font-medium truncate">{currentLink.label}</span>
              </>
            ) : (
              <span className="text-[#2D2024] font-medium">Dashboard</span>
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-[#E8D5C5] bg-[#FFFCF7] hover:bg-[#E8D5C5]/40 text-[#2D2024]/70 text-xs transition-colors"
            title="Search admin (Ctrl + K)"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span className="hidden lg:inline">Search…</span>
            <kbd className="hidden lg:inline font-mono text-[10px] border border-[#E8D5C5] rounded px-1 py-0.5">Ctrl K</kbd>
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-[#E8D5C5]/30 text-[#2D2024]/70"
            aria-label="Search admin"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          {canQuickAction && quickAction && (
            <Link
              href={quickAction.href}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] px-3.5 py-2 rounded-full text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {quickAction.label}
            </Link>
          )}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#E8D5C5] bg-[#FFFCF7] hover:bg-[#E8D5C5]/40 text-[#2D2024] text-xs font-medium transition-colors"
            title="Open storefront in a new tab"
          >
            <span className="material-symbols-outlined text-[18px] text-[#8A6F3C]">language</span>
            <span className="hidden sm:inline">Visit Store</span>
          </Link>
          <NotificationsBell />
          <ProfileMenu
            name={(user?.user_metadata?.full_name as string | undefined)?.trim() || user?.email?.split('@')[0] || (getDemoAdminEmail() ? getDemoAdminEmail()!.split('@')[0] : 'Anjali (Admin)')}
            email={user?.email || getDemoAdminEmail() || 'anjaliworksphere@gmail.com'}
            roleName={access?.roleName || 'Super Admin'}
            showSettings={!access || access.can('settings', 'view')}
            onSignOut={handleSignOut}
          />
          </div>
        </div>
        <AdminAccessProvider value={access ?? SUPER_ADMIN_ACCESS}>
          {paletteOpen && (
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            links={visibleSections.flatMap((sec) => sec.links.map((l) => ({ href: l.href, label: l.label, icon: l.icon, section: sec.title })))}
            canViewOrders={canView('orders')}
            canViewProducts={canView('products')}
            canViewCustomers={canView('customers')}
          />
          )}
          {pageAllowed ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#2D2024]/5 border border-[#E8D5C5] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-[#B99A62]">lock</span>
              </div>
              <h1 className="font-headline-sm text-2xl text-[#2D2024]">No access</h1>
              <p className="text-sm text-[#2D2024]/60 mt-2 max-w-sm">
                Your role ({access?.roleName}) doesn&apos;t include this section. Ask a Super Admin to update your permissions.
              </p>
              <Link
                href={firstAllowedHref}
                className="mt-6 inline-flex items-center gap-2 bg-[#2D2024] text-[#FAF7F2] px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-[#4B2949]"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Go to allowed page
              </Link>
            </div>
          )}
        </AdminAccessProvider>
      </main>
    </div>
  );
}
