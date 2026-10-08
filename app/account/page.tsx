"use client";

import React, { useEffect, useState } from 'react';
import Spinner, { LoadingLabel } from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { createClient } from '@/lib/supabase/client';
import {
  ADDRESS_FIELD_LABELS,
  ADDRESS_FIELD_ORDER,
  PROFILE_FIELD_LABELS,
  PROFILE_FIELD_ORDER,
  phoneDigits,
  validateAddressBook,
  validateProfile,
  type AddressField,
  type ProfileField,
} from '@/lib/formValidation';
import StateCitySelect from '@/components/ui/StateCitySelect';
import { canonicalState, canonicalCity } from '@/lib/indianStatesCities';
import UseCurrentLocationButton, { type DetectedLocation } from '@/components/ui/UseCurrentLocationButton';
import AddressSuggestionsDropdown from '@/components/ui/AddressSuggestionsDropdown';
import { useAddressAutocomplete } from '@/lib/hooks/useAddressAutocomplete';
import AvatarCircle from '@/components/ui/AvatarCircle';
import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';

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
  const sidebarAvatar = useAvatarUpload();
  const personalAvatar = useAvatarUpload();

  // Addresses
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesUnavailable, setAddressesUnavailable] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | 'new' | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AddressRow | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [defaultingId, setDefaultingId] = useState<string | null>(null);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const { suggestions: addressSuggestions, isLoading: addressSuggestionsLoading } = useAddressAutocomplete(addressForm.address);

  // Field-level validation: an error shows once the field was visited (blur) or Save was pressed
  const [profileTouched, setProfileTouched] = useState<Partial<Record<ProfileField, boolean>>>({});
  const [profileAttempted, setProfileAttempted] = useState(false);
  const [addressTouched, setAddressTouched] = useState<Partial<Record<AddressField, boolean>>>({});
  const [addressAttempted, setAddressAttempted] = useState(false);

  const profileErrors = validateProfile({ fullName, phone });
  const profileError = (field: ProfileField) => (profileTouched[field] || profileAttempted ? profileErrors[field] : undefined);
  const addressErrors = validateAddressBook({
    label: addressForm.label,
    fullName: addressForm.full_name,
    phone: addressForm.phone,
    address: addressForm.address,
    city: addressForm.city,
    state: addressForm.state,
    pincode: addressForm.pincode,
  });
  const addressError = (field: AddressField) => (addressTouched[field] || addressAttempted ? addressErrors[field] : undefined);

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
    setProfileAttempted(true);
    const badProfile = PROFILE_FIELD_ORDER.filter((field) => profileErrors[field]);
    if (badProfile.length > 0) {
      showToast(`Please fix: ${badProfile.map((field) => PROFILE_FIELD_LABELS[field]).join(', ')}.`, 'warning');
      document.getElementById(`profile-${badProfile[0]}`)?.focus();
      return;
    }
    setSavingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phoneDigits(phone) ?? '' })
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
    setAddressTouched({});
    setAddressAttempted(false);
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
    setAddressTouched({});
    setAddressAttempted(false);
    setEditingAddressId(a.id);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editingAddressId) return;
    setAddressAttempted(true);
    const badAddress = ADDRESS_FIELD_ORDER.filter((field) => addressErrors[field]);
    if (badAddress.length > 0) {
      showToast(`Please fix: ${badAddress.map((field) => ADDRESS_FIELD_LABELS[field]).join(', ')}.`, 'warning');
      document.getElementById(`address-${badAddress[0]}`)?.focus();
      return;
    }
    const digits = addressForm.pincode.trim();
    setSavingAddress(true);
    try {
      const payload = {
        user_id: user.id,
        label: addressForm.label.trim() || 'Home',
        full_name: addressForm.full_name.trim(),
        phone: phoneDigits(addressForm.phone) ?? addressForm.phone.trim(),
        address: addressForm.address.trim(),
        city: canonicalCity(addressForm.state, addressForm.city),
        state: canonicalState(addressForm.state) ?? addressForm.state.trim(),
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
    if (!deleteTarget || deletingAddress) return;
    setDeletingAddress(true);
    try {
      const { data, error } = await supabase.from('customer_addresses').delete().eq('id', deleteTarget.id).select('id');
      if (error || !data?.length) throw error || new Error('permission denied');
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast('Address removed.', 'info');
    } catch (err) {
      console.error('Error deleting address:', err);
      showToast('Could not remove this address. Please try again.', 'error');
    } finally {
      setDeletingAddress(false);
      setDeleteTarget(null);
    }
  }

  async function handleSetDefault(a: AddressRow) {
    if (defaultingId) return;
    setDefaultingId(a.id);
    try {
      const { data, error } = await supabase.from('customer_addresses').update({ is_default: true }).eq('id', a.id).select('id');
      if (error || !data?.length) throw error || new Error('permission denied');
      setAddresses((prev) => prev.map((row) => ({ ...row, is_default: row.id === a.id })));
    } catch (err) {
      console.error('Error setting default address:', err);
      showToast('Could not update the default address.', 'error');
    } finally {
      setDefaultingId(null);
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
  /** Same look as inputClass, with a red border when the field has an error. */
  const inputClassFor = (error?: string) =>
    `w-full bg-surface border rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none transition-colors ${
      error ? 'border-error focus:border-error bg-error-container/10' : 'border-outline-variant focus:border-primary'
    }`;
  const renderFieldError = (id: string, message?: string) =>
    message ? (
      <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-xs text-error">
        <span className="material-symbols-outlined text-[14px] leading-4">error</span>
        <span>{message}</span>
      </p>
    ) : null;

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
                <AvatarCircle
                  avatarUrl={sidebarAvatar.avatarUrl}
                  fullName={fullName}
                  size={48}
                  isUploading={sidebarAvatar.isUploading}
                  showCameraBadge
                  onClick={sidebarAvatar.openPicker}
                />
                <input
                  ref={sidebarAvatar.inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={sidebarAvatar.handleFileSelected}
                />
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

                {/* Profile photo */}
                <div className="flex items-center gap-5 mb-8 pb-6 border-b border-outline-variant/30 max-w-md">
                  <AvatarCircle
                    avatarUrl={personalAvatar.avatarUrl}
                    fullName={fullName}
                    size={80}
                    isUploading={personalAvatar.isUploading}
                    className="shadow-[0_4px_14px_rgba(45,32,36,0.12)] border-2 border-[#E8D5C5]"
                  />
                  <input
                    ref={personalAvatar.inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={personalAvatar.handleFileSelected}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={personalAvatar.openPicker}
                        disabled={personalAvatar.isUploading}
                        className="inline-flex items-center gap-1.5 bg-primary text-surface px-4 py-2 rounded-full font-label-sm text-label-sm uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                        Upload Photo
                      </button>
                      {personalAvatar.avatarUrl && (
                        <button
                          type="button"
                          onClick={personalAvatar.handleRemove}
                          disabled={personalAvatar.isUploading}
                          className="inline-flex items-center gap-1.5 text-error font-label-sm text-label-sm uppercase tracking-wider hover:underline disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2">
                      Supports JPG, PNG or WEBP (Max 3MB). Square aspect ratio looks best.
                    </p>
                  </div>
                </div>

                {profileLoading ? (
                  <div className="animate-pulse space-y-4 max-w-md">
                    <div className="h-10 bg-surface-container rounded-lg" />
                    <div className="h-10 bg-surface-container rounded-lg" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} noValidate className="space-y-5 max-w-md">
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={user.email || ''} disabled className={`${inputClass} bg-surface-container-low text-on-surface-variant cursor-not-allowed`} />
                    </div>
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input
                        id="profile-fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => setProfileTouched((p) => ({ ...p, fullName: true }))}
                        placeholder="Your full name"
                        maxLength={100}
                        autoComplete="name"
                        aria-invalid={profileError('fullName') ? true : undefined}
                        aria-describedby={profileError('fullName') ? 'profile-fullName-error' : undefined}
                        className={inputClassFor(profileError('fullName'))}
                      />
                      {renderFieldError('profile-fullName', profileError('fullName'))}
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number <span className="normal-case tracking-normal text-on-surface-variant/70">(optional)</span></label>
                      <input
                        id="profile-phone"
                        type="tel"
                        inputMode="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        onBlur={() => setProfileTouched((p) => ({ ...p, phone: true }))}
                        placeholder="10-digit mobile number"
                        autoComplete="tel-national"
                        aria-invalid={profileError('phone') ? true : undefined}
                        aria-describedby={profileError('phone') ? 'profile-phone-error' : undefined}
                        className={inputClassFor(profileError('phone'))}
                      />
                      {renderFieldError('profile-phone', profileError('phone'))}
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
                    <p className="text-body-sm text-on-surface-variant">Save multiple addresses (Home, Work, etc.) for seamless checkout.</p>
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
                  <form onSubmit={handleSaveAddress} noValidate className="space-y-5 max-w-lg">
                    <div className="flex items-center gap-3 flex-wrap bg-surface-container-low/60 border border-outline-variant/30 rounded-xl px-4 py-3">
                      <UseCurrentLocationButton
                        onLocationDetected={(location: DetectedLocation) =>
                          setAddressForm((p) => ({
                            ...p,
                            address: location.address,
                            city: location.city,
                            state: location.state,
                            pincode: location.pincode || p.pincode,
                          }))
                        }
                      />
                      <p className="text-xs text-on-surface-variant">Auto-fill address, city, state &amp; pincode from your location.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Address Type / Label</label>
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        {[
                          { key: 'Home', icon: 'home', text: 'Home' },
                          { key: 'Work', icon: 'apartment', text: 'Work' },
                          { key: 'Other', icon: 'location_on', text: 'Other' },
                        ].map((chip) => {
                          const isSelected =
                            chip.key === 'Home'
                              ? addressForm.label === 'Home'
                              : chip.key === 'Work'
                              ? addressForm.label === 'Work' || addressForm.label === 'Office'
                              : addressForm.label !== 'Home' && addressForm.label !== 'Work' && addressForm.label !== 'Office';
                          return (
                            <button
                              key={chip.key}
                              type="button"
                              onClick={() => {
                                if (chip.key === 'Home') setAddressForm((p) => ({ ...p, label: 'Home' }));
                                else if (chip.key === 'Work') setAddressForm((p) => ({ ...p, label: 'Work' }));
                                else if (chip.key === 'Other' && (addressForm.label === 'Home' || addressForm.label === 'Work' || addressForm.label === 'Office')) {
                                  setAddressForm((p) => ({ ...p, label: '' }));
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                                isSelected
                                  ? 'bg-primary text-surface shadow-sm'
                                  : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                              {chip.text}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        id="address-label"
                        type="text"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                        onBlur={() => setAddressTouched((p) => ({ ...p, label: true }))}
                        placeholder="Home, Work, Studio, etc."
                        maxLength={30}
                        aria-invalid={addressError('label') ? true : undefined}
                        aria-describedby={addressError('label') ? 'address-label-error' : undefined}
                        className={inputClassFor(addressError('label'))}
                      />
                      {renderFieldError('address-label', addressError('label'))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                          id="address-fullName"
                          type="text"
                          required
                          maxLength={100}
                          autoComplete="name"
                          value={addressForm.full_name}
                          onChange={(e) => setAddressForm((p) => ({ ...p, full_name: e.target.value }))}
                          onBlur={() => setAddressTouched((p) => ({ ...p, fullName: true }))}
                          aria-invalid={addressError('fullName') ? true : undefined}
                          aria-describedby={addressError('fullName') ? 'address-fullName-error' : undefined}
                          className={inputClassFor(addressError('fullName'))}
                        />
                        {renderFieldError('address-fullName', addressError('fullName'))}
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          id="address-phone"
                          type="tel"
                          required
                          inputMode="tel"
                          maxLength={10}
                          autoComplete="tel-national"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                          onBlur={() => setAddressTouched((p) => ({ ...p, phone: true }))}
                          aria-invalid={addressError('phone') ? true : undefined}
                          aria-describedby={addressError('phone') ? 'address-phone-error' : undefined}
                          className={inputClassFor(addressError('phone'))}
                        />
                        {renderFieldError('address-phone', addressError('phone'))}
                      </div>
                    </div>
                    <div className="relative">
                      <label className={labelClass}>Address</label>
                      <textarea
                        id="address-address"
                        required
                        rows={2}
                        maxLength={200}
                        autoComplete="street-address"
                        value={addressForm.address}
                        onChange={(e) => {
                          setAddressForm((p) => ({ ...p, address: e.target.value }));
                          setShowAddressSuggestions(true);
                        }}
                        onFocus={() => setShowAddressSuggestions(true)}
                        onBlur={() => {
                          setAddressTouched((p) => ({ ...p, address: true }));
                          setShowAddressSuggestions(false);
                        }}
                        aria-invalid={addressError('address') ? true : undefined}
                        aria-describedby={addressError('address') ? 'address-address-error' : undefined}
                        className={`${inputClassFor(addressError('address'))} resize-none`}
                        placeholder="House / Flat No., Street, Landmark"
                      />
                      <AddressSuggestionsDropdown
                        suggestions={addressSuggestions}
                        isLoading={addressSuggestionsLoading}
                        visible={showAddressSuggestions}
                        onPick={(s) =>
                          setAddressForm((p) => ({
                            ...p,
                            address: s.address,
                            city: s.city || p.city,
                            state: s.state || p.state,
                            pincode: s.pincode || p.pincode,
                          }))
                        }
                      />
                      {renderFieldError('address-address', addressError('address'))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <StateCitySelect
                        idPrefix="address"
                        state={addressForm.state}
                        city={addressForm.city}
                        onChange={({ state, city }) => setAddressForm((p) => ({ ...p, state, city }))}
                        onBlurField={(field) => setAddressTouched((p) => ({ ...p, [field]: true }))}
                        stateError={addressError('state')}
                        cityError={addressError('city')}
                        controlClass={inputClassFor}
                        labelClass={labelClass}
                        renderError={(field, message) => renderFieldError(`address-${field}`, message)}
                      />
                      <div>
                        <label className={labelClass}>Pincode</label>
                        <input
                          id="address-pincode"
                          type="text"
                          required
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="postal-code"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                          onBlur={() => setAddressTouched((p) => ({ ...p, pincode: true }))}
                          aria-invalid={addressError('pincode') ? true : undefined}
                          aria-describedby={addressError('pincode') ? 'address-pincode-error' : undefined}
                          className={inputClassFor(addressError('pincode'))}
                        />
                        {renderFieldError('address-pincode', addressError('pincode'))}
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
                    {addresses.map((a) => {
                      const isHome = a.label.toLowerCase().includes('home');
                      const isOffice = a.label.toLowerCase().includes('office') || a.label.toLowerCase().includes('work');
                      const icon = isHome ? 'home' : isOffice ? 'apartment' : 'location_on';
                      return (
                        <div key={a.id} className={`border rounded-xl p-4 relative ${a.is_default ? 'border-primary bg-primary/5' : 'border-outline-variant/50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold">
                              <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span>
                              {a.label}
                            </span>
                            {a.is_default && (
                              <span className="text-[10px] uppercase tracking-wider bg-primary text-surface px-2 py-0.5 rounded-full font-semibold">Default</span>
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
                              <button onClick={() => handleSetDefault(a)} disabled={!!defaultingId} aria-busy={defaultingId === a.id || undefined} className="text-xs font-medium text-on-surface-variant hover:text-primary flex items-center gap-1 disabled:opacity-60 disabled:cursor-wait">
                                {defaultingId === a.id ? <Spinner size={15} /> : <span className="material-symbols-outlined text-[15px]">star</span>}Set Default
                              </button>
                            )}
                            <button onClick={() => setDeleteTarget(a)} className="text-xs font-medium text-error hover:underline flex items-center gap-1 ml-auto">
                              <span className="material-symbols-outlined text-[15px]">delete</span>Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick Add Another Address card */}
                    <button
                      type="button"
                      onClick={startNewAddress}
                      className="border-2 border-dashed border-outline-variant/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary hover:border-primary transition-colors min-h-[160px] bg-surface-container-low/30 hover:bg-surface-container-low"
                    >
                      <span className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">add</span>
                      </span>
                      <span className="text-sm font-medium">Add Another Address</span>
                      <span className="text-xs text-on-surface-variant/70">(Home, Work, etc.)</span>
                    </button>
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
              <button onClick={handleDeleteAddress} disabled={deletingAddress} aria-busy={deletingAddress || undefined} className="px-5 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider bg-error text-surface hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait">
                <LoadingLabel loading={deletingAddress} loadingText="Removing…">Remove</LoadingLabel>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
