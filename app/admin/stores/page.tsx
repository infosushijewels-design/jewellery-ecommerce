"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { useAdminAccess } from '@/components/admin/AdminAccessContext';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { directionsUrl, isValidPincode, sortStores, type StoreBranch } from '@/lib/stores';
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
  SelectFilter,
  StatTile,
  TableCard,
  Toggle,
  friendlyDbError,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

const MIGRATION = '012_store_branches.sql';

type FormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  imageUrl: string;
  mapUrl: string;
  latitude: string;
  longitude: string;
  isFlagship: boolean;
  isActive: boolean;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  whatsapp: '',
  email: '',
  hours: 'Mon – Sat: 10:00 AM – 7:00 PM',
  imageUrl: '',
  mapUrl: '',
  latitude: '',
  longitude: '',
  isFlagship: false,
  isActive: true,
  sortOrder: '0',
};

const toForm = (s: StoreBranch): FormState => ({
  name: s.name,
  address: s.address,
  city: s.city,
  state: s.state,
  pincode: s.pincode,
  phone: s.phone || '',
  whatsapp: s.whatsapp || '',
  email: s.email || '',
  hours: s.hours || '',
  imageUrl: s.image_url || '',
  mapUrl: s.map_url || '',
  latitude: s.latitude != null ? String(s.latitude) : '',
  longitude: s.longitude != null ? String(s.longitude) : '',
  isFlagship: s.is_flagship,
  isActive: s.is_active,
  sortOrder: String(s.sort_order ?? 0),
});

/** Pulls "lat,lng" out of a pasted Google Maps link (…/@26.91,75.81,17z or ?q=26.91,75.81). */
function coordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export default function AdminStoresPage() {
  const { showToast } = useToast();
  const access = useAdminAccess();
  const canCreate = access.can('stores', 'create');
  const canEdit = access.can('stores', 'edit');
  const canDelete = access.can('stores', 'delete');

  const [stores, setStores] = useState<StoreBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreBranch | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient().from('store_branches').select('*').order('sort_order');
      if (error) throw error;
      setStores(sortStores((data as StoreBranch[]) || []));
      setMissingTable(false);
      if (isRefresh) showToast('Stores refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const cities = useMemo(() => Array.from(new Set(stores.map((s) => s.city))).sort(), [stores]);
  const activeCount = stores.filter((s) => s.is_active).length;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stores.filter((s) => {
      const matchesSearch =
        !q || [s.name, s.address, s.city, s.state, s.pincode, s.phone || ''].some((v) => v.toLowerCase().includes(q));
      return matchesSearch && (cityFilter === 'all' || s.city === cityFilter);
    });
  }, [stores, searchQuery, cityFilter]);

  // Topbar quick action links here with ?new=1 — open the create drawer once
  const [wantsNew] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === '1');
  const [newHandled, setNewHandled] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: String(stores.length + 1) });
    setFormOpen(true);
  }

  if (wantsNew && !newHandled && !missingTable) {
    setNewHandled(true);
    openCreate();
  }

  function openEdit(s: StoreBranch) {
    setEditingId(s.id);
    setForm(toForm(s));
    setFormOpen(true);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      showToast('Name, address, city and state are required', 'error');
      return;
    }
    if (!isValidPincode(form.pincode)) {
      showToast('Pincode must be a valid 6-digit Indian PIN code', 'error');
      return;
    }
    const lat = form.latitude.trim() ? Number(form.latitude) : null;
    const lng = form.longitude.trim() ? Number(form.longitude) : null;
    if ((lat == null) !== (lng == null) || (lat != null && (Math.abs(lat) > 90 || Math.abs(lng!) > 180 || Number.isNaN(lat) || Number.isNaN(lng)))) {
      showToast('Enter both latitude and longitude as valid numbers, or leave both empty', 'error');
      return;
    }
    if (form.mapUrl.trim() && !/^https?:\/\//i.test(form.mapUrl.trim())) {
      showToast('Map link must start with https://', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.replace(/\D/g, '') || null,
      email: form.email.trim() || null,
      hours: form.hours.trim() || null,
      image_url: form.imageUrl || null,
      map_url: form.mapUrl.trim() || null,
      latitude: lat,
      longitude: lng,
      is_flagship: form.isFlagship,
      is_active: form.isActive,
      sort_order: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    const supabase = createClient();
    try {
      if (editingId) {
        const { data, error } = await supabase.from('store_branches').update(payload).eq('id', editingId).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('permission denied');
        showToast(`${payload.name} updated`, 'success');
      } else {
        const { error } = await supabase.from('store_branches').insert(payload);
        if (error) throw error;
        showToast(`${payload.name} added`, 'success');
      }
      setFormOpen(false);
      loadStores();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(s: StoreBranch, next: boolean) {
    setTogglingId(s.id);
    try {
      const { data, error } = await createClient().from('store_branches').update({ is_active: next }).eq('id', s.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setStores((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: next } : x)));
      showToast(`${s.name} is now ${next ? 'shown' : 'hidden'} on the website`, 'success');
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
      const { data, error } = await createClient().from('store_branches').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast(`${deleteTarget.name} deleted`, 'success');
      setDeleteTarget(null);
      loadStores();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const readOnly = editingId ? !canEdit : !canCreate;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Management"
        title="Stores"
        subtitle="Store branches shown in the store locator, homepage and header."
        actions={
          <>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadStores(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            {canCreate && (
              <PrimaryButton icon="add" onClick={openCreate} disabled={missingTable}>
                Add Store
              </PrimaryButton>
            )}
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="storefront" value={stores.length} label="Total Stores" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="visibility" value={activeCount} label="Live on Website" tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="location_city" value={cities.length} label="Cities" tone="bg-indigo-100 text-indigo-700" />
        <StatTile
          icon="my_location"
          value={stores.filter((s) => s.latitude != null).length}
          label="With Map Location"
          tone="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name, city or pincode..." />
        {cities.length > 1 && (
          <SelectFilter
            value={cityFilter}
            onChange={setCityFilter}
            options={[{ value: 'all', label: 'All cities' }, ...cities.map((c) => ({ value: c, label: c }))]}
            ariaLabel="Filter by city"
          />
        )}
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading stores..." />
        ) : stores.length === 0 ? (
          <EmptyState icon="storefront" title="No stores yet." hint={missingTable ? undefined : 'Click "Add Store" to add your first branch.'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No stores match your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-5">Store</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D5C5]/70">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {s.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[#B99A62]">storefront</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2D2024] truncate max-w-[220px]">{s.name}</p>
                          {s.is_flagship && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6F3C]">Flagship</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-[#2D2024]">{s.city}, {s.state}</p>
                      <p className="text-xs text-[#2D2024]/55 truncate max-w-[240px]">{s.address} · {s.pincode}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#2D2024]/75 text-xs">
                      {s.phone && <p>{s.phone}</p>}
                      {s.whatsapp && <p className="text-emerald-700">WhatsApp ✓</p>}
                      {!s.phone && !s.whatsapp && <span className="text-[#2D2024]/40">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#2D2024]/70 max-w-[180px]">{s.hours || '—'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Toggle
                          checked={s.is_active}
                          disabled={!canEdit || togglingId === s.id}
                          onChange={(next) => handleToggle(s, next)}
                          label={s.is_active ? `Hide ${s.name}` : `Show ${s.name}`}
                        />
                        <span className={`text-xs font-medium ${s.is_active ? 'text-emerald-700' : 'text-[#2D2024]/50'}`}>
                          {s.is_active ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        <IconButton icon="directions" title="Open in Google Maps" href={directionsUrl(s)} external />
                        {canEdit && <IconButton icon="edit" title="Edit store" onClick={() => openEdit(s)} />}
                        {canDelete && <IconButton icon="delete" title="Delete store" tone="danger" onClick={() => setDeleteTarget(s)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <Drawer open={formOpen} onClose={() => setFormOpen(false)} widthClass="max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
          <DrawerHeader eyebrow="Store" title={editingId ? 'Edit Store' : 'Add Store'} onClose={() => setFormOpen(false)} />
          <fieldset disabled={readOnly} className="p-6 space-y-5 flex-1">
            <Field label="Store Name *" htmlFor="st-name" hint="e.g. South Extension, Jaipur Flagship">
              <input id="st-name" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Address *" htmlFor="st-address">
              <textarea id="st-address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} className={`${inputClass} resize-none`} placeholder="Shop no., building, street, area" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="City *" htmlFor="st-city">
                <input id="st-city" list="st-city-list" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
                <datalist id="st-city-list">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="State *" htmlFor="st-state">
                <input id="st-state" value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Pincode *" htmlFor="st-pin">
                <input
                  id="st-pin"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" htmlFor="st-phone">
                <input id="st-phone" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} placeholder="+91 ..." />
              </Field>
              <Field label="WhatsApp" htmlFor="st-wa" hint="Powers the Chat button">
                <input id="st-wa" inputMode="numeric" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, ''))} className={inputClass} placeholder="91XXXXXXXXXX" />
              </Field>
              <Field label="Email" htmlFor="st-email">
                <input id="st-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Opening Hours" htmlFor="st-hours">
                <input id="st-hours" value={form.hours} onChange={(e) => set('hours', e.target.value)} className={inputClass} />
              </Field>
            </div>

            <div>
              <p className="block text-[11px] uppercase tracking-wider text-[#2D2024]/60 mb-1.5 font-semibold">Store Photo</p>
              <ImageUploader value={form.imageUrl} onChange={(url) => set('imageUrl', url)} folder="stores" label="Upload store photo" aspectClass="aspect-[16/9]" disabled={readOnly} />
            </div>

            <div className="rounded-xl border border-[#E8D5C5] bg-[#FAF7F2] p-4 space-y-3">
              <p className="text-sm font-medium text-[#2D2024]">Map location</p>
              <p className="text-xs text-[#2D2024]/60">
                Paste the store&apos;s Google Maps link — we&apos;ll read the coordinates from it. Coordinates let customers see the distance in KM with &ldquo;Use my location&rdquo;.
              </p>
              <Field label="Google Maps Link" htmlFor="st-map">
                <input
                  id="st-map"
                  type="url"
                  value={form.mapUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    const coords = coordsFromMapsUrl(url);
                    setForm((f) => ({
                      ...f,
                      mapUrl: url,
                      ...(coords ? { latitude: String(coords.lat), longitude: String(coords.lng) } : {}),
                    }));
                  }}
                  className={inputClass}
                  placeholder="https://maps.google.com/..."
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" htmlFor="st-lat">
                  <input id="st-lat" inputMode="decimal" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} className={`${inputClass} font-mono`} placeholder="26.9157" />
                </Field>
                <Field label="Longitude" htmlFor="st-lng">
                  <input id="st-lng" inputMode="decimal" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} className={`${inputClass} font-mono`} placeholder="75.8105" />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <Field label="Display Order" htmlFor="st-order" hint="Lower shows first">
                <input id="st-order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={inputClass} />
              </Field>
              <div className="flex items-center justify-between gap-3 bg-white border border-[#E8D5C5] rounded-lg px-4 py-2.5">
                <span className="text-sm text-[#2D2024]">Flagship</span>
                <Toggle checked={form.isFlagship} onChange={(v) => set('isFlagship', v)} label="Flagship store" disabled={readOnly} />
              </div>
              <div className="flex items-center justify-between gap-3 bg-white border border-[#E8D5C5] rounded-lg px-4 py-2.5">
                <span className="text-sm text-[#2D2024]">Live</span>
                <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Show on website" disabled={readOnly} />
              </div>
            </div>
          </fieldset>
          <DrawerFooter>
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            {!readOnly && (
              <PrimaryButton type="submit" icon={saving ? undefined : 'save'} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Store' : 'Add Store'}
              </PrimaryButton>
            )}
          </DrawerFooter>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete store?"
        message={<><strong>{deleteTarget?.name}</strong> will be removed from the store locator. You can hide it instead using the Live toggle.</>}
        confirmLabel="Yes, Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
