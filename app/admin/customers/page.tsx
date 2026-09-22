"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAdminCustomers, AdminCustomer } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { ORDER_STATUS_STYLES, orderStatusLabel } from '@/components/admin/OrderDetailsDrawer';
import {
  Drawer,
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
  formatINR,
  getInitials,
  whatsappLink,
} from '@/components/admin/AdminUI';

type TypeTab = 'all' | 'registered' | 'guest' | 'repeat' | 'admin';

const PAGE_SIZE = 10;

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

function TypeBadge({ customer }: { customer: AdminCustomer }) {
  if (customer.role === 'admin') {
    return <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#4B2949]/10 text-[#4B2949] border border-[#4B2949]/20">Admin</span>;
  }
  if (customer.isGuest) {
    return <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#2D2024]/5 text-[#2D2024]/65 border border-[#E8D5C5]">Guest</span>;
  }
  return <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#B99A62]/15 text-[#8A6F3C] border border-[#B99A62]/30">Registered</span>;
}

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeTab>('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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

  const stats = useMemo(() => {
    const buyers = customers.filter((c) => c.orderCount > 0);
    const revenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    return {
      total: customers.length,
      registered: customers.filter((c) => !c.isGuest).length,
      repeat: customers.filter((c) => c.orderCount > 1).length,
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

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Client Relations"
        title="Customers"
        subtitle="Registered accounts and guest shoppers with their order history."
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
        <StatTile icon="how_to_reg" value={stats.registered} label="Registered" tone="bg-indigo-100 text-indigo-700" />
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
                    <th className="py-3.5 px-4">Total Spent</th>
                    <th className="py-3.5 px-4">Last Order</th>
                    <th className="py-3.5 px-4">Joined</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((c) => {
                    const wa = whatsappLink(c.phone, `Hello ${c.fullName.split(' ')[0]}, greetings from Sushi Jewels!`);
                    return (
                      <tr key={c.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <button onClick={() => setSelected(c)} className="flex items-center gap-3 min-w-0 text-left group">
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
                        <td className="py-3.5 px-4"><TypeBadge customer={c} /></td>
                        <td className="py-3.5 px-4 text-[#2D2024]/80 tabular-nums">{c.orderCount}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#2D2024] tabular-nums whitespace-nowrap">{formatINR(c.totalSpent)}</td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {wa && <IconButton icon="chat" title="WhatsApp customer" tone="whatsapp" href={wa} external />}
                            <IconButton icon="mail" title="Email customer" href={`mailto:${c.email}`} />
                            <IconButton icon="visibility" title="View customer" onClick={() => setSelected(c)} />
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

      {/* Customer detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="sticky top-0 z-10 bg-[#FFFCF7]/95 backdrop-blur-sm border-b border-[#E8D5C5] px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {getInitials(selected.fullName)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline-sm text-xl text-[#2D2024] truncate">{selected.fullName}</h3>
                  <div className="mt-0.5"><TypeBadge customer={selected} /></div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-full text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/50"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">mail</span>
                  <a href={`mailto:${selected.email}`} className="hover:text-[#8A6F3C] truncate">{selected.email}</a>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">call</span>
                  {selected.phone ? <a href={`tel:${selected.phone}`} className="hover:text-[#8A6F3C]">{selected.phone}</a> : <span>—</span>}
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">location_on</span>
                  <span>{selected.city || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">calendar_today</span>
                  <span>{selected.isGuest ? 'First order' : 'Joined'} {formatDate(selected.createdAt)}</span>
                </div>
              </section>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Orders', value: String(selected.orderCount) },
                  { label: 'Total Spent', value: formatINR(selected.totalSpent) },
                  {
                    label: 'Avg. Order',
                    value: formatINR(
                      selected.orderCount ? Math.round(selected.totalSpent / Math.max(1, selected.orders.filter((o) => o.status !== 'cancelled').length)) : 0
                    ),
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-[#E8D5C5] rounded-xl p-3 text-center">
                    <div className="font-headline-sm text-lg text-[#2D2024] truncate">{s.value}</div>
                    <div className="text-[11px] text-[#2D2024]/55">{s.label}</div>
                  </div>
                ))}
              </div>

              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4">
                <h4 className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#2D2024]/55 font-semibold mb-3">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">receipt_long</span>
                  Order History
                </h4>
                {selected.orders.length === 0 ? (
                  <p className="text-sm text-[#2D2024]/55">No orders yet.</p>
                ) : (
                  <ul className="divide-y divide-[#E8D5C5]/70">
                    {selected.orders.map((o) => (
                      <li key={o.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <a
                            href={`/orders/${o.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#8A6F3C] hover:underline"
                          >
                            #{o.order_number}
                          </a>
                          <p className="text-xs text-[#2D2024]/55">
                            {formatDate(o.created_at)} · {o.items?.length || 0} {(o.items?.length || 0) === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[o.status]}`}>
                            {orderStatusLabel(o.status)}
                          </span>
                          <span className="font-semibold text-[#2D2024] tabular-nums">{formatINR(o.total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center justify-center gap-2 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <span className="material-symbols-outlined text-base">mail</span>
                  Email
                </a>
                {whatsappLink(selected.phone) ? (
                  <a
                    href={whatsappLink(selected.phone, `Hello ${selected.fullName.split(' ')[0]}, greetings from Sushi Jewels!`) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    WhatsApp
                  </a>
                ) : (
                  <span className="flex items-center justify-center gap-2 bg-[#2D2024]/5 text-[#2D2024]/40 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                    No phone
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
