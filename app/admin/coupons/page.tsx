"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import {
  CHEVRON_BG,
  ConfirmDialog,
  Drawer,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  Field,
  FilterPills,
  IconButton,
  LoadingState,
  MigrationNotice,
  PageHeader,
  Pagination,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  StatTile,
  TableCard,
  Toggle,
  formatDate,
  formatINR,
  friendlyDbError,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

type Coupon = Database['public']['Tables']['coupons']['Row'];
type CouponState = 'active' | 'scheduled' | 'expired' | 'used_up' | 'disabled';
type StateTab = 'all' | CouponState;

const MIGRATION = '009_engagement_and_content.sql';
const PAGE_SIZE = 10;

const STATE_META: Record<CouponState, { label: string; style: string }> = {
  active: { label: 'Active', style: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  scheduled: { label: 'Scheduled', style: 'bg-sky-50 border-sky-200 text-sky-800' },
  expired: { label: 'Expired', style: 'bg-[#2D2024]/5 border-[#E8D5C5] text-[#2D2024]/60' },
  used_up: { label: 'Limit reached', style: 'bg-amber-50 border-amber-200 text-amber-800' },
  disabled: { label: 'Disabled', style: 'bg-red-50 border-red-200 text-red-700' },
};

const STATE_TABS: { key: StateTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'expired', label: 'Expired' },
  { key: 'disabled', label: 'Disabled' },
];

function couponState(c: Coupon, now = Date.now()): CouponState {
  if (!c.is_active) return 'disabled';
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return 'expired';
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return 'scheduled';
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return 'used_up';
  return 'active';
}

function discountLabel(c: Pick<Coupon, 'discount_type' | 'discount_value' | 'max_discount'>) {
  if (c.discount_type === 'percent') {
    return `${Number(c.discount_value)}% off${c.max_discount ? ` · max ${formatINR(c.max_discount)}` : ''}`;
  }
  return `${formatINR(c.discount_value)} off`;
}

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'SJ';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** yyyy-mm-dd for <input type="date"> from an ISO timestamp */
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

type FormState = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minOrder: '',
  maxDiscount: '',
  usageLimit: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateTab>('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient().from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
      setMissingTable(false);
      if (isRefresh) showToast('Coupons refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const stateCounts = useMemo(() => {
    const now = Date.now();
    const counts: Record<string, number> = { all: coupons.length };
    coupons.forEach((c) => {
      const s = couponState(c, now);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [coupons]);

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();
    return coupons.filter((c) => {
      const matchesSearch = !q || c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
      const s = couponState(c, now);
      const matchesState = stateFilter === 'all' || s === stateFilter || (stateFilter === 'expired' && s === 'used_up');
      return matchesSearch && matchesState;
    });
  }, [coupons, searchQuery, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, code: generateCode() });
    setFormOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discount_type,
      discountValue: String(c.discount_value),
      minOrder: c.min_order_amount ? String(c.min_order_amount) : '',
      maxDiscount: c.max_discount != null ? String(c.max_discount) : '',
      usageLimit: c.usage_limit != null ? String(c.usage_limit) : '',
      startsAt: toDateInput(c.starts_at),
      expiresAt: toDateInput(c.expires_at),
      isActive: c.is_active,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase().replace(/\s+/g, '');
    const value = Number(form.discountValue);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      showToast('Code must be 3–32 characters: letters, numbers, - or _', 'error');
      return;
    }
    if (!(value > 0) || (form.discountType === 'percent' && value > 100)) {
      showToast(form.discountType === 'percent' ? 'Percentage must be between 1 and 100' : 'Discount amount must be greater than 0', 'error');
      return;
    }
    if (form.startsAt && form.expiresAt && form.expiresAt <= form.startsAt) {
      showToast('Expiry date must be after the start date', 'error');
      return;
    }

    const payload = {
      code,
      description: form.description.trim() || null,
      discount_type: form.discountType,
      discount_value: value,
      min_order_amount: Number(form.minOrder) || 0,
      max_discount: form.discountType === 'percent' && Number(form.maxDiscount) > 0 ? Number(form.maxDiscount) : null,
      usage_limit: Number(form.usageLimit) > 0 ? Math.floor(Number(form.usageLimit)) : null,
      // Start of day for starts_at, end of day for expires_at (local time)
      starts_at: form.startsAt ? new Date(`${form.startsAt}T00:00:00`).toISOString() : null,
      expires_at: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      is_active: form.isActive,
    };

    setSaving(true);
    const supabase = createClient();
    try {
      if (editingId) {
        const { data, error } = await supabase.from('coupons').update(payload).eq('id', editingId).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('permission denied');
        showToast(`Coupon ${code} updated`, 'success');
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
        showToast(`Coupon ${code} created`, 'success');
      }
      closeForm();
      loadCoupons();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: Coupon, next: boolean) {
    setTogglingId(c.id);
    try {
      const { data, error } = await createClient().from('coupons').update({ is_active: next }).eq('id', c.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)));
      showToast(`${c.code} ${next ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await createClient().from('coupons').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast(`Coupon ${deleteTarget.code} deleted`, 'success');
      setDeleteTarget(null);
      loadCoupons();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Copied ${code}`, 'success');
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  }

  const preview = discountLabel({
    discount_type: form.discountType,
    discount_value: Number(form.discountValue) || 0,
    max_discount: Number(form.maxDiscount) || null,
  });

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Engagement"
        title="Coupons & Discounts"
        subtitle="Create promo codes with limits, minimum order values and validity windows."
        actions={
          <>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadCoupons(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            <PrimaryButton icon="add" onClick={openCreate} disabled={missingTable}>
              Create Coupon
            </PrimaryButton>
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="sell" value={coupons.length} label="Total Coupons" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="check_circle" value={stateCounts.active || 0} label="Active Now" tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="event_busy" value={(stateCounts.expired || 0) + (stateCounts.used_up || 0)} label="Expired / Used up" tone="bg-[#2D2024]/10 text-[#2D2024]/70" />
        <StatTile icon="redeem" value={totalRedemptions} label="Total Redemptions" tone="bg-indigo-100 text-indigo-700" />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(1);
          }}
          placeholder="Search coupon code..."
        />
        <FilterPills
          tabs={STATE_TABS}
          active={stateFilter}
          counts={{ ...stateCounts, expired: (stateCounts.expired || 0) + (stateCounts.used_up || 0) }}
          onChange={(k) => {
            setStateFilter(k);
            setPage(1);
          }}
        />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading coupons..." />
        ) : coupons.length === 0 ? (
          <EmptyState icon="sell" title="No coupons yet." hint={missingTable ? undefined : 'Click "Create Coupon" to add your first promo code.'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No coupons match your search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Code</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Min. Order</th>
                    <th className="py-3.5 px-4">Usage</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((c) => {
                    const state = couponState(c);
                    const pct = c.usage_limit ? Math.min(100, (c.used_count / c.usage_limit) * 100) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="inline-block font-mono font-semibold text-[#8A6F3C] bg-[#B99A62]/10 border border-dashed border-[#B99A62]/50 px-3 py-1 rounded-md tracking-wider">
                            {c.code}
                          </span>
                          {c.description && <p className="text-xs text-[#2D2024]/55 mt-1 truncate max-w-[220px]">{c.description}</p>}
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024] font-medium whitespace-nowrap">{discountLabel(c)}</td>
                        <td className="py-3.5 px-4 text-[#2D2024]/75 whitespace-nowrap">
                          {Number(c.min_order_amount) > 0 ? formatINR(c.min_order_amount) : '—'}
                        </td>
                        <td className="py-3.5 px-4 min-w-[130px]">
                          <div className="text-xs text-[#2D2024] tabular-nums mb-1">
                            {c.used_count} / {c.usage_limit ?? '∞'}
                          </div>
                          {c.usage_limit != null && (
                            <div className="h-1.5 rounded-full bg-[#E8D5C5]/60 overflow-hidden">
                              <div className="h-full rounded-full bg-[#B99A62]" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#2D2024]/70 whitespace-nowrap">
                          <div>{c.starts_at ? `From ${formatDate(c.starts_at)}` : 'Starts immediately'}</div>
                          <div>{c.expires_at ? `Until ${formatDate(c.expires_at)}` : 'No expiry'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Toggle
                              checked={c.is_active}
                              disabled={togglingId === c.id}
                              onChange={(next) => handleToggle(c, next)}
                              label={c.is_active ? `Disable ${c.code}` : `Enable ${c.code}`}
                            />
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${STATE_META[state].style}`}>
                              {STATE_META[state].label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            <IconButton icon="content_copy" title="Copy code" onClick={() => copyCode(c.code)} />
                            <IconButton icon="edit" title="Edit coupon" onClick={() => openEdit(c)} />
                            <IconButton icon="delete" title="Delete coupon" tone="danger" onClick={() => setDeleteTarget(c)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} noun="coupons" />
          </>
        )}
      </TableCard>

      <Drawer open={formOpen} onClose={closeForm} widthClass="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
          <DrawerHeader eyebrow="Coupon" title={editingId ? 'Edit Coupon' : 'Create Coupon'} onClose={closeForm} />
          <div className="p-6 space-y-5 flex-1">
            <Field label="Coupon Code *" htmlFor="c-code" hint="Customers type this at checkout. Letters, numbers, - and _ only.">
              <div className="flex gap-2">
                <input
                  id="c-code"
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  className={`${inputClass} font-mono tracking-wider uppercase`}
                  placeholder="FESTIVE20"
                  maxLength={32}
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                  className="flex-shrink-0 px-3 rounded-lg border border-[#E8D5C5] bg-white text-[#2D2024]/70 hover:text-[#2D2024] hover:bg-[#E8D5C5]/40"
                  title="Generate random code"
                  aria-label="Generate random code"
                >
                  <span className="material-symbols-outlined text-lg">casino</span>
                </button>
              </div>
            </Field>

            <Field label="Description" htmlFor="c-desc">
              <input
                id="c-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Diwali festive offer"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount Type" htmlFor="c-type">
                <select
                  id="c-type"
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as FormState['discountType'] }))}
                  className={`${inputClass} appearance-none cursor-pointer`}
                  style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Flat amount (₹)</option>
                </select>
              </Field>
              <Field label={form.discountType === 'percent' ? 'Percent Off *' : 'Amount Off (₹) *'} htmlFor="c-value">
                <input
                  id="c-value"
                  type="number"
                  required
                  min={1}
                  max={form.discountType === 'percent' ? 100 : undefined}
                  step="any"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className={inputClass}
                  placeholder={form.discountType === 'percent' ? '10' : '500'}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Min. Order (₹)" htmlFor="c-min">
                <input
                  id="c-min"
                  type="number"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))}
                  className={inputClass}
                  placeholder="0"
                />
              </Field>
              <Field label="Max Discount (₹)" htmlFor="c-max" hint={form.discountType === 'fixed' ? 'Only for % coupons' : undefined}>
                <input
                  id="c-max"
                  type="number"
                  min={1}
                  disabled={form.discountType === 'fixed'}
                  value={form.discountType === 'fixed' ? '' : form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                  className={`${inputClass} disabled:bg-[#F5EEE7] disabled:text-[#2D2024]/40`}
                  placeholder="No cap"
                />
              </Field>
            </div>

            <Field label="Usage Limit" htmlFor="c-limit" hint="Total number of times this code can be redeemed. Leave empty for unlimited.">
              <input
                id="c-limit"
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className={inputClass}
                placeholder="Unlimited"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts On" htmlFor="c-start">
                <input
                  id="c-start"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Expires On" htmlFor="c-end">
                <input
                  id="c-end"
                  type="date"
                  value={form.expiresAt}
                  min={form.startsAt || undefined}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white border border-[#E8D5C5] rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2D2024]">Enabled</p>
                <p className="text-xs text-[#2D2024]/55">Disabled coupons cannot be redeemed.</p>
              </div>
              <Toggle checked={form.isActive} onChange={(next) => setForm((f) => ({ ...f, isActive: next }))} label="Enabled" />
            </div>

            <div className="rounded-xl border border-dashed border-[#B99A62]/60 bg-[#B99A62]/5 px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-wider text-[#8A6F3C] font-semibold mb-1">Preview</p>
              <p className="text-[#2D2024]">
                <span className="font-mono font-semibold">{form.code || 'CODE'}</span> — {preview}
                {Number(form.minOrder) > 0 && <> on orders above {formatINR(form.minOrder)}</>}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" icon={saving ? undefined : 'save'} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Coupon' : 'Create Coupon'}
            </PrimaryButton>
          </DrawerFooter>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete coupon?"
        message={
          <>
            <strong className="font-mono">{deleteTarget?.code}</strong> will stop working immediately. This cannot be undone.
          </>
        }
        confirmLabel="Yes, Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
