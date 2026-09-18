"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [supabase] = useState(() => createClient());

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset instructions have been sent to your email address.');
    }
    setIsLoading(false);
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-16 pt-12 pb-24 flex items-center justify-center">
        <div className="w-full max-w-md bg-surface-container-low rounded-2xl p-8 border border-outline-variant/40 shadow-lg">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-[48px] text-primary mb-2">lock_reset</span>
            <h1 className="text-headline-md font-headline-md text-primary">Forgot Password</h1>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Enter your email address and we will send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
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
              <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-surface py-3.5 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-6">
            Remembered your password?{' '}
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
