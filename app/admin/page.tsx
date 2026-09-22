"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminDashboardOverview, DashboardOverview } from '@/lib/supabase/orderService';
import SalesAreaChart from '@/components/admin/SalesAreaChart';
import CategoryDonutChart from '@/components/admin/CategoryDonutChart';

const EMPTY_OVERVIEW: DashboardOverview = {
  totalRevenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
  revenueChangePct: 0,
  ordersChangePct: 0,
  customersChangePct: 0,
  productsChangePct: 0,
  monthlySales: [],
  recentOrders: [],
  topSellingProducts: [],
  lowStockProducts: [],
  categorySales: [],
};

function ChangeIndicator({ pct }: { pct: number }) {
  const isUp = pct >= 0;
  return (
    <p className={`font-label-sm text-label-sm mt-2 flex items-center gap-1 ${isUp ? 'text-emerald-700' : 'text-red-600'}`}>
      <span className="material-symbols-outlined text-sm">{isUp ? 'trending_up' : 'trending_down'}</span>
      {isUp ? '+' : ''}{pct}% vs last month
    </p>
  );
}

function StatCard({
  label,
  value,
  icon,
  changePct,
}: {
  label: string;
  value: string;
  icon: string;
  changePct: number;
}) {
  return (
    <div className="bg-[#F5EEE7] border border-[#E8D5C5] rounded p-6 shadow-[0_2px_10px_rgba(45,32,36,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-[#2D2024]/60">{label}</span>
        <div className="w-10 h-10 rounded-full bg-[#B99A62]/15 text-[#B99A62] flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
      <div className="font-headline-sm text-2xl sm:text-3xl text-[#2D2024]">{value}</div>
      <ChangeIndicator pct={changePct} />
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'delivered':
      return <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Delivered</span>;
    case 'placed':
      return <span className="bg-[#B99A62]/15 text-[#8a6d3f] border border-[#B99A62]/40 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Pending</span>;
    case 'processing':
      return <span className="bg-[#4B2949]/10 text-[#4B2949] border border-[#4B2949]/25 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Processing</span>;
    case 'shipped':
      return <span className="bg-[#4B2949]/10 text-[#4B2949] border border-[#4B2949]/25 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Shipped</span>;
    case 'cancelled':
      return <span className="bg-red-100 text-red-700 border border-red-300 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">Cancelled</span>;
    default:
      return <span className="bg-[#2D2024]/5 text-[#2D2024]/60 border border-[#E8D5C5] text-[11px] px-2.5 py-0.5 rounded-full capitalize font-semibold">{status}</span>;
  }
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await getAdminDashboardOverview();
        setOverview(data);
      } catch (err) {
        console.error('Error fetching admin dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8D5C5] pb-6">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#2D2024]">Welcome back, Admin</h1>
          <p className="font-body-sm text-body-sm text-[#2D2024]/60 mt-1">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] px-4 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Add Jewellery</span>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-[#F5EEE7] hover:bg-[#E8D5C5]/50 border border-[#E8D5C5] text-[#2D2024] px-4 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">list_alt</span>
            <span>All Orders</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Sales"
          value={`₹${overview.totalRevenue.toLocaleString('en-IN')}`}
          icon="payments"
          changePct={overview.revenueChangePct}
        />
        <StatCard
          label="Total Orders"
          value={String(overview.totalOrders)}
          icon="receipt_long"
          changePct={overview.ordersChangePct}
        />
        <StatCard
          label="Total Customers"
          value={String(overview.totalCustomers)}
          icon="group"
          changePct={overview.customersChangePct}
        />
        <StatCard
          label="Total Products"
          value={String(overview.totalProducts)}
          icon="diamond"
          changePct={overview.productsChangePct}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Chart */}
        <div className="lg:col-span-2 bg-[#F5EEE7] border border-[#E8D5C5] rounded p-6 shadow-[0_2px_10px_rgba(45,32,36,0.06)]">
          <div className="mb-4">
            <h2 className="font-headline-sm text-lg text-[#2D2024]">Sales Overview</h2>
            <p className="font-body-sm text-body-sm text-[#2D2024]/60">Monthly revenue trend, last 6 months.</p>
          </div>
          {loading ? (
            <div className="py-16 text-center text-[#2D2024]/50">
              <span className="material-symbols-outlined text-3xl animate-spin text-[#B99A62] mb-2">progress_activity</span>
            </div>
          ) : (
            <SalesAreaChart data={overview.monthlySales} />
          )}
        </div>
  
        {/* Category Sales Donut */}
        <div className="bg-[#F5EEE7] border border-[#E8D5C5] rounded p-6 shadow-[0_2px_10px_rgba(45,32,36,0.06)]">
          <div className="mb-5">
            <h2 className="font-headline-sm text-lg text-[#2D2024]">Category Sales</h2>
            <p className="font-body-sm text-body-sm text-[#2D2024]/60">Revenue share by category.</p>
          </div>
          {loading ? (
            <div className="py-16 text-center text-[#2D2024]/50">
              <span className="material-symbols-outlined text-3xl animate-spin text-[#B99A62] mb-2">progress_activity</span>
            </div>
          ) : (
            <CategoryDonutChart data={overview.categorySales} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#F5EEE7] border border-[#E8D5C5] rounded p-6 shadow-[0_2px_10px_rgba(45,32,36,0.06)]">
          <div className="flex items-center justify-between border-b border-[#E8D5C5] pb-4 mb-4">
            <div>
              <h2 className="font-headline-sm text-lg text-[#2D2024]">Recent Orders</h2>
              <p className="font-body-sm text-body-sm text-[#2D2024]/60">Latest orders requiring attention.</p>
            </div>
            <Link
              href="/admin/orders"
              className="font-label-sm text-label-sm text-[#B99A62] hover:text-[#8a6d3f] uppercase tracking-wider flex items-center gap-1 flex-shrink-0"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-[#2D2024]/50">
              <span className="material-symbols-outlined text-3xl animate-spin text-[#B99A62] mb-2">progress_activity</span>
              <p className="font-body-sm text-body-sm">Loading orders...</p>
            </div>
          ) : overview.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-[#2D2024]/50">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#2D2024]/30">inbox</span>
              <p className="font-body-sm text-body-sm">No orders recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E8D5C5] text-[#2D2024]/50 font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/60">
                  {overview.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-semibold text-[#8a6d3f]">
                        {order.order_number}
                      </td>
                      <td className="py-3.5 px-3 text-[#2D2024]">
                        {order.shipping_address?.full_name || 'Client'}
                      </td>
                      <td className="py-3.5 px-3 text-[#2D2024]/70 max-w-[140px] truncate">
                        {order.items?.[0]?.title || '—'}
                        {order.items && order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#2D2024]">
                        ₹{Number(order.total).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#F5EEE7] border border-[#E8D5C5] rounded p-6 shadow-[0_2px_10px_rgba(45,32,36,0.06)]">
          <div className="border-b border-[#E8D5C5] pb-4 mb-4">
            <h2 className="font-headline-sm text-lg text-[#2D2024]">Low Stock Alerts</h2>
            <p className="font-body-sm text-body-sm text-[#2D2024]/60">Pieces with fewer than 5 in stock.</p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#2D2024]/50">
              <span className="material-symbols-outlined text-2xl animate-spin text-[#B99A62]">progress_activity</span>
            </div>
          ) : overview.lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-[#2D2024]/50">
              <span className="material-symbols-outlined text-3xl mb-2 text-emerald-600">check_circle</span>
              <p className="font-body-sm text-body-sm">All stock levels are healthy.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {overview.lowStockProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 bg-[#FAF7F2] border border-[#E8D5C5] rounded px-3.5 py-2.5"
                >
                  <span className="font-body-sm text-body-sm text-[#2D2024] truncate">{p.title}</span>
                  <span
                    className={`flex-shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                      p.stock <= 0
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-[#B99A62]/15 text-[#8a6d3f] border border-[#B99A62]/40'
                    }`}
                  >
                    {p.stock <= 0 ? 'Sold Out' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-[#F5EEE7] border border-[#E8D5C5] rounded p-6 shadow-[0_2px_10px_rgba(45,32,36,0.06)]">
        <div className="border-b border-[#E8D5C5] pb-4 mb-4">
          <h2 className="font-headline-sm text-lg text-[#2D2024]">Top Selling Products</h2>
          <p className="font-body-sm text-body-sm text-[#2D2024]/60">Best performers by units sold.</p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#2D2024]/50">
            <span className="material-symbols-outlined text-2xl animate-spin text-[#B99A62]">progress_activity</span>
          </div>
        ) : overview.topSellingProducts.length === 0 ? (
          <div className="py-8 text-center text-[#2D2024]/50">
            <span className="material-symbols-outlined text-3xl mb-2 text-[#2D2024]/30">sell</span>
            <p className="font-body-sm text-body-sm">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {overview.topSellingProducts.map((p) => (
              <div key={p.id} className="bg-[#FAF7F2] border border-[#E8D5C5] rounded p-3">
                <div className="w-full aspect-square rounded bg-[#E8D5C5]/40 overflow-hidden mb-2.5">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#B99A62]">
                      <span className="material-symbols-outlined text-2xl">diamond</span>
                    </div>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-[#2D2024] leading-snug line-clamp-2">{p.title}</p>
                <p className="font-label-sm text-label-sm text-[#B99A62] uppercase tracking-wider mt-1.5">
                  {p.unitsSold} sold
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
