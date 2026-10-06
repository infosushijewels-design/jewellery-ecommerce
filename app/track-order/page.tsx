"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { useAuth } from '@/lib/context/AuthContext';
import type { FullOrder } from '@/lib/supabase/orderService';
import { validateEmailAddress } from '@/lib/checkoutValidation';

type Stage = 'checking' | 'email' | 'code' | 'orders';
type ApiReply = { success?: boolean; error?: string; message?: string; retryAfterSeconds?: number; needNewCode?: boolean };

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  placed: { label: 'Order Placed', className: 'bg-amber-100/80 text-amber-800 border-amber-300' },
  processing: { label: 'Processing', className: 'bg-blue-100/80 text-blue-800 border-blue-300' },
  shipped: { label: 'Shipped', className: 'bg-purple-100/80 text-purple-800 border-purple-300' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100/80 text-emerald-800 border-emerald-300' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100/80 text-red-800 border-red-300' },
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Order history for customers who ordered WITHOUT an account: email → one-time code → their orders.
 * It never asks for a password, never creates an account, and is separate from the normal sign-in.
 * Everything that grants access happens on the server (/api/guest/*); the browser only holds an HttpOnly cookie.
 */
export default function TrackOrderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('checking');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [verifiedAs, setVerifiedAs] = useState('');
  const boxes = useRef<Array<HTMLInputElement | null>>([]);

  // Registered customers use their account's My Orders instead
  useEffect(() => {
    if (!authLoading && user) router.replace('/orders');
  }, [authLoading, user, router]);

  const loadOrders = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/guest/orders', { cache: 'no-store' });
      if (!res.ok) return false;
      const body = (await res.json()) as { verifiedAs?: string; orders?: FullOrder[] };
      setOrders(body.orders ?? []);
      setVerifiedAs(body.verifiedAs ?? '');
      return true;
    } catch {
      return false;
    }
  }, []);

  // Already verified on this browser (and not yet logged out)? Go straight to the orders.
  useEffect(() => {
    if (authLoading || user) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the server session once on arrival
    loadOrders().then((ok) => {
      if (active) setStage(ok ? 'orders' : 'email');
    });
    return () => {
      active = false;
    };
  }, [authLoading, user, loadOrders]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function post(path: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json().catch(() => null)) as ApiReply | null;
      return { ok: res.ok && !!json?.success, status: res.status, json };
    } catch {
      return { ok: false, status: 0, json: { error: 'Could not reach the server. Please check your connection and try again.' } as ApiReply };
    }
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    const problem = validateEmailAddress(email);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    const { ok, json, status } = await post('/api/guest/send-otp', { identifier: email });
    setBusy(false);
    if (ok) {
      setStage('code');
      setDigits(Array(OTP_LENGTH).fill(''));
      setNotice(json?.message || "We've sent a verification code to your email address.");
      setCooldown(RESEND_SECONDS);
      setTimeout(() => boxes.current[0]?.focus(), 50);
    } else {
      setError(json?.error || 'We could not send a code. Please try again.');
      if (status === 429 && json?.retryAfterSeconds && json.retryAfterSeconds <= 120) setCooldown(json.retryAfterSeconds);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    const code = digits.join('');
    if (busy || code.length !== OTP_LENGTH) return;
    setBusy(true);
    setError('');
    const { ok, json } = await post('/api/guest/verify-otp', { identifier: email, code });
    if (ok && (await loadOrders())) {
      setBusy(false);
      setStage('orders');
      return;
    }
    setBusy(false);
    setError(json?.error || 'Invalid OTP. Please try again.');
    if (json?.needNewCode) setDigits(Array(OTP_LENGTH).fill(''));
    boxes.current[0]?.focus();
  }

  async function logout() {
    await fetch('/api/guest/logout', { method: 'POST' }).catch(() => null);
    setOrders([]);
    setVerifiedAs('');
    setEmail('');
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    setStage('email');
  }

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      // pasted (or auto-filled) code
      const next = Array(OTP_LENGTH).fill('');
      clean.slice(0, OTP_LENGTH).split('').forEach((d, i) => (next[i] = d));
      setDigits(next);
      boxes.current[Math.min(clean.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setDigits((prev) => prev.map((d, i) => (i === index ? clean : d)));
    if (clean && index < OTP_LENGTH - 1) boxes.current[index + 1]?.focus();
  };

  const inputClass =
    'w-full bg-surface border border-outline-variant rounded-full px-5 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors';
  const primaryButton =
    'w-full bg-primary text-surface py-3 rounded-full text-xs font-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const errorLine = error && (
    <p role="alert" className="flex items-start gap-1.5 text-xs sm:text-sm text-error">
      <span className="material-symbols-outlined text-[16px] leading-5">error</span>
      <span>{error}</span>
    </p>
  );

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-8 pb-20">
        {stage === 'checking' || authLoading || user ? (
          <div className="py-28 text-center">
            <span className="material-symbols-outlined text-4xl text-tertiary animate-spin">progress_activity</span>
          </div>
        ) : stage === 'orders' ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant/30 pb-5 mb-6">
              <div>
                <h1 className="text-2xl sm:text-headline-md font-headline-md text-primary">My Orders</h1>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
                  Verified as <span className="font-semibold text-primary">{verifiedAs}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-label-md uppercase tracking-wider border border-outline-variant hover:border-primary text-primary px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Exit Order History
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">diamond</span>
                <p className="text-sm text-on-surface-variant">No guest orders were found for this email address.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((order) => {
                  const status = STATUS_STYLES[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
                  const items = order.items ?? [];
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/orders/${encodeURIComponent(order.order_number)}`}
                        className="block bg-surface-container-lowest border border-outline-variant/40 hover:border-primary rounded-xl p-4 sm:p-5 transition-colors shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-primary">Order #{order.order_number}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">Placed on {formatDate(order.created_at)}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium border ${status.className}`}>{status.label}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex -space-x-2 min-w-0">
                            {items.slice(0, 4).map((item) => (
                              <span key={item.id} className="w-10 h-10 rounded-lg bg-surface-container-low border border-surface overflow-hidden flex items-center justify-center flex-shrink-0">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="material-symbols-outlined text-outline text-[18px]">diamond</span>
                                )}
                              </span>
                            ))}
                            {items.length > 4 && <span className="w-10 h-10 rounded-lg bg-surface-container text-xs text-on-surface-variant flex items-center justify-center border border-surface">+{items.length - 4}</span>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-tertiary">₹{Number(order.total).toLocaleString('en-IN')}</p>
                            <p className="text-[11px] text-on-surface-variant capitalize">Payment: {order.payment_status.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 shadow-sm">
              {stage === 'email' ? (
                <form onSubmit={sendCode} noValidate className="space-y-5">
                  <div className="text-center">
                    <span className="w-12 h-12 rounded-full bg-surface-container-low inline-flex items-center justify-center text-secondary mb-3">
                      <span className="material-symbols-outlined text-[24px]">package_2</span>
                    </span>
                    <h1 className="text-2xl font-headline-md text-primary">View Your Orders</h1>
                    <p className="text-sm text-on-surface-variant mt-1">Enter the email address you used while placing your order.</p>
                  </div>
                  <div>
                    <label htmlFor="guest-email" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                      Email Address
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      maxLength={254}
                      aria-invalid={error ? true : undefined}
                      className={inputClass}
                    />
                  </div>
                  {errorLine}
                  <button type="submit" disabled={busy || !email.trim() || cooldown > 0} className={primaryButton}>
                    {busy ? 'Sending…' : cooldown > 0 ? `Please wait ${cooldown}s` : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={verify} noValidate className="space-y-5">
                  <div className="text-center">
                    <span className="w-12 h-12 rounded-full bg-surface-container-low inline-flex items-center justify-center text-secondary mb-3">
                      <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
                    </span>
                    <h1 className="text-2xl font-headline-md text-primary">Verify Your Email</h1>
                    <p className="text-sm text-on-surface-variant mt-1">{notice}</p>
                    <p className="text-xs text-on-surface-variant mt-2">
                      Sent to <span className="font-semibold text-primary break-all">{email.trim()}</span>. Check your spam folder too — and make sure it is the email you used at checkout.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={(e) => {
                    e.preventDefault();
                    setDigit(0, e.clipboardData.getData('text'));
                  }}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          boxes.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                        value={d}
                        maxLength={OTP_LENGTH}
                        onChange={(e) => setDigit(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
                          if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
                          if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) boxes.current[i + 1]?.focus();
                        }}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold bg-surface border border-outline-variant rounded-lg text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                    ))}
                  </div>
                  {errorLine && <div className="text-center flex justify-center">{errorLine}</div>}
                  <button type="submit" disabled={busy || digits.join('').length !== OTP_LENGTH} className={primaryButton}>
                    {busy ? 'Verifying…' : 'Verify OTP'}
                  </button>
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-on-surface-variant">
                    <button type="button" onClick={() => sendCode()} disabled={busy || cooldown > 0} className="underline underline-offset-2 hover:text-primary disabled:opacity-50 disabled:no-underline">
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStage('email');
                        setError('');
                      }}
                      className="underline underline-offset-2 hover:text-primary"
                    >
                      Use a different email
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
