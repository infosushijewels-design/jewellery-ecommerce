"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
      // Assuming auto-login is true or email confirmation is disabled for now
      setTimeout(() => {
        router.push('/');
        router.refresh();
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
            <span className="material-symbols-outlined text-[48px] text-primary mb-2">person_add</span>
            <h1 className="text-headline-md font-headline-md text-primary">Create Account</h1>
            <p className="text-body-sm text-on-surface-variant mt-2">Join Sushi Jewels to save your favorite pieces.</p>
          </div>

          {success ? (
            <div className="bg-primary-container text-on-primary-container p-6 rounded-xl text-center space-y-3 border border-secondary/40">
              <span className="material-symbols-outlined text-[32px] text-secondary">check_circle</span>
              <h3 className="font-headline-sm text-headline-sm">Account Created!</h3>
              <p className="font-body-sm text-body-sm">Welcome to Sushi Jewels. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="bg-error-container text-on-error-container p-3 rounded-md text-body-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">Password</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-surface py-3.5 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 mt-4"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
