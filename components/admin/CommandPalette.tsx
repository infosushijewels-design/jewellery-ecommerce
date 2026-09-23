"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatINR } from './AdminUI';

export interface PaletteLink {
  href: string;
  label: string;
  icon: string;
  section: string;
}

type Item = { id: string; label: string; sub?: string; icon: string; group: string; href: string };

type Data = {
  orders: { id: string; order_number: string; total: number; status: string }[];
  products: { id: string; title: string; sku: string | null }[];
  customers: { email: string; full_name: string | null }[];
};

const EMPTY: Data = { orders: [], products: [], customers: [] };

/** Loaded once per session, the first time the palette opens. */
let dataPromise: Promise<Data> | null = null;
function loadData(): Promise<Data> {
  if (!dataPromise) {
    const supabase = createClient();
    dataPromise = Promise.all([
      supabase.from('orders').select('id, order_number, total, status').order('created_at', { ascending: false }).limit(200),
      supabase.from('products').select('id, title, sku').order('created_at', { ascending: false }).limit(300),
      supabase.from('profiles').select('email, full_name').limit(200),
    ])
      .then(([o, p, c]) => ({ orders: o.data || [], products: p.data || [], customers: c.data || [] }))
      .catch(() => {
        dataPromise = null;
        return EMPTY;
      });
  }
  return dataPromise;
}

export default function CommandPalette({
  onClose,
  links,
  canViewOrders,
  canViewProducts,
  canViewCustomers,
}: {
  onClose: () => void;
  links: PaletteLink[];
  canViewOrders: boolean;
  canViewProducts: boolean;
  canViewCustomers: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [data, setData] = useState<Data | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData().then(setData);
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, []);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const pages: Item[] = links
      .filter((l) => !q || l.label.toLowerCase().includes(q) || l.section.toLowerCase().includes(q))
      .map((l) => ({ id: `page-${l.href}`, label: l.label, sub: l.section, icon: l.icon, group: 'Pages', href: l.href }));

    if (!q || !data) return pages.slice(0, 8);

    const orders: Item[] = canViewOrders
      ? data.orders
          .filter((o) => o.order_number?.toLowerCase().includes(q))
          .slice(0, 5)
          .map((o) => ({
            id: `order-${o.id}`,
            label: `#${o.order_number}`,
            sub: `${formatINR(o.total)} · ${o.status}`,
            icon: 'shopping_bag',
            group: 'Orders',
            href: `/admin/orders?focus=${encodeURIComponent(o.order_number)}`,
          }))
      : [];

    const products: Item[] = canViewProducts
      ? data.products
          .filter((p) => p.title.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
          .slice(0, 5)
          .map((p) => ({
            id: `product-${p.id}`,
            label: p.title,
            sub: p.sku || 'Edit product',
            icon: 'diamond',
            group: 'Products',
            href: `/admin/products/${p.id}/edit`,
          }))
      : [];

    const customers: Item[] = canViewCustomers
      ? data.customers
          .filter((c) => c.email.toLowerCase().includes(q) || (c.full_name || '').toLowerCase().includes(q))
          .slice(0, 4)
          .map((c) => ({
            id: `customer-${c.email}`,
            label: c.full_name || c.email.split('@')[0],
            sub: c.email,
            icon: 'group',
            group: 'Customers',
            href: `/admin/customers?q=${encodeURIComponent(c.email)}`,
          }))
      : [];

    return [...pages.slice(0, 4), ...orders, ...products, ...customers];
  }, [query, data, links, canViewOrders, canViewProducts, canViewCustomers]);

  // Keep the highlight inside the current result list
  const activeIndex = items.length ? Math.min(active, items.length - 1) : 0;

  const go = (item?: Item) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search admin">
      <div className="absolute inset-0 bg-[#2D2024]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl shadow-[0_24px_60px_rgba(45,32,36,0.2)] overflow-hidden animate-[drawerIn_0.15s_ease-out]">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E8D5C5]">
          <span className="material-symbols-outlined text-[#8A6F3C]">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive(items.length ? (activeIndex + 1) % items.length : 0);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive(items.length ? (activeIndex - 1 + items.length) % items.length : 0);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                go(items[activeIndex]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Search pages, orders, products, customers…"
            className="flex-1 bg-transparent text-sm text-[#2D2024] placeholder:text-[#2D2024]/40 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-[#2D2024]/45 border border-[#E8D5C5] rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto custom-scroll py-1.5">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#2D2024]/55 text-center">
              {data ? `No matches for “${query.trim()}”` : 'Loading…'}
            </p>
          ) : (
            items.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {showGroup && (
                    <p className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-widest text-[#2D2024]/45 font-semibold">{item.group}</p>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      activeIndex === i ? 'bg-[#B99A62]/12' : 'hover:bg-[#F5EEE7]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#8A6F3C]">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-[#2D2024] truncate">{item.label}</span>
                      {item.sub && <span className="block text-xs text-[#2D2024]/55 truncate">{item.sub}</span>}
                    </span>
                    {activeIndex === i && <span className="material-symbols-outlined text-[16px] text-[#2D2024]/35">keyboard_return</span>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
