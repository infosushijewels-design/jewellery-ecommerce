"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAllOrdersAdmin, updateOrderPaymentStatus, updateOrderStatus, FullOrder } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { printOrderInvoice } from '@/lib/utils/printInvoice';
import OrderDetailsDrawer, {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_STYLES,
  orderStatusLabel,
  orderWhatsappMessage,
  paymentLabel,
} from '@/components/admin/OrderDetailsDrawer';
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
  whatsappLink,
} from '@/components/admin/AdminUI';

type OrderStatus = FullOrder['status'];
type StatusTab = 'all' | OrderStatus;

const PAGE_SIZE = 10;

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  ...ORDER_STATUS_OPTIONS.map((o) => ({ key: o.value as StatusTab, label: o.label })),
];

type PaymentStatus = FullOrder['payment_status'];

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

const PAYMENT_STATUS_FILTERS = [
  { value: 'all', label: 'All payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Payment pending' },
  { value: 'failed', label: 'Payment failed' },
];

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All payments' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'online', label: 'Online' },
];

function itemCount(order: FullOrder) {
  return (order.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0) || order.items?.length || 0;
}

function exportOrdersCsv(orders: FullOrder[]) {
  const header = ['Order Number', 'Date', 'Customer', 'Email', 'Phone', 'City', 'State', 'Items', 'Amount', 'Payment Method', 'Payment Status', 'Order Status'];
  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toISOString(),
    o.shipping_address?.full_name || '',
    o.shipping_address?.email || '',
    o.shipping_address?.phone || '',
    o.shipping_address?.city || '',
    o.shipping_address?.state || '',
    String(itemCount(o)),
    String(o.total),
    paymentLabel(o.payment_method),
    o.payment_status,
    orderStatusLabel(o.status),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAllOrdersAdmin();
      setOrders(data);
      if (isRefresh) showToast('Orders refreshed', 'success');
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      if (isRefresh) showToast('Failed to refresh orders', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      showToast(`Order status updated to ${orderStatusLabel(newStatus)}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (order: FullOrder, next: PaymentStatus) => {
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

  const selectedOrder = orders.find((o) => o.id === selectedId) || null;

  const stats = useMemo(() => {
    const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
    const live = orders.filter((o) => o.status !== 'cancelled');
    const sum = (list: FullOrder[]) => list.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const paid = live.filter((o) => o.payment_status === 'paid');
    const codPending = live.filter((o) => o.payment_status === 'pending' && o.payment_method === 'cod');
    return {
      total: orders.length,
      pending: count('placed') + count('processing'),
      shipped: count('shipped'),
      delivered: count('delivered'),
      collected: sum(paid),
      paidCount: paid.length,
      codPending: sum(codPending),
      codPendingCount: codPending.length,
      failedCount: orders.filter((o) => o.payment_status === 'failed').length,
    };
  }, [orders]);

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const addr = order.shipping_address;
      const matchesSearch =
        !q ||
        order.order_number?.toLowerCase().includes(q) ||
        addr?.email?.toLowerCase().includes(q) ||
        addr?.full_name?.toLowerCase().includes(q) ||
        addr?.phone?.includes(q);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
      return matchesSearch && matchesStatus && matchesPayment && matchesPaymentStatus;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, paymentStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageOrders = filteredOrders.slice(pageStart, pageStart + PAGE_SIZE);

  const handlePrint = (order: FullOrder) => {
    if (!printOrderInvoice(order)) showToast('Allow pop-ups to print the invoice', 'error');
  };

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Atelier Log"
        title="Orders"
        subtitle="Track and manage all your orders."
        actions={
          <>
            <SecondaryButton
              icon="download"
              onClick={() => exportOrdersCsv(filteredOrders)}
              disabled={loading || filteredOrders.length === 0}
            >
              Export CSV
            </SecondaryButton>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadOrders(true)} disabled={refreshing || loading}>
              {refreshing ? 'Refreshing…' : 'Refresh Orders'}
            </SecondaryButton>
          </>
        }
      />

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="shopping_cart" value={stats.total} label="Total Orders" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="schedule" value={stats.pending} label="Pending" tone="bg-amber-100 text-amber-700" />
        <StatTile icon="local_shipping" value={stats.shipped} label="Shipped" tone="bg-indigo-100 text-indigo-700" />
        <StatTile icon="check_circle" value={stats.delivered} label="Delivered" tone="bg-emerald-100 text-emerald-700" />
      </div>

      {/* Payment reconciliation at a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <StatTile
          icon="account_balance_wallet"
          value={formatINR(stats.collected)}
          label={`Revenue collected · ${stats.paidCount} paid`}
          tone="bg-emerald-100 text-emerald-700"
        />
        <StatTile
          icon="hourglass_top"
          value={formatINR(stats.codPending)}
          label={`Pending COD · ${stats.codPendingCount} order${stats.codPendingCount === 1 ? '' : 's'}`}
          tone="bg-amber-100 text-amber-700"
        />
        <StatTile icon="error" value={stats.failedCount} label="Failed payments" tone="bg-red-100 text-red-600" />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search by order number or customer email..."
          />
          <SelectFilter
            value={paymentFilter}
            onChange={(v) => {
              setPaymentFilter(v);
              setPage(1);
            }}
            options={PAYMENT_OPTIONS}
            ariaLabel="Filter by payment method"
          />
          <SelectFilter
            value={paymentStatusFilter}
            onChange={(v) => {
              setPaymentStatusFilter(v);
              setPage(1);
            }}
            options={PAYMENT_STATUS_FILTERS}
            ariaLabel="Filter by payment status"
          />
        </div>
        <FilterPills
          tabs={STATUS_TABS}
          active={statusFilter}
          counts={tabCounts}
          onChange={(key) => {
            setStatusFilter(key);
            setPage(1);
          }}
        />
      </div>

      {/* Orders Table */}
      <TableCard>
        {loading ? (
          <LoadingState label="Fetching orders..." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState icon="search_off" title="No orders match the current search or filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Order Number</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageOrders.map((order) => {
                    const addr = order.shipping_address;
                    const qty = itemCount(order);
                    const wa = whatsappLink(addr?.phone, orderWhatsappMessage(order));
                    return (
                      <tr key={order.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-4 px-5">
                          <button
                            onClick={() => setSelectedId(order.id)}
                            className="font-semibold text-[#8A6F3C] hover:text-[#4B2949] hover:underline underline-offset-2"
                          >
                            #{order.order_number}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(addr?.full_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[#2D2024] font-medium truncate max-w-[200px]">{addr?.full_name || 'Guest'}</div>
                              <div className="text-xs text-[#2D2024]/55 truncate max-w-[200px]">{addr?.email || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[#2D2024]/80 whitespace-nowrap">
                          {qty} {qty === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#2D2024] whitespace-nowrap tabular-nums">
                          {formatINR(order.total)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#2D2024]/75 bg-[#F5EEE7] border border-[#E8D5C5] px-2.5 py-1 rounded-md whitespace-nowrap">
                              <span className="material-symbols-outlined text-sm">
                                {order.payment_method === 'cod' ? 'payments' : 'credit_card'}
                              </span>
                              {order.payment_method === 'cod' ? 'COD' : 'Online'}
                            </span>
                            <select
                              value={order.payment_status}
                              disabled={updatingId === order.id}
                              onChange={(e) => handlePaymentStatusChange(order, e.target.value as PaymentStatus)}
                              aria-label={`Payment status for order ${order.order_number}`}
                              className={`rounded-full min-w-[105px] pl-3 pr-7 py-1 text-[11px] font-semibold border capitalize focus:outline-none cursor-pointer appearance-none disabled:opacity-60 ${PAYMENT_STATUS_STYLES[order.payment_status]}`}
                              style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                            >
                              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            aria-label={`Update status for order ${order.order_number}`}
                            className={`rounded-full min-w-[130px] pl-3.5 pr-8 py-1.5 text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-[#B99A62]/30 cursor-pointer appearance-none transition-colors disabled:opacity-60 ${ORDER_STATUS_STYLES[order.status]}`}
                            style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                          >
                            {ORDER_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-4 text-[#2D2024]/75 whitespace-nowrap">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {wa && <IconButton icon="chat" title="WhatsApp customer" tone="whatsapp" href={wa} external />}
                            <IconButton icon="visibility" title="View order details" onClick={() => setSelectedId(order.id)} />
                            <IconButton icon="print" title="Print invoice" onClick={() => handlePrint(order)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              noun="orders"
            />
          </>
        )}
      </TableCard>

      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
        updating={!!selectedOrder && updatingId === selectedOrder.id}
      />
    </div>
  );
}
