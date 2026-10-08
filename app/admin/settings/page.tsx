"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { useAdminAccess } from '@/components/admin/AdminAccessContext';
import { publishStoreSettings } from '@/lib/hooks/useStoreSettings';
import { SLOT_LENGTH_OPTIONS } from '@/lib/appointments';
import { DEFAULT_STORE_SETTINGS, mergeStoreSettings, type StoreSettings } from '@/lib/storeSettings';
import { ACCEPTED_ICON_TYPES, ACCEPTED_IMAGE_TYPES, uploadImage } from '@/lib/storage';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  LoadingState,
  MigrationNotice,
  PrimaryButton,
  SecondaryButton,
  Toggle,
  formatDateTime,
  formatINR,
  friendlyDbError,
  isMissingTableError,
} from '@/components/admin/AdminUI';

const MIGRATION = '010_staff_roles_and_settings.sql';

type TabKey = 'general' | 'homepage' | 'payments' | 'tax' | 'shipping' | 'orders' | 'appointments' | 'social' | 'announcement';

// shortLabel is what phones show in the horizontally scrolling tab strip
const TABS: { key: TabKey; label: string; shortLabel: string; icon: string }[] = [
  { key: 'general', label: 'General Store Settings', shortLabel: 'General', icon: 'storefront' },
  { key: 'homepage', label: 'Homepage Content', shortLabel: 'Homepage', icon: 'home' },
  { key: 'payments', label: 'Payment Settings', shortLabel: 'Payments', icon: 'credit_card' },
  { key: 'tax', label: 'Tax Settings (GST)', shortLabel: 'Tax (GST)', icon: 'receipt_long' },
  { key: 'shipping', label: 'Shipping Settings', shortLabel: 'Shipping', icon: 'local_shipping' },
  { key: 'orders', label: 'Order Settings', shortLabel: 'Orders', icon: 'inventory' },
  { key: 'appointments', label: 'Video Appointments', shortLabel: 'Appointments', icon: 'videocam' },
  { key: 'social', label: 'Social Media Settings', shortLabel: 'Social Media', icon: 'public' },
  { key: 'announcement', label: 'Announcement Bar', shortLabel: 'Announcement', icon: 'campaign' },
];

// ---------------------------------------------------------------------------
// Form primitives (reference-style: label on top, leading icon inside field)
// ---------------------------------------------------------------------------

const fieldClass =
  'w-full bg-[#FAF7F2] border border-[#E8D5C5] rounded-xl text-sm text-[#2D2024] placeholder:text-[#2D2024]/35 focus:outline-none focus:bg-white focus:border-[#B99A62] focus:ring-2 focus:ring-[#B99A62]/20 transition disabled:cursor-not-allowed disabled:text-[#2D2024]/70';

function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#2D2024]">
        {children}
      </label>
      {hint && <p className="text-xs text-[#2D2024]/50 mt-0.5">{hint}</p>}
    </div>
  );
}

function IconInput({
  id,
  icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  prefix,
  inputMode,
  maxLength,
  min,
  max,
  step,
  className = '',
}: {
  id: string;
  icon: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
  inputMode?: 'numeric' | 'decimal' | 'email' | 'tel' | 'url' | 'text';
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#2D2024]/35 pointer-events-none">{icon}</span>
      {prefix && <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-[#2D2024]/50 pointer-events-none">{prefix}</span>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        className={`${fieldClass} ${prefix ? 'pl-14' : 'pl-10'} pr-4 py-2.5 ${className}`}
      />
    </div>
  );
}

function IconTextarea({ id, icon, value, onChange, rows = 3, placeholder }: { id: string; icon: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-[#2D2024]/35 pointer-events-none">{icon}</span>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${fieldClass} pl-10 pr-4 py-2.5 resize-none`}
      />
    </div>
  );
}

function SwitchRow({ title, hint, checked, onChange, disabled }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#FAF7F2] border border-[#E8D5C5] rounded-xl px-4 py-3.5">
      <div>
        <p className="text-sm font-medium text-[#2D2024]">{title}</p>
        <p className="text-xs text-[#2D2024]/55">{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

/** Compact "preview + Choose File + Remove" picker used for the logo and favicon. */
function BrandImagePicker({
  title,
  hint,
  value,
  onChange,
  accept,
  previewClass,
  disabled,
}: {
  title: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  accept: string[];
  previewClass: string;
  disabled?: boolean;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, 'branding', accept));
      showToast(`${title} uploaded — remember to save`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-[#2D2024]">{title}</p>
      <p className="text-xs text-[#2D2024]/55 mb-3">{hint}</p>
      <div className="flex items-center gap-4">
        <div className={`${previewClass} rounded-xl border border-[#E8D5C5] bg-white flex items-center justify-center overflow-hidden flex-shrink-0`}>
          {uploading ? (
            <span className="material-symbols-outlined text-2xl text-[#B99A62] animate-spin">progress_activity</span>
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={title} className="max-w-full max-h-full object-contain p-2" />
          ) : (
            <span className="material-symbols-outlined text-2xl text-[#2D2024]/25">image</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <input ref={inputRef} type="file" accept={accept.join(',')} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-[#E8D5C5] bg-white text-xs font-medium text-[#2D2024]/80 hover:bg-[#F5EEE7] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading…' : 'Choose File'}
          </button>
          {value && !disabled && (
            <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-600 hover:underline">
              Remove {title.split(' ').pop()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Razorpay key ID/secret live in their own table (public.razorpay_credentials,
 * migration 017) — never inside store_settings, since that table is
 * intentionally public-readable, which would otherwise expose the secret key
 * to anyone with the anon key.
 */
const RAZORPAY_MIGRATION = '017_razorpay_credentials.sql';

function RazorpayPanel({ readOnly }: { readOnly: boolean }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    createClient()
      .from('razorpay_credentials')
      .select('key_id, key_secret, updated_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          if (isMissingTableError(error)) setMissingTable(true);
          // A non-admin viewer can't read this table (RLS) — treat that like "not set up yet".
          return;
        }
        if (data) {
          setKeyId(data.key_id);
          setKeySecret(data.key_secret);
          setSavedAt(data.updated_at);
        }
      })
      .then(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { data, error } = await createClient()
        .from('razorpay_credentials')
        .upsert({ id: 1, key_id: keyId.trim(), key_secret: keySecret.trim() })
        .select('updated_at');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setSavedAt(data[0].updated_at);
      showToast('Razorpay keys saved', 'success');
    } catch (err) {
      showToast(friendlyDbError(err, RAZORPAY_MIGRATION), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-6"><LoadingState label="Loading Razorpay settings..." /></div>;

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#2D2024] mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-[#8A6F3C]">credit_card</span>
        Razorpay API Keys
      </h3>
      <p className="text-xs text-[#2D2024]/55 mb-4">
        Required for the &ldquo;Online Payment&rdquo; option above to work. Get these from your Razorpay Dashboard → Settings → API Keys.
        {savedAt && <span className="text-[#2D2024]/40"> Last saved {formatDateTime(savedAt)}.</span>}
      </p>

      <MigrationNotice migration={RAZORPAY_MIGRATION} show={missingTable} />

      {!missingTable && (
        <fieldset disabled={readOnly} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="rzp-key" hint="Safe to expose to the browser — this is the public half.">Razorpay Key ID</Label>
              <IconInput id="rzp-key" icon="key" value={keyId} onChange={setKeyId} placeholder="rzp_live_xxxxxxxxxxxx" />
            </div>
            <div>
              <Label htmlFor="rzp-secret" hint="Never shown to the storefront — used only server-side.">Razorpay Key Secret</Label>
              <IconInput id="rzp-secret" icon="vpn_key" type="password" value={keySecret} onChange={setKeySecret} />
            </div>
          </div>
          {!readOnly && (
            <PrimaryButton icon="save" onClick={handleSave} loading={saving}>
              {saving ? 'Saving…' : 'Save Razorpay Keys'}
            </PrimaryButton>
          )}
        </fieldset>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const access = useAdminAccess();
  const canEdit = access.can('settings', 'edit');

  const [tab, setTab] = useState<TabKey>('general');
  const [saved, setSaved] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [draft, setDraft] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  // Guard against accidental edits: the page opens read-only until unlocked
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let active = true;
    createClient()
      .from('store_settings')
      .select('settings, updated_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          if (isMissingTableError(error)) setMissingTable(true);
          else showToast(friendlyDbError(error, MIGRATION), 'error');
          return;
        }
        const merged = mergeStoreSettings(data?.settings);
        setSaved(merged);
        setDraft(merged);
        setUpdatedAt(data?.updated_at || null);
      })
      .then(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [showToast]);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  const readOnly = !canEdit || missingTable || !unlocked;

  function set<S extends keyof StoreSettings, K extends keyof StoreSettings[S]>(section: S, key: K, value: StoreSettings[S][K]) {
    setDraft((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  }

  const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v)));

  function validate(s: StoreSettings): { tab: TabKey; message: string } | null {
    if (!s.store.name.trim()) return { tab: 'general', message: 'Store name is required' };
    if (s.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contact.email)) return { tab: 'general', message: 'Store email looks invalid' };
    if (s.store.websiteUrl.trim() && !/^https?:\/\//i.test(s.store.websiteUrl.trim()))
      return { tab: 'general', message: 'Website link must start with https://' };
    if (s.homepage.philosophyQuote.length > 220) return { tab: 'homepage', message: 'Keep the philosophy quote under 220 characters' };
    if (!s.payments.codEnabled && !s.payments.onlineEnabled) return { tab: 'payments', message: 'Enable at least one payment method' };
    if (s.commerce.gstRate < 0 || s.commerce.gstRate > 28) return { tab: 'tax', message: 'GST rate must be between 0 and 28%' };
    if (s.commerce.gstin && !/^[0-9A-Z]{15}$/.test(s.commerce.gstin)) return { tab: 'tax', message: 'GSTIN must be 15 letters/digits' };
    if (!/^[A-Z0-9]{1,6}$/.test(s.orders.numberPrefix)) return { tab: 'orders', message: 'Order prefix must be 1–6 letters or digits' };
    const ap = s.appointments;
    const toMin = (t: string) => {
      const m = /^(\d{2}):(\d{2})$/.exec(t);
      return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
    };
    const startMin = toMin(ap.startTime);
    const endMin = toMin(ap.endTime);
    if (Number.isNaN(startMin) || Number.isNaN(endMin)) return { tab: 'appointments', message: 'Enter a valid start and end time' };
    if (endMin - startMin < ap.slotMinutes) return { tab: 'appointments', message: 'End time must be later than start time by at least one slot' };
    if (!(SLOT_LENGTH_OPTIONS as readonly number[]).includes(ap.slotMinutes)) return { tab: 'appointments', message: 'Choose a slot length' };
    if (ap.daysAhead < 1 || ap.daysAhead > 60) return { tab: 'appointments', message: 'Booking window must be between 1 and 60 days' };
    if (ap.minLeadHours > 72) return { tab: 'appointments', message: 'Minimum notice can be at most 72 hours' };
    if (ap.closedDays.length >= 7) return { tab: 'appointments', message: 'Leave at least one day open for appointments' };
    const badUrl = Object.entries(s.social).find(([, url]) => url.trim() && !/^https?:\/\//i.test(url.trim()));
    if (badUrl) return { tab: 'social', message: `${badUrl[0]} link must start with https://` };
    return null;
  }

  async function handleSave() {
    const clean: StoreSettings = {
      ...draft,
      orders: { ...draft.orders, numberPrefix: draft.orders.numberPrefix.trim().toUpperCase() },
      announcement: { ...draft.announcement, messages: draft.announcement.messages.map((m) => m.trim()).filter(Boolean) },
    };
    const problem = validate(clean);
    if (problem) {
      setTab(problem.tab);
      showToast(problem.message, 'error');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await createClient().from('store_settings').upsert({ id: 1, settings: clean }).select('updated_at');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setSaved(clean);
      setDraft(clean);
      setUpdatedAt(data[0].updated_at);
      publishStoreSettings(clean);
      showToast('Settings saved — the store is updated', 'success');
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSaving(false);
    }
  }

  const activeTab = TABS.find((t) => t.key === tab)!;
  const d = draft;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6 pb-28">

      {/* Header + system access lock */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#2D2024]">Settings</h1>
          <p className="text-sm text-[#2D2024]/60 mt-1">
            Manage your store configuration.
            {updatedAt && <span className="text-[#2D2024]/45"> Last saved {formatDateTime(updatedAt)}.</span>}
          </p>
        </div>
        {canEdit && !missingTable && (
          <div className="flex items-center gap-3 bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl pl-3 pr-4 py-2.5 shadow-[0_2px_10px_rgba(45,32,36,0.05)] self-start">
            <div className="w-9 h-9 rounded-xl bg-[#F5EEE7] border border-[#E8D5C5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-[#2D2024]/70">{unlocked ? 'lock_open' : 'lock'}</span>
            </div>
            <div className="mr-2">
              <p className="text-[10px] uppercase tracking-widest text-[#2D2024]/55 font-semibold">System Access</p>
              <p className="text-xs text-[#2D2024] flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${unlocked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {unlocked ? 'Editing Enabled' : 'Read-Only Mode'}
              </p>
            </div>
            <Toggle
              checked={unlocked}
              onChange={(next) => {
                if (!next && dirty) {
                  showToast('Save or discard your changes before locking', 'error');
                  return;
                }
                setUnlocked(next);
              }}
              label={unlocked ? 'Lock settings' : 'Unlock settings for editing'}
            />
          </div>
        )}
      </div>

      <MigrationNotice migration={MIGRATION} show={missingTable} />
      {!canEdit && !missingTable && (
        <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl px-4 py-3 text-sm">
          <span className="material-symbols-outlined text-sky-600">visibility</span>
          Your role can view settings but not change them.
        </div>
      )}

      {loading ? (
        <div className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl">
          <LoadingState label="Loading settings..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Tabs: a scrollable strip on phones, a side list from tablet up */}
          <nav className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-2 flex md:flex-col gap-1 overflow-x-auto custom-scroll scroll-smooth md:sticky md:top-20 shadow-[0_2px_10px_rgba(45,32,36,0.05)]">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 md:px-3 md:py-2 md:text-xs lg:px-3.5 lg:py-2.5 lg:text-sm rounded-xl text-sm whitespace-nowrap text-left transition-colors ${
                    active ? 'bg-[#B99A62]/15 text-[#8A6F3C] font-medium' : 'text-[#2D2024]/75 hover:text-[#2D2024] hover:bg-[#F5EEE7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{t.icon}</span>
                  <span className="md:hidden">{t.shortLabel}</span>
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <section className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-5 sm:p-7 shadow-[0_2px_10px_rgba(45,32,36,0.05)] min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="font-headline-sm text-xl text-[#2D2024]">{activeTab.label}</h2>
              {readOnly && canEdit && !missingTable && (
                <span className="text-[11px] text-[#2D2024]/55 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Unlock System Access to edit
                </span>
              )}
            </div>

            <fieldset disabled={readOnly} className="space-y-5 min-w-0">
              {tab === 'general' && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 border border-[#E8D5C5] rounded-2xl p-5 bg-[#FAF7F2]/60">
                    <BrandImagePicker
                      title="Store Logo"
                      hint="Upload store company brand logo"
                      value={d.store.logoUrl}
                      onChange={(url) => set('store', 'logoUrl', url)}
                      accept={ACCEPTED_IMAGE_TYPES}
                      previewClass="w-32 h-20"
                      disabled={readOnly}
                    />
                    <BrandImagePicker
                      title="Site Favicon"
                      hint="Upload browser tab icon (1:1 aspect ratio)"
                      value={d.store.faviconUrl}
                      onChange={(url) => set('store', 'faviconUrl', url)}
                      accept={ACCEPTED_ICON_TYPES}
                      previewClass="w-20 h-20"
                      disabled={readOnly}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                    <div>
                      <Label htmlFor="g-name">Store Name *</Label>
                      <IconInput id="g-name" icon="storefront" value={d.store.name} onChange={(v) => set('store', 'name', v)} />
                    </div>
                    <div>
                      <Label htmlFor="g-company">Company Firm Name</Label>
                      <IconInput id="g-company" icon="apartment" value={d.store.companyName} onChange={(v) => set('store', 'companyName', v)} />
                    </div>
                    <div>
                      <Label htmlFor="g-email">Store Email</Label>
                      <IconInput id="g-email" icon="mail" type="email" inputMode="email" value={d.contact.email} onChange={(v) => set('contact', 'email', v)} />
                    </div>
                    <div>
                      <Label htmlFor="g-phone">Phone Number</Label>
                      <IconInput id="g-phone" icon="call" inputMode="tel" value={d.contact.phone} onChange={(v) => set('contact', 'phone', v)} placeholder="+91 800 123 4567" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="g-address">HQ Store Address</Label>
                    <IconTextarea id="g-address" icon="location_on" value={d.contact.address} onChange={(v) => set('contact', 'address', v)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                    <div>
                      <Label htmlFor="g-web">Store Website Link</Label>
                      <IconInput id="g-web" icon="language" type="url" inputMode="url" value={d.store.websiteUrl} onChange={(v) => set('store', 'websiteUrl', v)} placeholder="https://www.sushijewels.com" />
                    </div>
                    <div>
                      <Label htmlFor="g-wa" hint="With country code, e.g. 918001234567">WhatsApp Number</Label>
                      <IconInput id="g-wa" icon="chat" inputMode="numeric" value={d.contact.whatsapp} onChange={(v) => set('contact', 'whatsapp', v.replace(/[^\d]/g, ''))} />
                    </div>
                    <div>
                      <Label htmlFor="g-hours">Operating Hours (Weekdays)</Label>
                      <IconInput id="g-hours" icon="schedule" value={d.contact.hoursWeekdays} onChange={(v) => set('contact', 'hoursWeekdays', v)} placeholder="Mon – Sat: 11 AM – 6 PM" />
                    </div>
                    <div>
                      <Label htmlFor="g-sunday">Operating Hours (Sundays)</Label>
                      <IconInput id="g-sunday" icon="schedule" value={d.contact.hoursSunday} onChange={(v) => set('contact', 'hoursSunday', v)} placeholder="Sunday: 10 AM – 2 PM (leave empty if closed)" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="g-tagline">Tagline</Label>
                      <IconInput id="g-tagline" icon="auto_awesome" value={d.store.tagline} onChange={(v) => set('store', 'tagline', v)} placeholder="Fine Jewellery" />
                    </div>
                  </div>
                </>
              )}

              {tab === 'homepage' && (
                <>
                  <p className="text-xs text-[#2D2024]/55 -mt-2">
                    The &ldquo;Philosophy&rdquo; band on the homepage — the large quote next to the atelier photo.
                  </p>
                  <div>
                    <Label htmlFor="h-eyebrow" hint="Small label above the quote">Section Label</Label>
                    <IconInput id="h-eyebrow" icon="label" value={d.homepage.philosophyEyebrow} onChange={(v) => set('homepage', 'philosophyEyebrow', v)} placeholder="The Philosophy" />
                  </div>
                  <div>
                    <Label htmlFor="h-quote" hint={`${d.homepage.philosophyQuote.length}/220 characters — two short lines read best.`}>
                      Philosophy Quote
                    </Label>
                    <IconTextarea id="h-quote" icon="format_quote" rows={3} value={d.homepage.philosophyQuote} onChange={(v) => set('homepage', 'philosophyQuote', v)} />
                  </div>
                  <div>
                    <Label htmlFor="h-text" hint="Paragraph shown under the quote">Supporting Paragraph</Label>
                    <IconTextarea id="h-text" icon="notes" rows={4} value={d.homepage.philosophyText} onChange={(v) => set('homepage', 'philosophyText', v)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="h-founder">Founder / Signature Name</Label>
                      <IconInput id="h-founder" icon="person" value={d.homepage.founderName} onChange={(v) => set('homepage', 'founderName', v)} />
                    </div>
                    <div>
                      <Label htmlFor="h-role">Founder Title</Label>
                      <IconInput id="h-role" icon="work" value={d.homepage.founderTitle} onChange={(v) => set('homepage', 'founderTitle', v)} placeholder="Founding Atelier Artisans" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D2024] mb-1.5">Section Photo</p>
                    <p className="text-xs text-[#2D2024]/55 mb-3">Tall portrait image on the left. Leave empty to keep the current default photo.</p>
                    <div className="max-w-sm">
                      <ImageUploader
                        value={d.homepage.philosophyImageUrl}
                        onChange={(url) => set('homepage', 'philosophyImageUrl', url)}
                        folder="homepage"
                        label="Upload section photo"
                        aspectClass="aspect-[4/5]"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  {d.homepage.philosophyQuote.trim() && (
                    <div>
                      <p className="text-sm font-medium text-[#2D2024] mb-2">Preview</p>
                      <blockquote className="bg-white border border-[#E8D5C5] rounded-xl p-5 font-headline-lg text-[20px] leading-[1.35] text-[#2D2024]">
                        &ldquo;{d.homepage.philosophyQuote}&rdquo;
                      </blockquote>
                    </div>
                  )}
                </>
              )}

              {tab === 'payments' && (
                <>
                  <SwitchRow title="Cash on Delivery (COD)" hint="Customers pay in cash or UPI when the order arrives." checked={d.payments.codEnabled} onChange={(v) => set('payments', 'codEnabled', v)} disabled={readOnly} />
                  <SwitchRow title="Allow COD for Guest Users" hint="When disabled, guest users must log in to use Cash on Delivery." checked={d.payments.guestCodEnabled} onChange={(v) => set('payments', 'guestCodEnabled', v)} disabled={readOnly} />
                  <SwitchRow title="Online Payment (Card / UPI)" hint="Instant payment at checkout via Razorpay — configure the keys below." checked={d.payments.onlineEnabled} onChange={(v) => set('payments', 'onlineEnabled', v)} disabled={readOnly} />
                  <div className="max-w-md">
                    <Label htmlFor="p-codmax" hint="Orders above this must be paid online. 0 = no limit.">Max Order Value for COD</Label>
                    <IconInput id="p-codmax" icon="payments" prefix="₹" type="number" min={0} value={d.payments.codMaxOrderValue} onChange={(v) => set('payments', 'codMaxOrderValue', num(v))} />
                  </div>
                  {!d.payments.codEnabled && !d.payments.onlineEnabled && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">At least one payment method must stay enabled.</p>
                  )}

                  <div className="border-t border-[#E8D5C5] pt-5 mt-2">
                    <RazorpayPanel readOnly={readOnly} />
                  </div>
                </>
              )}

              {tab === 'tax' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="t-gst" hint="3% is the standard GST rate for gold and diamond jewellery.">GST Rate (%)</Label>
                    <IconInput id="t-gst" icon="percent" type="number" min={0} max={28} step="0.01" value={d.commerce.gstRate} onChange={(v) => set('commerce', 'gstRate', num(v))} />
                  </div>
                  <div>
                    <Label htmlFor="t-gstin" hint="15-character GST registration number.">GSTIN</Label>
                    <IconInput id="t-gstin" icon="badge" maxLength={15} value={d.commerce.gstin} onChange={(v) => set('commerce', 'gstin', v.toUpperCase().replace(/[^0-9A-Z]/g, ''))} className="font-mono uppercase" />
                  </div>
                </div>
              )}

              {tab === 'shipping' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="s-free" hint="Orders at or above this amount ship free.">Free Shipping Above</Label>
                      <IconInput id="s-free" icon="local_shipping" prefix="₹" type="number" min={0} value={d.commerce.freeShippingThreshold} onChange={(v) => set('commerce', 'freeShippingThreshold', num(v))} />
                    </div>
                    <div>
                      <Label htmlFor="s-fee" hint="Charged on smaller orders. 0 = always free.">Flat Shipping Fee</Label>
                      <IconInput id="s-fee" icon="payments" prefix="₹" type="number" min={0} value={d.commerce.shippingFee} onChange={(v) => set('commerce', 'shippingFee', num(v))} />
                    </div>
                  </div>
                  <p className="text-xs text-[#2D2024]/65 bg-[#FAF7F2] border border-[#E8D5C5] rounded-xl px-4 py-3">
                    Example: a {formatINR(1500)} order pays{' '}
                    {1500 >= d.commerce.freeShippingThreshold || d.commerce.shippingFee === 0 ? 'no shipping' : formatINR(d.commerce.shippingFee)}; orders of{' '}
                    {formatINR(d.commerce.freeShippingThreshold)} or more ship free.
                  </p>
                </>
              )}

              {tab === 'orders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="o-prefix" hint={`New orders look like ${d.orders.numberPrefix || 'SJ'}-123456.`}>Order Number Prefix</Label>
                    <IconInput
                      id="o-prefix"
                      icon="tag"
                      maxLength={6}
                      value={d.orders.numberPrefix}
                      onChange={(v) => set('orders', 'numberPrefix', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="o-min" hint="Checkout is blocked below this subtotal. 0 = no minimum.">Minimum Order Value</Label>
                    <IconInput id="o-min" icon="shopping_cart" prefix="₹" type="number" min={0} value={d.orders.minOrderValue} onChange={(v) => set('orders', 'minOrderValue', num(v))} />
                  </div>
                </div>
              )}

              {tab === 'appointments' && (
                <>
                  <p className="text-xs text-[#2D2024]/55 -mt-2">
                    When customers can book a video consultation on the website. All times are Indian Standard Time (IST). Existing bookings are never changed.
                  </p>
                  <SwitchRow
                    title="Accept new bookings"
                    hint="Turn off to temporarily hide the booking page's slots (e.g. during holidays)."
                    checked={d.appointments.enabled}
                    onChange={(v) => set('appointments', 'enabled', v)}
                    disabled={readOnly}
                  />
                  <SwitchRow
                    title="Let customers enter their own time"
                    hint="Adds an 'Enter a different time' option on the booking page. Any time inside opening hours is accepted; you still confirm each booking."
                    checked={d.appointments.allowCustomTime}
                    onChange={(v) => set('appointments', 'allowCustomTime', v)}
                    disabled={readOnly}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="ap-start" hint="First call of the day starts at this time.">Opening Time</Label>
                      <IconInput id="ap-start" icon="schedule" type="time" value={d.appointments.startTime} onChange={(v) => set('appointments', 'startTime', v)} />
                    </div>
                    <div>
                      <Label htmlFor="ap-end" hint="The last call must finish by this time.">Closing Time</Label>
                      <IconInput id="ap-end" icon="schedule" type="time" value={d.appointments.endTime} onChange={(v) => set('appointments', 'endTime', v)} />
                    </div>
                    <div>
                      <Label htmlFor="ap-len" hint="Length of each video call.">Slot Length</Label>
                      <select
                        id="ap-len"
                        value={d.appointments.slotMinutes}
                        onChange={(e) => set('appointments', 'slotMinutes', Number(e.target.value))}
                        className={`${fieldClass} px-4 py-2.5`}
                      >
                        {SLOT_LENGTH_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m} minutes</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ap-days" hint="How many days ahead customers can book (1–60).">Booking Window (days)</Label>
                      <IconInput id="ap-days" icon="date_range" type="number" min={1} max={60} value={d.appointments.daysAhead} onChange={(v) => set('appointments', 'daysAhead', Math.min(60, Math.max(1, num(v))))} />
                    </div>
                    <div>
                      <Label htmlFor="ap-lead" hint="Customers can't book a slot starting sooner than this. 0 = no limit.">Minimum Notice (hours)</Label>
                      <IconInput id="ap-lead" icon="hourglass_top" type="number" min={0} max={72} value={d.appointments.minLeadHours} onChange={(v) => set('appointments', 'minLeadHours', Math.min(72, num(v)))} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D2024] mb-1.5">Open Days</p>
                    <p className="text-xs text-[#2D2024]/55 mb-3">Untick the days you do not take video calls.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => {
                        const closed = d.appointments.closedDays.includes(String(i));
                        return (
                          <button
                            key={label}
                            type="button"
                            aria-pressed={!closed}
                            onClick={() =>
                              set(
                                'appointments',
                                'closedDays',
                                closed ? d.appointments.closedDays.filter((x) => x !== String(i)) : [...d.appointments.closedDays, String(i)]
                              )
                            }
                            className={`min-w-[56px] px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${
                              closed ? 'bg-[#FAF7F2] border-[#E8D5C5] text-[#2D2024]/45 line-through' : 'bg-[#B99A62]/15 border-[#B99A62] text-[#8A6F3C]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {tab === 'social' && (
                <>
                  <p className="text-xs text-[#2D2024]/55 -mt-2">Shown as icons in the store footer. Leave a field empty to hide that icon.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(
                      [
                        ['instagram', 'Instagram', 'photo_camera'],
                        ['facebook', 'Facebook', 'thumb_up'],
                        ['youtube', 'YouTube', 'smart_display'],
                        ['pinterest', 'Pinterest', 'push_pin'],
                      ] as const
                    ).map(([key, label, icon]) => (
                      <div key={key}>
                        <Label htmlFor={`so-${key}`}>{label}</Label>
                        <IconInput
                          id={`so-${key}`}
                          icon={icon}
                          type="url"
                          inputMode="url"
                          value={d.social[key]}
                          onChange={(v) => set('social', key, v)}
                          placeholder={`https://${key}.com/yourbrand`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === 'announcement' && (
                <>
                  <SwitchRow title="Show announcement bar" hint="The strip at the very top of every store page." checked={d.announcement.enabled} onChange={(v) => set('announcement', 'enabled', v)} disabled={readOnly} />
                  <div className="space-y-2.5">
                    <p className="text-sm font-medium text-[#2D2024]">Messages</p>
                    {d.announcement.messages.map((msg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <IconInput
                            id={`an-${i}`}
                            icon="campaign"
                            value={msg}
                            onChange={(v) => set('announcement', 'messages', d.announcement.messages.map((m, j) => (j === i ? v : m)))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => set('announcement', 'messages', d.announcement.messages.filter((_, j) => j !== i))}
                          className="p-2 rounded-full text-[#2D2024]/50 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                          aria-label={`Remove message ${i + 1}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    {d.announcement.messages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => set('announcement', 'messages', [...d.announcement.messages, ''])}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8A6F3C] hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add message
                      </button>
                    )}
                    <p className="text-xs text-[#2D2024]/55">Mobile shows only the first message; the middle one is highlighted on desktop.</p>
                  </div>
                  {d.announcement.enabled && d.announcement.messages.some((m) => m.trim()) && (
                    <div>
                      <p className="text-sm font-medium text-[#2D2024] mb-2">Preview</p>
                      <div className="rounded-xl bg-[#2D2024] text-[#FAF7F2] text-[11px] tracking-wider text-center py-2.5 px-4">
                        {d.announcement.messages.filter((m) => m.trim()).join('  ·  ')}
                      </div>
                    </div>
                  )}
                </>
              )}
            </fieldset>
          </section>
        </div>
      )}

      {/* Save bar — always visible (not just once something changes), so the
          button is never hidden off-screen or easy to miss; Discard/Save just
          stay disabled when there's nothing to save. */}
      {canEdit && !missingTable && !loading && (
        <div className="fixed bottom-0 right-0 left-0 lg:left-72 z-30 border-t border-[#E8D5C5] bg-[#FFFCF7]/95 backdrop-blur-sm px-4 sm:px-8 lg:px-10 py-3 flex items-center justify-end gap-3">
          <span className="mr-auto text-sm text-[#2D2024]/70 flex items-center gap-2">
            {dirty ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                You have unsaved changes
              </>
            ) : readOnly ? (
              'Unlock System Access to edit'
            ) : (
              'No changes to save'
            )}
          </span>
          <SecondaryButton onClick={() => setDraft(saved)} disabled={saving || !dirty}>
            Discard
          </SecondaryButton>
          <PrimaryButton icon="save" onClick={handleSave} loading={saving} disabled={readOnly}>
            {saving ? 'Saving…' : 'Save Changes'}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
