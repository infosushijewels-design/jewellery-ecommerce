"use client";

import React, { useEffect, useState } from 'react';
import { getAllOrdersAdmin, updateOrderStatus, FullOrder } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await getAllOrdersAdmin();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: FullOrder['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`Order status successfully transitioned to ${newStatus.toUpperCase()}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.phone?.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Atelier Log</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">Fulfillment & Orders</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage dispatch schedules, update consignment progress, and inspect shipments.</p>
        </div>
        <button
          onClick={loadOrders}
          className="self-start sm:self-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#17171A] p-4 rounded-2xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search order ref, client name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider capitalize whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'all' ? 'All Orders' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#17171A] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <span className="material-symbols-outlined text-3xl animate-spin text-amber-400 mb-2">progress_activity</span>
            <p className="text-xs">Fetching consignment records...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">search_off</span>
            <p className="text-sm">No orders matching current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[11px] bg-white/[0.02]">
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Patron & Destination</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Live Status (Click to Update)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono font-semibold text-amber-300">
                      {order.order_number}
                      <span className="block text-[10px] text-gray-500 font-sans mt-0.5">
                        {order.items?.length || 1} items • {order.payment_method?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{order.shipping_address?.full_name}</div>
                      <div className="text-xs text-gray-400">{order.shipping_address?.city}, {order.shipping_address?.state}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-4 px-4 font-semibold text-white">
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4">
                      {/* Live Dropdown to change status directly */}
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                        className={`bg-[#121214] border rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider focus:outline-none cursor-pointer transition-colors ${
                          order.status === 'placed'
                            ? 'border-amber-500/40 text-amber-300'
                            : order.status === 'processing'
                            ? 'border-blue-500/40 text-blue-300'
                            : order.status === 'shipped'
                            ? 'border-purple-500/40 text-purple-300'
                            : order.status === 'delivered'
                            ? 'border-emerald-500/40 text-emerald-300'
                            : 'border-red-500/40 text-red-300'
                        }`}
                      >
                        <option value="placed" className="bg-[#17171A] text-white">Placed</option>
                        <option value="processing" className="bg-[#17171A] text-white">Processing (Atelier)</option>
                        <option value="shipped" className="bg-[#17171A] text-white">Shipped (Transit)</option>
                        <option value="delivered" className="bg-[#17171A] text-white">Delivered</option>
                        <option value="cancelled" className="bg-[#17171A] text-white">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Inspect
                      </button>
                      <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1.5 rounded-lg text-xs transition-colors inline-block"
                        title="View Public Tracking Page"
                      >
                        <span className="material-symbols-outlined text-xs">visibility</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#17171A] border border-white/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Consignment Manifest</span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Order <span className="font-mono text-amber-300">{selectedOrder.order_number}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Address */}
            <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-1 text-xs sm:text-sm">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block mb-2">Shipping Information</span>
              <p className="font-semibold text-white">{selectedOrder.shipping_address?.full_name}</p>
              <p className="text-gray-300">{selectedOrder.shipping_address?.address}</p>
              <p className="text-gray-300">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}</p>
              <p className="text-amber-400 pt-1">Tel: {selectedOrder.shipping_address?.phone || 'N/A'}</p>
              <p className="text-gray-400">Email: {selectedOrder.shipping_address?.email}</p>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold block">Ordered Pieces</span>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-[#121214] p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <h5 className="text-sm font-semibold text-white">{item.title}</h5>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} {item.metal && `• ${item.metal}`} {item.size && `• Size ${item.size}`}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-white text-sm">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials & Status */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-400">Payment: </span>
                <span className="font-semibold text-white uppercase">{selectedOrder.payment_method} ({selectedOrder.payment_status})</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-xs">Total Consignment Value</span>
                <span className="text-xl font-serif font-bold text-amber-300">₹{Number(selectedOrder.total).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-white/10 hover:bg-white/15 text-white px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
