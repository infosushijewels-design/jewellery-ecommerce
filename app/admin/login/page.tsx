"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { checkIsAdmin } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { activateDemoAdmin, clearDemoAdmin } from '@/lib/utils/adminDemoAccess';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        showToast(error?.message || 'Invalid credentials. Please try again.', 'error');
        setIsSubmitting(false);
        return;
      }

      const isAdmin = await checkIsAdmin(data.user.id);

      if (!isAdmin) {
        showToast('Access Denied: This account does not possess Atelier Admin credentials.', 'error');
        await supabase.auth.signOut();
        setIsSubmitting(false);
        return;
      }

      clearDemoAdmin();
      showToast('Welcome, Atelier Administrator', 'success');
      router.push('/admin');
    } catch (err) {
      console.error('Admin login error:', err);
      showToast('An unexpected error occurred. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    activateDemoAdmin();
    showToast('Welcome, Atelier Administrator (Demo Mode)', 'success');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-gray-100 flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-amber-400 text-[44px] sm:text-[52px] mb-3 inline-block">
            diamond
          </span>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-widest text-amber-200 uppercase"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            Sushi Jewels
          </h1>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-gray-400 mt-2 leading-relaxed px-2">
            Atelier Concierge Portal — Authorized Administration Only
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#17171A] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sushijewels.com"
                autoComplete="username"
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1.5">
                Secret Passkey
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-400 text-black hover:bg-amber-300 py-3.5 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Enter Atelier</span>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full border border-dashed border-amber-400/40 text-amber-300 hover:bg-amber-400/10 py-3 rounded-xl text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span>Quick Demo Admin Access (Development Only)</span>
          </button>
        </div>

        {/* Return link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Return to Public Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
