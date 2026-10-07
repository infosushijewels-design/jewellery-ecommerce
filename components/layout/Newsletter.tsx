"use client";

import { useState } from 'react';
import { LoadingLabel } from '@/components/ui/Spinner';
import { useToast } from '@/lib/context/ToastContext';
import { validateNewsletterEmail } from '@/lib/formValidation';
import { useCaptchaPost } from '@/components/ui/TurnstileChallenge';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // hidden bot trap — real visitors never see or fill it
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now()); // when the form appeared (a form filled in "instantly" is a bot)
  const { showToast } = useToast();
  const { postJson, challenge } = useCaptchaPost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const problem = validateNewsletterEmail(email);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      // A plain request; only a visitor over the rate limit is ever asked to tick Cloudflare's one-click check
      const { ok, json: body, dismissed } = await postJson('/api/newsletter', { email, website, startedAt });
      if (!ok || !body?.success) {
        if (!dismissed) setError(body?.error || 'Sorry, we could not sign you up. Please try again.');
        return;
      }
      setSubmitted(true);
      showToast('✉️ Subscribed! Enjoy exclusive access to new arrivals.', 'success');
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Newsletter sign-up failed:', err);
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 sm:py-20 border-t border-outline-variant/40">
      {challenge}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 text-center max-w-3xl">
        <span className="material-symbols-outlined text-[36px] sm:text-[40px] text-secondary mb-3 sm:mb-4 font-light block">mail</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary">Join the Inner Circle</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 sm:mt-3 max-w-lg mx-auto">
          Subscribe to receive exclusive access to private launches, editorial journals, and privileged seasonal pricing.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 sm:mt-8 flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
          <input
            id="newsletter-email"
            className={`flex-1 px-5 sm:px-6 py-3.5 sm:py-4 bg-surface-container-low border rounded-full font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none transition-all ${
              error ? 'border-error focus:border-error' : 'border-outline-variant/60 focus:border-secondary focus:ring-1 focus:ring-secondary'
            }`}
            placeholder="Enter your email address"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            aria-label="Email address"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'newsletter-error' : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
          />
          {/* Bot trap: invisible to people (and to screen readers / keyboard), but bots fill every field. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
          />
          <button
            className="px-7 sm:px-8 py-3.5 sm:py-4 bg-primary text-surface rounded-full font-label-lg text-label-lg hover:bg-primary-container active:scale-95 transition-all flex-shrink-0 disabled:opacity-70"
            type="submit"
            disabled={submitted || submitting}
          >
            {submitting ? <LoadingLabel loading loadingText="Subscribing…">{null}</LoadingLabel> : submitted ? 'Subscribed' : 'Subscribe'}
          </button>
        </form>
        {error && (
          <p id="newsletter-error" role="alert" className="mt-3 flex items-center justify-center gap-1 text-xs text-error">
            <span className="material-symbols-outlined text-[14px] leading-4">error</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    </section>
  );
}
