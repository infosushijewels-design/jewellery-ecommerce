"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import {
  ConfirmDialog,
  Drawer,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  MigrationNotice,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  TableCard,
  Toggle,
  formatDate,
  formatINR,
  friendlyDbError,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

type Coupon = Database['public']['Tables']['coupons']['Row'];

const MIGRATION = '009_engagement_and_content.sql';

type FormState = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
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
  minOrderAmount: '0',
  maxDiscount: '',
  usageLimit: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function couponStatus(c: Coupon): { label: string; tone: 'active' | 'scheduled' | 'expired' | 'exhausted' | 'inactive' } {
  const now = Date.now();
  if (!c.is_active) return { label: 'Inactive', tone: 'inactive' };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: 'Expired', tone: 'expired' };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: 'Scheduled', tone: 'scheduled' };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { label: 'Limit reached', tone: 'exhausted' };
  return { label: 'Active', tone: 'active' };
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  scheduled: 'bg-sky-50 border-sky-200 text-sky-700',
  expired: 'bg-[#2D2024]/5 border-[#E8D5C5] text-[#2D2024]/55',
  exhausted: 'bg-amber-50 border-amber-200 text-amber-700',
  inactive: 'bg-[#2D2024]/5 border-[#E8D5C5] text-[#2D2024]/55',
};

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((c) => c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [coupons, searchQuery]);

  // Topbar quick action links here with ?new=1 — open the create drawer once
  const [wantsNew] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === '1');
  const [newHandled, setNewHandled] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  if (wantsNew && !newHandled && !missingTable) {
    setNewHandled(true);
    openCreate();
  }

  function openEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discount_type,
      discountValue: String(c.discount_value),
      minOrderAmount: String(c.min_order_amount),
      maxDiscount: c.max_discount != null ? String(c.max_discount) : '',
      usageLimit: c.usage_limit != null ? String(c.usage_limit) : '',
      startsAt: c.starts_at ? c.starts_at.slice(0, 10) : '',
      expiresAt: c.expires_at ? c.expires_at.slice(0, 10) : '',
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
    const discountValue = Number(form.discountValue);
    if (!code) {
      showToast('Coupon code is required', 'error');
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      showToast('Enter a valid discount value', 'error');
      return;
    }
    if (form.discountType === 'percent' && discountValue > 100) {
      showToast('Percentage discount cannot exceed 100', 'error');
      return;
    }
    const clash = coupons.find((c) => c.code.toUpperCase() === code && c.id !== editingId);
    if (clash) {
      showToast(`Coupon code "${code}" already exists`, 'error');
      return;
    }
    if (form.startsAt && form.expiresAt && new Date(form.startsAt) > new Date(form.expiresAt)) {
      showToast('Start date must be before the expiry date', 'error');
      return;
    }

    const payload = {
      code,
      description: form.description.trim() || null,
      discount_type: form.discountType,
      discount_value: discountValue,
      min_order_amount: form.minOrderAmount.trim() ? Math.max(0, Number(form.minOrderAmount)) : 0,
      max_discount: form.discountType === 'percent' && form.maxDiscount.trim() ? Math.max(0, Number(form.maxDiscount)) : null,
      usage_limit: form.usageLimit.trim() ? Math.max(1, Math.round(Number(form.usageLimit))) : null,
      starts_at: form.startsAt ? new Date(form.startsAt).toISOString() : null,
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
        showToast('Coupon updated', 'success');
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
        showToast('Coupon created', 'success');
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
      setCoupons((prev) => prev.map((row) => (row.id === c.id ? { ...row, is_active: next } : row)));
      showToast(next ? `"${c.code}" is active` : `"${c.code}" deactivated`, 'success');
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
      showToast('Coupon deleted', 'success');
      setDeleteTarget(null);
      loadCoupons();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Coupons"
        subtitle="Create and manage discount codes customers can redeem at checkout."
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

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by code or description..." />
        <span className="text-sm text-[#2D2024]/60">Total: {filtered.length} coupons</span>
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading coupons..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="sell" title="No coupons match your search." />
        ) : (
          <div className="w-full overflow-x-auto custom-scroll">
            <table className="w-full text-left text-sm min-w-[900px]">
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
                {filtered.map((c) => {
                  const status = couponStatus(c);
                  return (
                    <tr key={c.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#B99A62]/12 text-[#8A6F3C] flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-xl">sell</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#2D2024] font-mono font-semibold tracking-wide">{c.code}</p>
                            {c.description && <p className="text-xs text-[#2D2024]/55 truncate max-w-[220px]">{c.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2024]">
                        {c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatINR(c.discount_value)} off`}
                        {c.discount_type === 'percent' && c.max_discount != null && (
                          <p className="text-xs text-[#2D2024]/50">Up to {formatINR(c.max_discount)}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2024]/75">{c.min_order_amount > 0 ? formatINR(c.min_order_amount) : 'None'}</td>
                      <td className="py-3.5 px-4 text-[#2D2024]/75">
                        {c.used_count}
                        {c.usage_limit != null ? ` / ${c.usage_limit}` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">
                        {c.starts_at ? formatDate(c.starts_at) : 'Anytime'} – {c.expires_at ? formatDate(c.expires_at) : 'No expiry'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Toggle
                            checked={c.is_active}
                            disabled={togglingId === c.id}
                            loading={togglingId === c.id}
                            onChange={(next) => handleToggle(c, next)}
                            label={c.is_active ? `Deactivate ${c.code}` : `Activate ${c.code}`}
                          />
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[status.tone]}`}>{status.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5">
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
        )}
      </TableCard>

      <Drawer open={formOpen} onClose={closeForm} widthClass="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
          <DrawerHeader eyebrow="Coupon" title={editingId ? 'Edit Coupon' : 'New Coupon'} onClose={closeForm} />
          <div className="p-6 space-y-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Coupon Code *" htmlFor="cp-code" hint="Customers type this at checkout.">
                <input
                  id="cp-code"
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className={`${inputClass} font-mono uppercase tracking-wider`}
                  placeholder="WELCOME10"
                />
              </Field>
              <Field label="Description" htmlFor="cp-desc" hint="Internal note — not shown to customers.">
                <input
                  id="cp-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                  placeholder="First-order welcome discount"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Discount Type *" htmlFor="cp-type">
                <select
                  id="cp-type"
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as 'percent' | 'fixed' }))}
                  className={inputClass}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </Field>
              <Field label={`Discount Value * ${form.discountType === 'percent' ? '(%)' : '(₹)'}`} htmlFor="cp-value">
                <input
                  id="cp-value"
                  required
                  type="number"
                  min={0}
                  max={form.discountType === 'percent' ? 100 : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className={inputClass}
                  placeholder={form.discountType === 'percent' ? '10' : '500'}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Minimum Order Amount" htmlFor="cp-min" hint="0 = no minimum.">
                <input
                  id="cp-min"
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              {form.discountType === 'percent' && (
                <Field label="Max Discount Cap" htmlFor="cp-max" hint="Leave empty for no cap.">
                  <input
                    id="cp-max"
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. 1000"
                  />
                </Field>
              )}
            </div>

            <Field label="Usage Limit" htmlFor="cp-limit" hint="Total number of redemptions allowed. Leave empty for unlimited.">
              <input
                id="cp-limit"
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className={inputClass}
                placeholder="Unlimited"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Starts On" htmlFor="cp-start" hint="Leave empty to start immediately.">
                <input
                  id="cp-start"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Expires On" htmlFor="cp-expiry" hint="Leave empty for no expiry.">
                <input
                  id="cp-expiry"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white border border-[#E8D5C5] rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2D2024]">Active</p>
                <p className="text-xs text-[#2D2024]/55">When off, this coupon cannot be redeemed even within its validity window.</p>
              </div>
              <Toggle checked={form.isActive} onChange={(next) => setForm((f) => ({ ...f, isActive: next }))} label="Active" />
            </div>
          </div>
          <DrawerFooter>
            <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" icon="save" loading={saving}>
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
            <strong>{deleteTarget?.code}</strong> will be permanently removed and can no longer be redeemed. This cannot be undone.
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
