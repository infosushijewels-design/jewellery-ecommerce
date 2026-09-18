"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { useAuth } from '@/lib/context/AuthContext';
import { getUserOrders, seedDemoOrdersIfEmpty, FullOrder } from '@/lib/supabase/orderService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingRef, setTrackingRef] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        if (!user) {
          seedDemoOrdersIfEmpty();
        }
        const data = await getUserOrders(user?.id, user?.email);
        setOrders(data);
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      loadOrders();
    }
  }, [user, authLoading]);

  const handleTrackConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = trackingRef.trim();
    if (ref) {
      router.push(`/orders/${encodeURIComponent(ref)}`);
    }
  };

  const getStatusBadge = (status: FullOrder['status']) => {
    switch (status) {
      case 'placed':
        return <span className="bg-amber-100/80 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Order Placed</span>;
      case 'processing':
        return <span className="bg-blue-100/80 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Crafting / In Atelier</span>;
      case 'shipped':
        return <span className="bg-purple-100/80 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>In Insured Transit</span>;
      case 'delivered':
        return <span className="bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-100/80 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full font-medium capitalize">{status}</span>;
    }
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-8 pb-20">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant mb-1">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span>/</span>
              <span className="text-primary font-medium">My Orders</span>
            </div>
            <h1 className="text-2xl sm:text-headline-md font-headline-md text-primary">Acquisitions & Order History</h1>
            <p className="text-sm text-on-surface-variant mt-1">Review your bespoke orders and real-time delivery status.</p>
          </div>
          <Link
            href="/new-arrivals"
            className="self-start sm:self-auto bg-surface border border-outline-variant hover:border-primary text-primary px-5 py-2 rounded-full text-xs font-label-md uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <span>Explore Catalog</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Track by Order ID */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary">Track a Consignment</h2>
              <p className="text-xs text-on-surface-variant">Look up any order directly by its reference number.</p>
            </div>
          </div>
          <form onSubmit={handleTrackConsignment} className="flex-1 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={trackingRef}
              onChange={(e) => setTrackingRef(e.target.value)}
              placeholder="Enter Order Reference (e.g. SJ-849201)"
              className="flex-1 bg-surface border border-outline-variant rounded-full px-5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!trackingRef.trim()}
              className="bg-primary text-surface px-6 py-2.5 rounded-full text-xs font-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span>Track Consignment</span>
              <span className="material-symbols-outlined text-sm">local_shipping</span>
            </button>
          </form>
        </div>

        {/* Guest device banner */}
        {!authLoading && !user && (
          <div className="flex items-start sm:items-center gap-3 bg-secondary-container/40 border border-secondary/30 rounded-xl px-4 sm:px-5 py-3.5 mb-6">
            <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0">devices</span>
            <p className="text-xs sm:text-sm text-primary leading-relaxed">
              Viewing guest orders on this device.{' '}
              <Link href="/login" className="font-semibold underline underline-offset-2 hover:text-secondary">
                Sign in
              </Link>{' '}
              to sync your acquisitions across all devices.
            </p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-4xl text-tertiary animate-spin mb-3">progress_activity</span>
            <p className="text-sm text-on-surface-variant font-medium">Fetching your order history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">diamond</span>
            <h2 className="text-xl font-headline-sm text-primary mb-2">No Orders Placed Yet</h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              You have not placed any orders yet. Discover our signature collections crafted with certified diamonds and BIS 916 gold.
            </p>
            <Link
              href="/new-arrivals"
              className="inline-block bg-primary text-surface px-6 py-3 rounded-full text-xs font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors shadow-sm"
            >
              Discover Jewellery
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden hover:border-outline-variant transition-all shadow-sm"
              >
                {/* Order Card Top Bar */}
                <div className="bg-surface-container-low/60 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider">Order Reference</span>
                      <span className="font-semibold text-primary font-mono">{order.order_number}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider">Date Placed</span>
                      <span className="text-on-surface font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[11px] uppercase tracking-wider">Total Amount</span>
                      <span className="font-semibold text-tertiary font-medium">₹{Number(order.total).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link
                      href={`/orders/${order.id}`}
                      className="bg-primary text-surface px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>Track Order</span>
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                    </Link>
                  </div>
                </div>

                {/* Order Items Listing */}
                <div className="p-4 sm:p-6 divide-y divide-outline-variant/20">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-16 h-16 rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-outline">
                                <span className="material-symbols-outlined text-xl">diamond</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-primary truncate">{item.title}</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Quantity: {item.quantity} {item.metal && `• ${item.metal}`} {item.size && `• Size ${item.size}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-xs text-on-surface-variant italic">
                      Order details confirmed • Ready for shipping
                    </div>
                  )}
                </div>

                {/* Card Footer info */}
                <div className="bg-surface/50 px-4 sm:px-6 py-2.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2">
                  <span>
                    Destination: {order.shipping_address?.city || 'India'}, {order.shipping_address?.pincode}
                  </span>
                  <span className="capitalize">Payment: {order.payment_method?.toUpperCase()} ({order.payment_status})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
