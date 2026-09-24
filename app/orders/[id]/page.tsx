"use client";

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { getOrderById, FullOrder } from '@/lib/supabase/orderService';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<FullOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setLoading(true);
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  // Stepper calculations
  const steps = [
    { key: 'placed', label: 'Order Placed', desc: 'Order received & verified', icon: 'task_alt' },
    { key: 'processing', label: 'In Atelier', desc: 'Crafting & hallmarking check', icon: 'auto_awesome' },
    { key: 'shipped', label: 'Insured Transit', desc: 'Dispatched with armed courier', icon: 'local_shipping' },
    { key: 'delivered', label: 'Delivered', desc: 'Safely delivered to patron', icon: 'verified' },
  ];

  const getStepIndex = (status: FullOrder['status']) => {
    switch (status) {
      case 'placed': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStepIndex = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'cancelled';

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-8 pb-24">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/orders" className="hover:text-primary">My Orders</Link>
          <span>/</span>
          <span className="text-primary font-medium">Tracking</span>
        </div>

        {loading ? (
          <div className="py-28 text-center">
            <span className="material-symbols-outlined text-4xl text-tertiary animate-spin mb-3">progress_activity</span>
            <p className="text-sm text-on-surface-variant font-medium">Loading tracking data...</p>
          </div>
        ) : !order ? (
          <div className="py-20 text-center max-w-md mx-auto bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">search_off</span>
            <h2 className="text-xl font-headline-sm text-primary mb-2">Order Not Found</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              We couldn&apos;t locate an order with the reference &ldquo;{orderId}&rdquo;. Please check your order reference number.
            </p>
            <Link
              href="/orders"
              className="inline-block bg-primary text-surface px-6 py-2.5 rounded-full text-xs font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors"
            >
              Back to My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Top Success / Header Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
                    <span className="text-xs uppercase tracking-widest text-tertiary font-semibold">Live Consignment Tracking</span>
                  </div>
                  <h1 className="text-2xl sm:text-headline-md font-headline-md text-primary">
                    Order Reference: <span className="font-mono text-tertiary">{order.order_number}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/orders"
                    className="bg-surface border border-outline-variant hover:border-primary text-primary px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-colors"
                  >
                    All Orders
                  </Link>
                </div>
              </div>

              {/* Order Status Stepper */}
              {isCancelled ? (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-5 text-center my-4">
                  <span className="material-symbols-outlined text-3xl text-red-600 mb-2">cancel</span>
                  <h3 className="text-base font-semibold text-red-800 dark:text-red-300">This order has been cancelled</h3>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    If any payment was debited, a full refund will be processed to your source account within 3-5 business days.
                  </p>
                </div>
              ) : (
                <div className="py-6 sm:py-8">
                  <div className="relative">
                    {/* Connecting line segments with clean 8px gap between circle edges */}
                    <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
                      {steps.slice(0, -1).map((_, idx) => {
                        const isSegmentDone = idx < currentStepIndex;
                        const leftPercent = ((idx + 0.5) / steps.length) * 100;
                        const colWidthPercent = 100 / steps.length;
                        return (
                          <div
                            key={idx}
                            className={`absolute top-6 h-0.5 -translate-y-1/2 transition-colors duration-500 ${
                              isSegmentDone ? 'bg-primary' : 'bg-outline-variant/40'
                            }`}
                            style={{
                              left: `calc(${leftPercent}% + 32px)`,
                              width: `calc(${colWidthPercent}% - 64px)`,
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Step Nodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
                      {steps.map((step, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-md ${
                                isDone 
                                  ? 'bg-primary text-surface ring-4 ring-tertiary/20' 
                                  : 'bg-surface border-2 border-outline-variant text-on-surface-variant'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xl">{step.icon}</span>
                            </div>
                            <div className="sm:mt-2">
                              <h4 className={`text-sm font-semibold ${isCurrent ? 'text-tertiary' : isDone ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {step.label}
                              </h4>
                              <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Two-Column Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Items */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <h3 className="text-title-md font-title-lg text-primary uppercase tracking-wider mb-4 border-b border-outline-variant/30 pb-3">
                    Consignment Manifest ({order.items?.length || 0} Items)
                  </h3>

                  <div className="divide-y divide-outline-variant/20">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-20 h-20 rounded-xl bg-surface-container-low border border-outline-variant/30 overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-outline">
                                  <span className="material-symbols-outlined text-2xl">diamond</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-primary truncate">{item.title}</h4>
                              <div className="flex flex-wrap gap-2 mt-1 text-xs text-on-surface-variant">
                                {item.metal && <span className="bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/40">{item.metal}</span>}
                                {item.size && <span className="bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/40">Size: {item.size}</span>}
                                <span>Qty: {item.quantity}</span>
                              </div>
                              <p className="text-xs text-tertiary mt-1.5 flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[13px]">verified</span>
                                BIS 916 Hallmarked Certified
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm sm:text-base font-bold text-primary">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant italic py-4">Manifest details archived.</p>
                    )}
                  </div>
                </div>

                {/* Concierge Help Card */}
                <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">support_agent</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-primary">Dedicated Jewellery Concierge</h4>
                      <p className="text-xs text-on-surface-variant">Need assistance with this consignment or special instructions?</p>
                    </div>
                  </div>
                  <a
                    href="mailto:concierge@sushijewels.com"
                    className="bg-surface border border-outline-variant hover:border-primary text-primary px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors self-end sm:self-auto"
                  >
                    Contact Atelier
                  </a>
                </div>
              </div>

              {/* Right Column: Address & Payment Breakdown */}
              <div className="lg:col-span-4 space-y-6">
                {/* Shipping Destination */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <h3 className="text-title-md font-title-lg text-primary uppercase tracking-wider mb-3 border-b border-outline-variant/30 pb-2">
                    Delivery Address
                  </h3>
                  <div className="text-xs sm:text-sm text-on-surface-variant space-y-1.5">
                    <p className="font-semibold text-primary text-sm">{order.shipping_address?.full_name}</p>
                    <p>{order.shipping_address?.address}</p>
                    <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                    <p className="pt-2 text-xs flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      {order.shipping_address?.phone || 'Contact on file'}
                    </p>
                    <p className="text-xs flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-[14px]">mail</span>
                      {order.shipping_address?.email}
                    </p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <h3 className="text-title-md font-title-lg text-primary uppercase tracking-wider mb-4 border-b border-outline-variant/30 pb-2">
                    Payment Summary
                  </h3>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Subtotal</span>
                      <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>GST</span>
                      <span>₹{Number(order.tax).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Insured Transit</span>
                      <span className={Number(order.shipping_fee) === 0 ? 'text-tertiary font-medium' : ''}>
                        {Number(order.shipping_fee) === 0 ? 'COMPLIMENTARY' : `₹${order.shipping_fee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-primary border-t border-outline-variant/30 pt-3">
                      <span>Total Paid/Payable</span>
                      <span>₹{Number(order.total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Payment Method:</span>
                      <span className="font-semibold text-primary uppercase">{order.payment_method} ({order.payment_status})</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
