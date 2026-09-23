"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAdminAccess } from './AdminAccessContext';
import { formatINR } from './AdminUI';

type Alert = {
  id: string;
  icon: string;
  tone: string;
  title: string;
  detail: string;
  href: string;
};

const LOW_STOCK_THRESHOLD = 5;

export default function NotificationsBell() {
  const access = useAdminAccess();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const next: Alert[] = [];

    try {
      if (access.can('orders')) {
        const { data } = await supabase
          .from('orders')
          .select('id, order_number, total, status, created_at')
          .in('status', ['placed', 'processing'])
          .order('created_at', { ascending: false })
          .limit(5);
        (data || []).forEach((o) => {
          next.push({
            id: `order-${o.id}`,
            icon: 'shopping_bag',
            tone: 'bg-amber-50 text-amber-700',
            title: `Order #${o.order_number} needs action`,
            detail: `${formatINR(o.total)} · ${o.status === 'placed' ? 'Pending' : 'Processing'}`,
            href: '/admin/orders',
          });
        });
      }

      if (access.can('products')) {
        const { data } = await supabase
          .from('products')
          .select('id, title, stock')
          .lt('stock', LOW_STOCK_THRESHOLD)
          .order('stock')
          .limit(5);
        (data || []).forEach((p) => {
          next.push({
            id: `stock-${p.id}`,
            icon: p.stock <= 0 ? 'remove_shopping_cart' : 'warning',
            tone: p.stock <= 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700',
            title: p.stock <= 0 ? `${p.title} is sold out` : `${p.title} is running low`,
            detail: `${p.stock ?? 0} left in stock`,
            href: `/admin/products/${p.id}/edit`,
          });
        });
      }

      if (access.can('inquiries')) {
        const { data } = await supabase
          .from('contact_inquiries')
          .select('id, name, created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5);
        (data || []).forEach((i) => {
          next.push({
            id: `inquiry-${i.id}`,
            icon: 'mail',
            tone: 'bg-sky-50 text-sky-700',
            title: `New enquiry from ${i.name}`,
            detail: 'Waiting for a reply',
            href: '/admin/inquiries',
          });
        });
      }

      if (access.can('reviews')) {
        const { data } = await supabase
          .from('product_reviews')
          .select('id, reviewer_name')
          .eq('status', 'pending')
          .limit(5);
        (data || []).forEach((r) => {
          next.push({
            id: `review-${r.id}`,
            icon: 'star',
            tone: 'bg-[#B99A62]/15 text-[#8A6F3C]',
            title: `Review from ${r.reviewer_name}`,
            detail: 'Awaiting moderation',
            href: '/admin/reviews',
          });
        });
      }
    } catch {
      // Tables from later migrations may not exist yet — show whatever we got
    }

    setAlerts(next);
  }, [access]);

  // Manual refresh from the panel header
  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Load once for the badge, then refresh whenever the panel is opened
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);


  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(load);
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, load]);

  const count = alerts?.length ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-[#E8D5C5]/30 transition-colors"
        title={count ? `${count} item${count === 1 ? '' : 's'} need attention` : 'Notifications'}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-[20px] text-[#2D2024]/70">notifications</span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl shadow-[0_12px_32px_rgba(45,32,36,0.14)] overflow-hidden z-50 animate-[drawerIn_0.15s_ease-out]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8D5C5]">
            <p className="text-sm font-semibold text-[#2D2024]">Needs your attention</p>
            <button
              type="button"
              onClick={refresh}
              className="p-1 rounded-full text-[#2D2024]/50 hover:text-[#2D2024] hover:bg-[#E8D5C5]/40"
              aria-label="Refresh notifications"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scroll">
            {alerts === null ? (
              <p className="px-4 py-6 text-sm text-[#2D2024]/55 text-center">Loading…</p>
            ) : alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                <p className="text-sm text-[#2D2024] mt-2">All caught up</p>
                <p className="text-xs text-[#2D2024]/55">No pending orders, low stock or new messages.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E8D5C5]/70">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Link href={a.href} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F5EEE7] transition-colors">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.tone}`}>
                        <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-[#2D2024] truncate">{a.title}</span>
                        <span className="block text-xs text-[#2D2024]/55">{a.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
