"use client";

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

type Mode = 'login' | 'register';

// Supabase doesn't report a disabled provider until after redirecting, so the Google
// button stays hidden until the provider is configured and this flag is set.
const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';

/** Only allow same-site relative redirects (blocks //evil.com and absolute URLs). */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function Field({
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  trailing,
  invalid,
}: {
  icon: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  inputMode?: 'email' | 'tel' | 'text' | 'numeric';
  maxLength?: number;
  trailing?: ReactNode;
  invalid?: boolean;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/60 pointer-events-none">
        {icon}
      </span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        className={`w-full bg-surface border ${invalid ? 'border-error' : 'border-outline-variant'} pl-11 ${trailing ? 'pr-11' : 'pr-4'} py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant/55 focus:outline-none focus:border-primary transition-colors`}
      />
      {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
    </label>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-1.5 text-on-surface-variant/70 hover:text-primary"
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      <span className="material-symbols-outlined text-[18px]">{shown ? 'visibility_off' : 'visibility'}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function AuthPanel({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const { store } = useStoreSettings();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get('error') === 'auth_callback_failed' ? 'That sign-in link has expired or was already used. Please sign in again.' : null
  );
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setNotice(null);
    // Keep the URL in sync so refresh / back work as expected
    const query = searchParams.toString();
    window.history.replaceState(null, '', `${nextMode === 'login' ? '/login' : '/signup'}${query ? `?${query}` : ''}`);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : signInError.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: `${firstName.trim()} ${lastName.trim()}`.trim(), phone: digits },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      // Email confirmation is off — the user is signed in already
      router.push(next);
      router.refresh();
      return;
    }
    setNotice(`Almost there! We've sent a confirmation link to ${email.trim()}. Open it to activate your account.`);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) {
      setError(
        /provider is not enabled|unsupported provider/i.test(oauthError.message)
          ? 'Google sign-in is not available yet. Please use your email and password.'
          : oauthError.message
      );
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google
  }

  const passwordToggle = <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />;
  const isLogin = mode === 'login';

  return (
    <div className="w-full max-w-[1020px] grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(22,11,14,0.12)] border border-outline-variant/40 bg-surface">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-surface p-10 xl:p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-secondary-fixed/10 blur-3xl pointer-events-none" />
        <Link href="/" className="flex items-center gap-3 relative">
          <span className="w-10 h-10 bg-surface text-primary flex items-center justify-center font-headline-sm text-lg font-bold">
            {store.name.charAt(0)}
          </span>
          <span className="font-headline-sm text-lg">{store.name}</span>
        </Link>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 border border-surface/25 bg-surface/5 px-3 py-1 text-label-sm font-label-sm tracking-wider mb-6">
            <span className="material-symbols-outlined text-[14px] text-secondary-fixed">auto_awesome</span>
            Crafted to Adorn
          </span>
          <h2 className="font-headline-lg text-[34px] xl:text-[40px] leading-[1.1] uppercase tracking-wide">
            Timeless Design.
            <br />
            Certified Brilliance.
          </h2>
          <p className="text-body-md text-surface/70 mt-4 max-w-sm">
            Explore BIS hallmarked gold and conflict-free natural diamonds, crafted to be treasured for generations.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ['verified', 'BIS 916 Hallmarked Gold'],
              ['diamond', 'Certified Natural Diamonds'],
              ['autorenew', '15-Day Easy Returns'],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3 text-body-md">
                <span className="w-8 h-8 border border-surface/20 bg-surface/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">{icon}</span>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <Link href="/" className="relative inline-flex items-center gap-2 text-label-md font-label-md text-surface/85 hover:text-surface">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to storefront
        </Link>
      </div>

      {/* Form panel */}
      <div className="p-6 sm:p-10 xl:p-12">
        <h1 className="font-headline-md text-headline-md text-primary">{isLogin ? 'Sign In' : 'Create Account'}</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">
          {isLogin ? 'Access your orders, wishlist and saved details.' : 'Create an account to track orders and save your favourite pieces.'}
        </p>

        {/* Tabs */}
        <div className="grid grid-cols-2 border border-outline-variant/60 p-1 mt-6 mb-6" role="tablist">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`py-2.5 font-label-md text-label-md uppercase tracking-wider transition-colors ${
                mode === m ? 'bg-primary text-surface' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="bg-error-container text-on-error-container px-4 py-3 text-body-sm mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="bg-surface-container-low border border-outline-variant/60 text-primary px-4 py-3 text-body-sm mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 text-tertiary">mark_email_read</span>
            {notice}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field icon="mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="Email Address" />
            <Field
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              trailing={passwordToggle}
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-label-md font-label-md text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-surface py-3.5 font-label-md text-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              {loading ? 'Signing In…' : 'Sign In to Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon="person" autoComplete="given-name" value={firstName} onChange={setFirstName} placeholder="First Name" />
              <Field icon="person" autoComplete="family-name" value={lastName} onChange={setLastName} placeholder="Last Name" />
            </div>
            <Field icon="mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="Email Address" />
            <Field
              icon="call"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(v) => setPhone(v.replace(/\D/g, ''))}
              placeholder="Phone Number (10 digits)"
            />
            <Field
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              placeholder="Password (min. 8 characters)"
              trailing={passwordToggle}
            />
            <Field
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm Password"
              invalid={!!confirmPassword && confirmPassword !== password}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-surface py-3.5 font-label-md text-label-md uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              {loading ? 'Creating Account…' : 'Register Account'}
            </button>
          </form>
        )}

        {GOOGLE_AUTH_ENABLED && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-outline-variant/50" />
              <span className="text-label-sm font-label-sm uppercase tracking-widest text-on-surface-variant/70">Or sign in with</span>
              <div className="flex-1 h-px bg-outline-variant/50" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full max-w-sm mx-auto flex items-center justify-center gap-2.5 border border-outline-variant rounded-full py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60"
            >
              {googleLoading ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> : <GoogleIcon />}
              Continue with Google
            </button>

          </>
        )}

        <p className="text-center text-body-sm text-on-surface-variant mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')} className="font-semibold text-primary hover:underline">
            {isLogin ? 'Register Now' : 'Login Here'}
          </button>
        </p>
      </div>
    </div>
  );
}
