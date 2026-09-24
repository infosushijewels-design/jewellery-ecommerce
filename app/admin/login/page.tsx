"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { checkIsAdmin } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { activateDemoAdmin, clearDemoAdmin } from '@/lib/utils/adminDemoAccess';

const REMEMBERED_EMAIL_KEY = 'sushi_admin_remembered_email';

// The demo bypass skips Supabase auth entirely, so it must never ship to production.
const DEMO_ACCESS_ENABLED = process.env.NODE_ENV !== 'production';

interface FieldErrors {
  email?: string;
  password?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // Restore a remembered email address (convenience only — never persists the password)
  useEffect(() => {
    try {
      const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setUnconfirmedEmail(null);

    if (!validate()) return;

    setIsSubmitting(true);
    const cleanEmail = email.trim();

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

      if (!error && data.user) {
        const isAdmin = await checkIsAdmin(data.user.id);

        if (!isAdmin) {
          setFormError('Access denied — this account does not have admin privileges.');
          await supabase.auth.signOut();
          setIsSubmitting(false);
          return;
        }

        try {
          if (rememberMe) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, cleanEmail);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
        } catch {
          // localStorage unavailable — ignore
        }

        clearDemoAdmin();
        showToast('Welcome back, Administrator', 'success');
        router.push('/admin');
        return;
      }

      // Sign-in failed. This screen never creates accounts: signing up here
      // returned a user without a session (the project requires email
      // confirmation), so the old code pushed to /admin with no session and
      // the layout bounced straight back here with no error shown.
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(cleanEmail);
        setFormError('This email has not been confirmed yet. Check your inbox, or resend the confirmation link below.');
      } else {
        setFormError(error?.message || 'Invalid credentials. Please check your email and password.');
      }
      setIsSubmitting(false);
    } catch (err) {
      console.error('Admin login error:', err);
      setFormError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: 'signup', email: unconfirmedEmail });
      if (error) {
        setFormError(error.message);
      } else {
        setFormError(null);
        showToast(`Confirmation link sent to ${unconfirmedEmail}`, 'success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    activateDemoAdmin('anjaliworksphere@gmail.com');
    showToast('Welcome, Administrator (Anjali)', 'success');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center group">
            <span className="font-headline-lg text-[24px] sm:text-[28px] text-primary tracking-tight group-hover:text-secondary transition-colors leading-tight">
              Sushi Jewels
            </span>
            <span className="font-label-sm text-[8px] sm:text-[9px] text-outline tracking-[0.25em] font-normal">
              FINE JEWELLERY
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-low rounded-2xl p-6 sm:p-8 border border-outline-variant/40 shadow-lg">
          <div className="text-center mb-6">
            <span className="material-symbols-outlined text-[36px] text-primary mb-2 inline-block">lock_person</span>
            <h1 className="text-headline-md font-headline-md text-primary">Admin Login</h1>
            <p className="text-body-sm text-on-surface-variant mt-1.5">Sign in to manage the Sushi Jewels catalog and orders.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {formError && (
              <div className="bg-error-container text-on-error-container p-3 rounded-md text-body-sm font-medium flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                <span>{formError}</span>
              </div>
            )}

            {unconfirmedEmail && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isSubmitting}
                className="w-full border border-secondary/50 text-secondary hover:bg-secondary-container/20 py-2.5 rounded-md font-label-sm text-label-sm uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Resend confirmation email
              </button>
            )}

            <div className="space-y-1">
              <label htmlFor="admin-email" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="admin@sushijewels.com"
                aria-invalid={!!fieldErrors.email}
                className={`w-full bg-surface border rounded-md px-4 py-2.5 text-on-surface placeholder:text-outline focus:outline-none transition-colors ${
                  fieldErrors.email ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-error text-label-sm font-label-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="admin-password" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                  Password
                </label>
                <Link href="/forgot-password" className="text-secondary text-label-sm font-label-sm hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  className={`w-full bg-surface border rounded-md px-4 py-2.5 pr-11 text-on-surface placeholder:text-outline focus:outline-none transition-colors ${
                    fieldErrors.password ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-error text-label-sm font-label-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-primary rounded"
              />
              <span className="text-label-sm font-label-sm text-on-surface-variant">Remember Me</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-surface py-3.5 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {DEMO_ACCESS_ENABLED && (
          <>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">or</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full border border-dashed border-secondary/50 text-secondary hover:bg-secondary-container/20 py-3 rounded-md font-label-sm text-label-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span>Quick Demo Admin Access (Dev Only)</span>
          </button>
          </>
          )}
        </div>

        {/* Return link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Return to Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
