"use client";

import { useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // In production: save email to Supabase newsletter table
    setSubmitted(true);
    showToast('✉️ Subscribed! Enjoy exclusive access to new arrivals.', 'success');
    setEmail('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section className="py-12 sm:py-20 border-t border-outline-variant/40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 text-center max-w-3xl">
        <span className="material-symbols-outlined text-[36px] sm:text-[40px] text-secondary mb-3 sm:mb-4 font-light block">mail</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary">Join the Inner Circle</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 sm:mt-3 max-w-lg mx-auto">
          Subscribe to receive exclusive access to private launches, editorial journals, and privileged seasonal pricing.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
          <input
            className="flex-1 px-5 sm:px-6 py-3.5 sm:py-4 bg-surface-container-low border border-outline-variant/60 rounded-full font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
            placeholder="Enter your email address"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="px-7 sm:px-8 py-3.5 sm:py-4 bg-primary text-surface rounded-full font-label-lg text-label-lg hover:bg-primary-container active:scale-95 transition-all flex-shrink-0"
            type="submit"
            disabled={submitted}
          >
            {submitted ? 'Subscribed' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}
