"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAllOrdersAdmin, updateOrderPaymentStatus, updateOrderStatus, FullOrder } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { printOrderInvoice } from '@/lib/utils/printInvoice';
import OrderDetailsDrawer, { ORDER_STATUS_STYLES, orderStatusLabel, paymentLabel } from '@/components/admin/OrderDetailsDrawer';
import {
  CHEVRON_BG,
  EmptyState,
  FilterPills,
  IconButton,
  LoadingState,
  PageHeader,
  Pagination,
  SearchInput,
  SecondaryButton,
  SelectFilter,
  StatTile,
  TableCard,
  formatDateTime,
  formatINR,
  getInitials,
} from '@/components/admin/AdminUI';

type PaymentStatus = FullOrder['payment_status'];
type StatusTab = 'all' | PaymentStatus;

const PAGE_SIZE = 10;

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
];

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  pending: 'bg-amber-50 border-amber-200 text-amber-800',
  failed: 'bg-red-50 border-red-200 text-red-700',
};

const METHOD_OPTIONS = [
  { value: 'all', label: 'All methods' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'online', label: 'Online' },
];

const RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

function exportPaymentsCsv(orders: FullOrder[]) {
  const header = ['Order Number', 'Date', 'Customer', 'Email', 'Method', 'Amount', 'Payment Status', 'Order Status'];
  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toISOString(),
    o.shipping_address?.full_name || '',
    o.shipping_address?.email || '',
    paymentLabel(o.payment_method),
    String(o.total),
    o.payment_status,
    orderStatusLabel(o.status),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setOrders(await getAllOrdersAdmin());
      if (isRefresh) showToast('Payments refreshed', 'success');
    } catch (err) {
      console.error('Error fetching payments:', err);
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handlePaymentStatus = async (order: FullOrder, next: PaymentStatus) => {
    setUpdatingId(order.id);
    try {
      await updateOrderPaymentStatus(order.id, next);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, payment_status: next } : o)));
      showToast(`Payment for #${order.order_number} marked ${next}`, 'success');
    } catch {
      showToast('Failed to update payment status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOrderStatus = async (orderId: string, status: FullOrder['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      showToast(`Order status updated to ${orderStatusLabel(status)}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'cancelled');
    const sum = (list: FullOrder[]) => list.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const paid = live.filter((o) => o.payment_status === 'paid');
    return {
      collected: sum(paid),
      paidCount: paid.length,
      pending: sum(live.filter((o) => o.payment_status === 'pending')),
      codPending: live.filter((o) => o.payment_status === 'pending' && o.payment_method === 'cod').length,
      failed: orders.filter((o) => o.payment_status === 'failed').length,
      online: live.filter((o) => o.payment_method === 'online').length,
      total: live.length,
    };
  }, [orders]);

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      map[o.payment_status] = (map[o.payment_status] || 0) + 1;
    });
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cutoff = rangeFilter === 'all' ? 0 : Date.now() - Number(rangeFilter) * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const addr = o.shipping_address;
      const matchesSearch =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        addr?.email?.toLowerCase().includes(q) ||
        addr?.full_name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || o.payment_status === statusFilter;
      const matchesMethod = methodFilter === 'all' || o.payment_method === methodFilter;
      const matchesRange = !cutoff || new Date(o.created_at).getTime() >= cutoff;
      return matchesSearch && matchesStatus && matchesMethod && matchesRange;
    });
  }, [orders, searchQuery, statusFilter, methodFilter, rangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const filteredTotal = filtered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const selectedOrder = orders.find((o) => o.id === selectedId) || null;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Finance"
        title="Payments History"
        subtitle="Every transaction across online and cash-on-delivery orders."
        actions={
          <>
            <SecondaryButton icon="download" onClick={() => exportPaymentsCsv(filtered)} disabled={loading || filtered.length === 0}>
              Export CSV
            </SecondaryButton>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadOrders(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="account_balance_wallet" value={formatINR(stats.collected)} label={`Collected · ${stats.paidCount} paid`} tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="hourglass_top" value={formatINR(stats.pending)} label={`Pending · ${stats.codPending} COD awaiting`} tone="bg-amber-100 text-amber-700" />
        <StatTile icon="credit_card" value={`${stats.online} / ${stats.total}`} label="Online payments" tone="bg-indigo-100 text-indigo-700" />
        <StatTile icon="error" value={stats.failed} label="Failed payments" tone="bg-red-100 text-red-600" />
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput value={searchQuery} onChange={resetPage(setSearchQuery)} placeholder="Search by order number or customer..." />
          <SelectFilter value={methodFilter} onChange={resetPage(setMethodFilter)} options={METHOD_OPTIONS} ariaLabel="Filter by payment method" />
          <SelectFilter value={rangeFilter} onChange={resetPage(setRangeFilter)} options={RANGE_OPTIONS} ariaLabel="Filter by date range" />
        </div>
        <FilterPills tabs={STATUS_TABS} active={statusFilter} counts={tabCounts} onChange={resetPage(setStatusFilter)} />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading transactions..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="receipt_long" title="No transactions match the current filters." />
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8D5C5] bg-[#F5EEE7]/40 text-sm">
              <span className="text-[#2D2024]/65">{filtered.length} transactions</span>
              <span className="text-[#2D2024]">
                Total: <strong className="tabular-nums">{formatINR(filteredTotal)}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Order</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <button onClick={() => setSelectedId(o.id)} className="font-semibold text-[#8A6F3C] hover:text-[#4B2949] hover:underline underline-offset-2">
                          #{o.order_number}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {getInitials(o.shipping_address?.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[#2D2024] font-medium truncate max-w-[200px]">{o.shipping_address?.full_name || 'Guest'}</div>
                            <div className="text-xs text-[#2D2024]/55 truncate max-w-[200px]">{o.shipping_address?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#2D2024]/75 bg-[#F5EEE7] border border-[#E8D5C5] px-2.5 py-1 rounded-md whitespace-nowrap">
                          <span className="material-symbols-outlined text-sm">{o.payment_method === 'cod' ? 'payments' : 'credit_card'}</span>
                          {paymentLabel(o.payment_method)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#2D2024] tabular-nums whitespace-nowrap">{formatINR(o.total)}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={o.payment_status}
                          disabled={updatingId === o.id}
                          onChange={(e) => handlePaymentStatus(o, e.target.value as PaymentStatus)}
                          aria-label={`Payment status for order ${o.order_number}`}
                          className={`rounded-full min-w-[110px] pl-3.5 pr-8 py-1.5 text-xs font-semibold border capitalize focus:outline-none cursor-pointer appearance-none disabled:opacity-60 ${PAYMENT_STATUS_STYLES[o.payment_status]}`}
                          style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                        >
                          {PAYMENT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[o.status]}`}>
                          {orderStatusLabel(o.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5">
                          <IconButton icon="visibility" title="View order" onClick={() => setSelectedId(o.id)} />
                          <IconButton
                            icon="print"
                            title="Print invoice"
                            onClick={() => {
                              if (!printOrderInvoice(o)) showToast('Allow pop-ups to print the invoice', 'error');
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} noun="transactions" />
          </>
        )}
      </TableCard>

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleOrderStatus}
        updating={!!selectedOrder && updatingId === selectedOrder.id}
      />
    </div>
  );
}
