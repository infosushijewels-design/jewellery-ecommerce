"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  addCustomerNote,
  deleteCustomerNote,
  getAdminCustomers,
  getCustomerActivity,
  AdminCustomer,
  CustomerActivity,
} from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { ORDER_STATUS_STYLES, orderStatusLabel, paymentLabel } from '@/components/admin/OrderDetailsDrawer';
import {
  Drawer,
  DrawerHeader,
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
  formatDate,
  formatDateTime,
  formatINR,
  getInitials,
  inputClass,
  whatsappLink,
} from '@/components/admin/AdminUI';

type TypeTab = 'all' | 'registered' | 'guest' | 'repeat' | 'admin';
type ActivityTab = 'orders' | 'wishlist' | 'inquiries' | 'reviews' | 'notes';

const PAGE_SIZE = 10;
const VIP_THRESHOLD = 50000;

const TYPE_TABS: { key: TypeTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'registered', label: 'Registered' },
  { key: 'guest', label: 'Guests' },
  { key: 'repeat', label: 'Repeat Buyers' },
  { key: 'admin', label: 'Admins' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'spent', label: 'Top spenders' },
  { value: 'orders', label: 'Most orders' },
  { value: 'lastOrder', label: 'Recently ordered' },
  { value: 'name', label: 'Name A–Z' },
];

const ACTIVITY_TABS: { key: ActivityTab; label: string; icon: string }[] = [
  { key: 'orders', label: 'Orders', icon: 'package_2' },
  { key: 'wishlist', label: 'Wishlist', icon: 'favorite' },
  { key: 'inquiries', label: 'Enquiries', icon: 'mail' },
  { key: 'reviews', label: 'Reviews', icon: 'star' },
  { key: 'notes', label: 'Notes', icon: 'sticky_note_2' },
];

function tier(c: AdminCustomer) {
  if (c.role === 'admin') return { label: 'Admin', style: 'bg-[#4B2949]/10 text-[#4B2949] border-[#4B2949]/20' };
  if (c.totalSpent >= VIP_THRESHOLD) return { label: 'VIP', style: 'bg-[#B99A62]/20 text-[#8A6F3C] border-[#B99A62]/40' };
  if (c.isGuest) return { label: 'Guest Buyer', style: 'bg-[#2D2024]/5 text-[#2D2024]/65 border-[#E8D5C5]' };
  return { label: 'Registered Patron', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

function matchesTab(c: AdminCustomer, tab: TypeTab) {
  switch (tab) {
    case 'registered':
      return !c.isGuest;
    case 'guest':
      return c.isGuest;
    case 'repeat':
      return c.orderCount > 1;
    case 'admin':
      return c.role === 'admin';
    default:
      return true;
  }
}

function exportCustomersCsv(customers: AdminCustomer[]) {
  const header = ['Name', 'Email', 'Phone', 'City', 'Type', 'Role', 'Orders', 'Total Spent', 'Last Order', 'Joined'];
  const rows = customers.map((c) => [
    c.fullName,
    c.email,
    c.phone || '',
    c.city || '',
    c.isGuest ? 'Guest' : 'Registered',
    c.role,
    String(c.orderCount),
    String(c.totalSpent),
    c.lastOrderAt ? new Date(c.lastOrderAt).toISOString() : '',
    new Date(c.createdAt).toISOString(),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TierBadge({ customer }: { customer: AdminCustomer }) {
  const t = tier(customer);
  return <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${t.style}`}>{t.label}</span>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`material-symbols-outlined text-[15px] ${n <= rating ? 'text-[#B99A62]' : 'text-[#E8D5C5]'}`}
          style={{ fontVariationSettings: `'FILL' ${n <= rating ? 1 : 0}` }}
        >
          star
        </span>
      ))}
    </span>
  );
}

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Orders page deep-links here with ?q=<email>&open=1
  const [initialParams] = useState(() =>
    typeof window === 'undefined'
      ? { q: '', open: false }
      : {
          q: new URLSearchParams(window.location.search).get('q') || '',
          open: new URLSearchParams(window.location.search).get('open') === '1',
        }
  );
  const [searchQuery, setSearchQuery] = useState(initialParams.q);
  const [typeFilter, setTypeFilter] = useState<TypeTab>('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoOpened, setAutoOpened] = useState(!initialParams.open);

  // Drawer state
  const [activityTab, setActivityTab] = useState<ActivityTab>('orders');
  const [activity, setActivity] = useState<CustomerActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getAdminCustomers();
      setCustomers(data);
      if (isRefresh) showToast('Customers refreshed', 'success');
    } catch (err) {
      console.error('Error fetching customers:', err);
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const selected = customers.find((c) => c.id === selectedId) || null;

  function openCustomer(id: string) {
    setSelectedId(id);
    setActivity(null);
    setActivityLoading(true);
    setActivityTab('orders');
    setNoteDraft('');
  }

  function closeCustomer() {
    setSelectedId(null);
    setActivity(null);
    setActivityLoading(false);
  }

  // Open the profile linked from the Orders drawer, once the list has loaded
  if (!autoOpened && !loading && customers.length > 0) {
    const match = customers.find((c) => c.email.toLowerCase() === initialParams.q.toLowerCase());
    setAutoOpened(true);
    if (match) openCustomer(match.id);
  }

  // Lifetime activity for the open profile
  useEffect(() => {
    if (!selected) return;
    let active = true;
    getCustomerActivity(selected.email, selected.isGuest ? null : selected.id)
      .then((data) => active && setActivity(data))
      .catch(() => active && setActivity(null))
      .finally(() => active && setActivityLoading(false));
    return () => {
      active = false;
    };
  }, [selected]);

  const stats = useMemo(() => {
    const buyers = customers.filter((c) => c.orderCount > 0);
    const revenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    return {
      total: customers.length,
      registered: customers.filter((c) => !c.isGuest).length,
      repeat: customers.filter((c) => c.orderCount > 1).length,
      vip: customers.filter((c) => c.totalSpent >= VIP_THRESHOLD).length,
      avgSpend: buyers.length ? Math.round(revenue / buyers.length) : 0,
    };
  }, [customers]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TYPE_TABS.forEach((t) => {
      counts[t.key] = customers.filter((c) => matchesTab(c, t.key)).length;
    });
    return counts;
  }, [customers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.city || '').toLowerCase().includes(q);
      return matchesSearch && matchesTab(c, typeFilter);
    });
    const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'orders':
          return b.orderCount - a.orderCount;
        case 'lastOrder':
          return time(b.lastOrderAt) - time(a.lastOrderAt);
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        default:
          return time(b.createdAt) - time(a.createdAt);
      }
    });
  }, [customers, searchQuery, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const conciergeMessage = (c: AdminCustomer) =>
    `Hello ${c.fullName.split(' ')[0]}, greetings from Sushi Jewels Concierge. How may we assist you today?`;

  async function handleAddNote() {
    if (!selected || !noteDraft.trim()) return;
    setSavingNote(true);
    const res = await addCustomerNote(selected.email, noteDraft, selected.isGuest ? null : selected.id);
    setSavingNote(false);
    if (!res.success) {
      showToast(res.error || 'Could not save the note', 'error');
      return;
    }
    setNoteDraft('');
    showToast('Note saved', 'success');
    const refreshed = await getCustomerActivity(selected.email, selected.isGuest ? null : selected.id);
    setActivity(refreshed);
  }

  async function handleDeleteNote(id: string) {
    if (!selected) return;
    const ok = await deleteCustomerNote(id);
    if (!ok) {
      showToast('Could not delete the note', 'error');
      return;
    }
    setActivity((prev) => (prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== id) } : prev));
    showToast('Note deleted', 'success');
  }

  const activityCounts: Record<ActivityTab, number> = {
    orders: selected?.orderCount ?? 0,
    wishlist: activity?.wishlist.length ?? 0,
    inquiries: activity?.inquiries.length ?? 0,
    reviews: activity?.reviews.length ?? 0,
    notes: activity?.notes.length ?? 0,
  };

  const avgOrderValue =
    selected && selected.orderCount > 0
      ? Math.round(selected.totalSpent / Math.max(1, selected.orders.filter((o) => o.status !== 'cancelled').length))
      : 0;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Client Relations"
        title="Customers"
        subtitle="Registered accounts and guest shoppers with their complete history."
        actions={
          <>
            <SecondaryButton icon="download" onClick={() => exportCustomersCsv(filtered)} disabled={loading || filtered.length === 0}>
              Export CSV
            </SecondaryButton>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadCustomers(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="group" value={stats.total} label="Total Customers" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="workspace_premium" value={stats.vip} label={`VIP (above ${formatINR(VIP_THRESHOLD)})`} tone="bg-[#B99A62]/20 text-[#8A6F3C]" />
        <StatTile icon="replay" value={stats.repeat} label="Repeat Buyers" tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="payments" value={formatINR(stats.avgSpend)} label="Avg. Spend / Buyer" tone="bg-amber-100 text-amber-700" />
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search by name, email, phone or city..."
          />
          <SelectFilter value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} ariaLabel="Sort customers" />
        </div>
        <FilterPills
          tabs={TYPE_TABS}
          active={typeFilter}
          counts={tabCounts}
          onChange={(key) => {
            setTypeFilter(key);
            setPage(1);
          }}
        />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading customers..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="group_off" title="No customers match your search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Orders</th>
                    <th className="py-3.5 px-4">Lifetime Value</th>
                    <th className="py-3.5 px-4">Last Order</th>
                    <th className="py-3.5 px-4">Joined</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((c) => {
                    const wa = whatsappLink(c.phone, conciergeMessage(c));
                    return (
                      <tr key={c.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <button onClick={() => openCustomer(c.id)} className="flex items-center gap-3 min-w-0 text-left group">
                            <div className="w-9 h-9 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(c.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[#2D2024] font-medium truncate max-w-[220px] group-hover:text-[#8A6F3C]">{c.fullName}</div>
                              <div className="text-xs text-[#2D2024]/55 truncate max-w-[220px]">{c.email}</div>
                            </div>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/75 whitespace-nowrap">{c.phone || '—'}</td>
                        <td className="py-3.5 px-4"><TierBadge customer={c} /></td>
                        <td className="py-3.5 px-4 text-[#2D2024]/80 tabular-nums">
                          {c.orderCount}
                          {c.orderCount > 1 && <span className="ml-1.5 text-[10px] text-emerald-700 font-semibold uppercase">Repeat</span>}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#2D2024] tabular-nums whitespace-nowrap">{formatINR(c.totalSpent)}</td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {wa && <IconButton icon="chat" title="WhatsApp customer" tone="whatsapp" href={wa} external />}
                            <IconButton icon="mail" title="Email customer" href={`mailto:${c.email}`} />
                            <IconButton icon="visibility" title="View full profile" onClick={() => openCustomer(c.id)} />
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
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              noun="customers"
            />
          </>
        )}
      </TableCard>

      {/* 360° customer profile */}
      <Drawer open={!!selected} onClose={closeCustomer} widthClass="max-w-2xl">
        {selected && (
          <>
            <DrawerHeader eyebrow="Customer Profile" title={selected.fullName} onClose={closeCustomer} />

            <div className="p-6 space-y-5">
              {/* Identity */}
              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-base font-semibold flex-shrink-0">
                    {getInitials(selected.fullName)}
                  </div>
                  <div className="min-w-0 flex-1 text-sm space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#2D2024]">{selected.fullName}</p>
                      <TierBadge customer={selected} />
                    </div>
                    <a href={`mailto:${selected.email}`} className="block text-[#2D2024]/70 hover:text-[#8A6F3C] truncate">{selected.email}</a>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="block text-[#2D2024]/70 hover:text-[#8A6F3C]">{selected.phone}</a>
                    )}
                  </div>
                </div>

                {selected.orders[0]?.shipping_address && (
                  <div className="mt-3 pt-3 border-t border-[#E8D5C5]/70 text-sm">
                    <p className="text-[11px] uppercase tracking-wider text-[#2D2024]/50 mb-1">Primary Delivery Address</p>
                    <p className="text-[#2D2024]/80">{selected.orders[0].shipping_address.address}</p>
                    <p className="text-[#2D2024]/80">
                      {selected.orders[0].shipping_address.city}, {selected.orders[0].shipping_address.state} - {selected.orders[0].shipping_address.pincode}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {whatsappLink(selected.phone) ? (
                    <a
                      href={whatsappLink(selected.phone, conciergeMessage(selected)) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">chat</span>
                      WhatsApp
                    </a>
                  ) : (
                    <span className="flex items-center justify-center bg-[#2D2024]/5 text-[#2D2024]/40 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                      No phone
                    </span>
                  )}
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center justify-center gap-1.5 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">mail</span>
                    Email
                  </a>
                  {selected.phone ? (
                    <a
                      href={`tel:${selected.phone.replace(/[^\d+]/g, '')}`}
                      className="flex items-center justify-center gap-1.5 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">call</span>
                      Call
                    </a>
                  ) : (
                    <span className="flex items-center justify-center bg-[#2D2024]/5 text-[#2D2024]/40 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                      No phone
                    </span>
                  )}
                </div>
              </section>

              {/* Lifetime KPIs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Lifetime Value', value: formatINR(selected.totalSpent) },
                  {
                    label: selected.orderCount > 1 ? 'Orders · Repeat' : 'Orders',
                    value: String(selected.orderCount),
                  },
                  { label: 'Avg. Order Value', value: formatINR(avgOrderValue) },
                ].map((k) => (
                  <div key={k.label} className="bg-white border border-[#E8D5C5] rounded-xl p-3 text-center">
                    <div className="font-headline-sm text-lg text-[#2D2024] truncate">{k.value}</div>
                    <div className="text-[11px] text-[#2D2024]/55">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Activity tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#E8D5C5] -mb-px">
                {ACTIVITY_TABS.map((t) => {
                  const active = activityTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setActivityTab(t.key)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                        active ? 'border-[#B99A62] text-[#8A6F3C] font-medium' : 'border-transparent text-[#2D2024]/60 hover:text-[#2D2024]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                      {t.label}
                      <span className="text-[11px] text-[#2D2024]/45 tabular-nums">{activityCounts[t.key]}</span>
                    </button>
                  );
                })}
              </div>

              <section className="pt-1">
                {activityTab === 'orders' && (
                  selected.orders.length === 0 ? (
                    <p className="text-sm text-[#2D2024]/55 py-6 text-center">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selected.orders.map((o) => (
                        <article key={o.id} className="bg-white border border-[#E8D5C5] rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#F5EEE7]/50 border-b border-[#E8D5C5]/70">
                            <div className="min-w-0">
                              <a
                                href={`/orders/${o.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#8A6F3C] hover:underline text-sm"
                              >
                                #{o.order_number}
                              </a>
                              <p className="text-[11px] text-[#2D2024]/55">{formatDateTime(o.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[11px] text-[#2D2024]/70 bg-white border border-[#E8D5C5] px-2 py-0.5 rounded">
                                {o.payment_method === 'cod' ? 'COD' : paymentLabel(o.payment_method)}
                              </span>
                              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[o.status]}`}>
                                {orderStatusLabel(o.status)}
                              </span>
                              <span className="text-sm font-semibold text-[#2D2024] tabular-nums">{formatINR(o.total)}</span>
                            </div>
                          </div>
                          <ul className="divide-y divide-[#E8D5C5]/60">
                            {(o.items || []).map((item) => (
                              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                                <span className="w-11 h-11 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0">
                                  {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="w-full h-full flex items-center justify-center text-[#B99A62]">
                                      <span className="material-symbols-outlined text-base">diamond</span>
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm text-[#2D2024] truncate">{item.title}</span>
                                  <span className="block text-[11px] text-[#2D2024]/55">
                                    {[item.metal, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                                  </span>
                                </span>
                                <span className="text-sm text-[#2D2024] tabular-nums whitespace-nowrap">{formatINR(item.price)}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  )
                )}

                {activityTab !== 'orders' && activityLoading && (
                  <p className="text-sm text-[#2D2024]/55 py-6 text-center flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px] animate-spin text-[#B99A62]">progress_activity</span>
                    Loading activity…
                  </p>
                )}

                {activityTab === 'wishlist' && !activityLoading && (
                  selected.isGuest ? (
                    <p className="text-sm text-[#2D2024]/55 py-6 text-center">Guest buyers don&apos;t have a saved wishlist.</p>
                  ) : activity && activity.wishlist.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activity.wishlist.map((w) => (
                        <li key={w.id} className="flex items-center gap-3 bg-white border border-[#E8D5C5] rounded-xl p-3">
                          <span className="w-12 h-12 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={w.imageUrl} alt={w.title} className="w-full h-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <a
                              href={`/product/${w.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-[#2D2024] hover:text-[#8A6F3C] truncate"
                            >
                              {w.title}
                            </a>
                            <span className="block text-[11px] text-[#2D2024]/55 truncate">{w.material}</span>
                          </span>
                          <span className="text-sm font-semibold text-[#2D2024] tabular-nums">{formatINR(w.price)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#2D2024]/55 py-6 text-center">Nothing saved to the wishlist yet.</p>
                  )
                )}

                {activityTab === 'inquiries' && !activityLoading && (
                  activity && activity.inquiries.length > 0 ? (
                    <ul className="space-y-3">
                      {activity.inquiries.map((i) => (
                        <li key={i.id} className="bg-white border border-[#E8D5C5] rounded-xl p-4">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <span className="text-xs text-[#2D2024]/70 bg-[#F5EEE7] border border-[#E8D5C5] px-2 py-0.5 rounded">
                              {i.category || 'General'}
                            </span>
                            <span className="text-[11px] text-[#2D2024]/55">{formatDateTime(i.created_at)}</span>
                          </div>
                          <p className="text-sm text-[#2D2024]/85 whitespace-pre-line">{i.message}</p>
                          <p className="text-[11px] text-[#2D2024]/55 mt-2 capitalize">Status: {i.status.replace('_', ' ')}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#2D2024]/55 py-6 text-center">No enquiries from this customer.</p>
                  )
                )}

                {activityTab === 'reviews' && !activityLoading && (
                  activity && activity.reviews.length > 0 ? (
                    <ul className="space-y-3">
                      {activity.reviews.map((r) => (
                        <li key={r.id} className="bg-white border border-[#E8D5C5] rounded-xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <Stars rating={r.rating} />
                            <span className="text-[11px] text-[#2D2024]/55">{formatDate(r.created_at)}</span>
                          </div>
                          <p className="text-xs text-[#8A6F3C] mt-1.5">{r.productTitle}</p>
                          {r.title && <p className="text-sm font-medium text-[#2D2024] mt-1">{r.title}</p>}
                          {r.comment && <p className="text-sm text-[#2D2024]/80 mt-0.5">{r.comment}</p>}
                          <p className="text-[11px] text-[#2D2024]/55 mt-2 capitalize">Status: {r.status}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#2D2024]/55 py-6 text-center">No reviews submitted yet.</p>
                  )
                )}

                {activityTab === 'notes' && !activityLoading && (
                  <div className="space-y-3">
                    <div>
                      <textarea
                        rows={3}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="e.g. Prefers 18K yellow gold. Wants Diwali delivery before 20 Oct."
                        className={`${inputClass} resize-none`}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-[#2D2024]/50">Internal only — never shown to the customer.</p>
                        <button
                          type="button"
                          onClick={handleAddNote}
                          disabled={savingNote || !noteDraft.trim()}
                          className="inline-flex items-center gap-1.5 bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-base">{savingNote ? 'progress_activity' : 'add'}</span>
                          {savingNote ? 'Saving…' : 'Add Note'}
                        </button>
                      </div>
                    </div>

                    {activity && activity.notes.length > 0 ? (
                      <ul className="space-y-2.5">
                        {activity.notes.map((n) => (
                          <li key={n.id} className="bg-white border border-[#E8D5C5] rounded-xl p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-[#2D2024]/85 whitespace-pre-line flex-1">{n.note}</p>
                              <IconButton icon="delete" title="Delete note" tone="danger" onClick={() => handleDeleteNote(n.id)} />
                            </div>
                            <p className="text-[11px] text-[#2D2024]/50 mt-1.5">
                              {n.author_email || 'Admin'} · {formatDateTime(n.created_at)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#2D2024]/55 py-4 text-center">No notes yet.</p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
