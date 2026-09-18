"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setMessage('Your password has been successfully updated! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-16 pt-12 pb-24 flex items-center justify-center">
        <div className="w-full max-w-md bg-surface-container-low rounded-2xl p-8 border border-outline-variant/40 shadow-lg">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-[48px] text-primary mb-2">key</span>
            <h1 className="text-headline-md font-headline-md text-primary">Set New Password</h1>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-md text-body-sm font-medium">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-primary-container text-on-primary-container p-3 rounded-md text-body-sm font-medium">
                {message}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-surface py-3.5 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-8 text-center text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-6">
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
