"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { createClient } from '@/lib/supabase/client';

type Tab = 'personal' | 'addresses' | 'security';

interface AddressRow {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const emptyAddressForm = { label: 'Home', full_name: '', phone: '', address: '', city: '', state: '', pincode: '', is_default: false };

function isMissingTable(err: unknown) {
  const message = (err as { message?: string })?.message || '';
  const code = (err as { code?: string })?.code || '';
  return code === '42P01' || code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(message);
}

export default function AccountPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [tab, setTab] = useState<Tab>('personal');

  // Personal info
  const [profileLoading, setProfileLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesUnavailable, setAddressesUnavailable] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | 'new' | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AddressRow | null>(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/account');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setProfileLoading(true);
      const { data, error } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
      if (!error && data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
      setProfileLoading(false);
    }
    loadProfile();
  }, [user, supabase]);

  useEffect(() => {
    async function loadAddresses() {
      if (!user) return;
      setAddressesLoading(true);
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        if (isMissingTable(error)) setAddressesUnavailable(true);
        else console.error('Error loading addresses:', error);
      } else {
        setAddresses(data || []);
      }
      setAddressesLoading(false);
    }
    loadAddresses();
  }, [user, supabase]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq('id', user.id)
        .select('id');
      if (error || !data?.length) throw error || new Error('permission denied');
      showToast('Profile details updated successfully.', 'success');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Could not update your profile. Please try again.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  function startNewAddress() {
    setAddressForm({ ...emptyAddressForm, full_name: fullName, phone });
    setEditingAddressId('new');
  }

  function startEditAddress(a: AddressRow) {
    setAddressForm({
      label: a.label,
      full_name: a.full_name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      is_default: a.is_default,
    });
    setEditingAddressId(a.id);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editingAddressId) return;
    const digits = addressForm.pincode.replace(/\D/g, '');
    if (digits.length !== 6) {
      showToast('Please enter a valid 6-digit pincode.', 'warning');
      return;
    }
    setSavingAddress(true);
    try {
      const payload = {
        user_id: user.id,
        label: addressForm.label.trim() || 'Home',
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        address: addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: digits,
        is_default: addressForm.is_default,
      };
      if (editingAddressId === 'new') {
        const { data, error } = await supabase.from('customer_addresses').insert(payload).select('*').single();
        if (error) throw error;
        setAddresses((prev) => [data, ...(payload.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev)]);
      } else {
        const { data, error } = await supabase
          .from('customer_addresses')
          .update(payload)
          .eq('id', editingAddressId)
          .select('*')
          .single();
        if (error) throw error;
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddressId ? data : payload.is_default ? { ...a, is_default: false } : a))
        );
      }
      showToast('Address saved successfully.', 'success');
      setEditingAddressId(null);
    } catch (err) {
      console.error('Error saving address:', err);
      showToast('Could not save this address. Please try again.', 'error');
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress() {
    if (!deleteTarget) return;
    try {
      const { data, error } = await supabase.from('customer_addresses').delete().eq('id', deleteTarget.id).select('id');
      if (error || !data?.length) throw error || new Error('permission denied');
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast('Address removed.', 'info');
    } catch (err) {
      console.error('Error deleting address:', err);
      showToast('Could not remove this address. Please try again.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleSetDefault(a: AddressRow) {
    try {
      const { data, error } = await supabase.from('customer_addresses').update({ is_default: true }).eq('id', a.id).select('id');
      if (error || !data?.length) throw error || new Error('permission denied');
      setAddresses((prev) => prev.map((row) => ({ ...row, is_default: row.id === a.id })));
    } catch (err) {
      console.error('Error setting default address:', err);
      showToast('Could not update the default address.', 'error');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'warning');
      return;
    }
    setChangingPassword(true);
    try {
      // Supabase's updateUser doesn't check the current password, so we
      // verify it ourselves first by re-authenticating.
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (reauthError) {
        showToast('Current password is incorrect.', 'error');
        setChangingPassword(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      showToast('Could not update your password. Please try again.', 'error');
    } finally {
      setChangingPassword(false);
    }
  }

  if (authLoading || !user) {
    return (
      <>
        <AnnouncementBar />
        <Header />
        <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-16 pt-20 pb-20 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-surface-container mb-4"></div>
            <div className="h-6 w-32 bg-surface-container rounded mb-2"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'personal', label: 'Personal Info', icon: 'badge' },
    { key: 'addresses', label: 'Delivery Addresses', icon: 'location_on' },
    { key: 'security', label: 'Security', icon: 'lock' },
  ];

  const inputClass =
    'w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors';
  const labelClass = 'text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block';

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-[26px] sm:text-display-md text-primary font-normal mb-2">My Profile</h1>
          <p className="text-body-md text-on-surface-variant">Manage your personal details, addresses and account security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-secondary/15 text-secondary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-primary truncate">{fullName || 'Welcome'}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                </div>
              </div>
              <nav className="py-2">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                      tab === t.key ? 'text-primary bg-primary/5 border-r-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Links */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden">
              <p className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant border-b border-outline-variant/30">
                Quick Links
              </p>
              <Link href="/orders" className="flex items-center gap-3 px-5 py-3 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-secondary text-[19px]">package_2</span>My Orders
              </Link>
              <Link href="/wishlist" className="flex items-center gap-3 px-5 py-3 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-secondary text-[19px]">favorite</span>Wishlist
              </Link>
            </div>
          </aside>

          {/* Content */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-8 min-h-[420px]">
            {tab === 'personal' && (
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Personal Info</h2>
                <p className="text-body-sm text-on-surface-variant mb-6">Update your name and phone number.</p>
                {profileLoading ? (
                  <div className="animate-pulse space-y-4 max-w-md">
                    <div className="h-10 bg-surface-container rounded-lg" />
                    <div className="h-10 bg-surface-container rounded-lg" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-5 max-w-md">
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={user.email || ''} disabled className={`${inputClass} bg-surface-container-low text-on-surface-variant cursor-not-allowed`} />
                    </div>
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number</label>
                      <input
                        type="tel"
                        inputMode="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="bg-primary text-surface px-7 py-3 rounded-full font-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {savingProfile && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                      {savingProfile ? 'Saving…' : 'Save Profile'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {tab === 'addresses' && (
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Delivery Addresses</h2>
                    <p className="text-body-sm text-on-surface-variant">Save addresses for faster checkout.</p>
                  </div>
                  {editingAddressId === null && !addressesUnavailable && (
                    <button
                      onClick={startNewAddress}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-primary text-surface px-4 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider hover:bg-tertiary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>Add New
                    </button>
                  )}
                </div>

                {addressesUnavailable ? (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
                    <span className="material-symbols-outlined text-amber-600">database</span>
                    <p>
                      This section needs its database table. Run{' '}
                      <code className="font-mono text-xs bg-white/70 px-1.5 py-0.5 rounded">014_customer_account.sql</code> in the Supabase SQL editor,
                      then refresh.
                    </p>
                  </div>
                ) : editingAddressId !== null ? (
                  <form onSubmit={handleSaveAddress} className="space-y-5 max-w-lg">
                    <div>
                      <label className={labelClass}>Label</label>
                      <input
                        type="text"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                        placeholder="Home, Work, etc."
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Recipient Name</label>
                        <input
                          type="text"
                          required
                          value={addressForm.full_name}
                          onChange={(e) => setAddressForm((p) => ({ ...p, full_name: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <textarea
                        required
                        rows={2}
                        value={addressForm.address}
                        onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))}
                        className={`${inputClass} resize-none`}
                        placeholder="House / Flat No., Street, Landmark"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>City</label>
                        <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>State</label>
                        <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Pincode</label>
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          maxLength={6}
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={addressForm.is_default}
                        onChange={(e) => setAddressForm((p) => ({ ...p, is_default: e.target.checked }))}
                        className="accent-primary rounded"
                      />
                      <span className="text-sm text-on-surface-variant">Set as default address</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="bg-primary text-surface px-7 py-3 rounded-full font-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-60 flex items-center gap-2"
                      >
                        {savingAddress && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                        {savingAddress ? 'Saving…' : 'Save Address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAddressId(null)}
                        className="px-6 py-3 rounded-full font-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : addressesLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-24 bg-surface-container rounded-xl" />
                    <div className="h-24 bg-surface-container rounded-xl" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-14 border border-dashed border-outline-variant/50 rounded-xl">
                    <span className="material-symbols-outlined text-[36px] text-outline mb-2 block">location_off</span>
                    <p className="text-on-surface-variant text-sm">No saved addresses yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((a) => (
                      <div key={a.id} className={`border rounded-xl p-4 relative ${a.is_default ? 'border-primary bg-primary/5' : 'border-outline-variant/50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-label-md text-label-md text-primary">{a.label}</span>
                          {a.is_default && (
                            <span className="text-[10px] uppercase tracking-wider bg-primary text-surface px-2 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-on-surface">{a.full_name}</p>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {a.address}, {a.city}, {a.state} {a.pincode}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">{a.phone}</p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant/30">
                          <button onClick={() => startEditAddress(a)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">edit</span>Edit
                          </button>
                          {!a.is_default && (
                            <button onClick={() => handleSetDefault(a)} className="text-xs font-medium text-on-surface-variant hover:text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">star</span>Set Default
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(a)} className="text-xs font-medium text-error hover:underline flex items-center gap-1 ml-auto">
                            <span className="material-symbols-outlined text-[15px]">delete</span>Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'security' && (
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Security</h2>
                <p className="text-body-sm text-on-surface-variant mb-6">Change your account password.</p>
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-primary text-surface px-7 py-3 rounded-full font-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {changingPassword && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                    {changingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-surface rounded-xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Remove this address?</h3>
            <p className="text-body-sm text-on-surface-variant mb-6">
              &ldquo;{deleteTarget.label}&rdquo; will be permanently removed from your saved addresses.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAddress} className="px-5 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider bg-error text-surface hover:opacity-90 transition-opacity">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
