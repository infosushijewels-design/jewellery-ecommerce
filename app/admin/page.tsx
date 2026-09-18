"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminStats } from '@/lib/supabase/orderService';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalOrders: number;
    productsCount: number;
    totalCustomers: number;
    pendingShipments: number;
    recentOrders: any[];
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    productsCount: 0,
    totalCustomers: 0,
    pendingShipments: 0,
    recentOrders: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-full font-medium">Placed</span>;
      case 'processing':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] px-2 py-0.5 rounded-full font-medium">In Atelier</span>;
      case 'shipped':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[11px] px-2 py-0.5 rounded-full font-medium">In Transit</span>;
      case 'delivered':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] px-2 py-0.5 rounded-full font-medium">Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] px-2 py-0.5 rounded-full font-medium">Cancelled</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/30 text-[11px] px-2 py-0.5 rounded-full capitalize">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Concierge Overview</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">Business Intelligence</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Real-time metrics, acquisitions volume, and atelier fulfillment stats.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="bg-amber-400 text-black hover:bg-amber-300 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Jewellery</span>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">list_alt</span>
            <span>All Orders</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Revenue */}
        <div className="bg-[#17171A] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Acquisitions</span>
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            Gross Store Sales
          </p>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-[#17171A] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center border border-blue-400/20">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {stats.totalOrders}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Completed & In Progress
          </p>
        </div>

        {/* Card 3: Pending Shipments */}
        <div className="bg-[#17171A] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Atelier Fulfillments</span>
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 text-purple-400 flex items-center justify-center border border-purple-400/20">
              <span className="material-symbols-outlined text-xl">local_shipping</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {stats.pendingShipments}
          </div>
          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            Awaiting Final Delivery
          </p>
        </div>

        {/* Card 4: Catalog Products */}
        <div className="bg-[#17171A] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Jewellery Catalog</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center border border-emerald-400/20">
              <span className="material-symbols-outlined text-xl">diamond</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {stats.productsCount} Pieces
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Active in Online Boutique
          </p>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#17171A] border border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-white tracking-wide">Recent Patron Orders</h2>
            <p className="text-xs text-gray-400">Latest acquisitions requiring packing and dispatch verification.</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1"
          >
            <span>View All Orders</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            <span className="material-symbols-outlined text-3xl animate-spin text-amber-400 mb-2">progress_activity</span>
            <p className="text-xs">Loading orders manifest...</p>
          </div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">inbox</span>
            <p className="text-sm">No orders recorded yet. Place an order on the store to see live data!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      {order.shipping_address?.full_name || 'Client'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {order.shipping_address?.city || 'India'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
