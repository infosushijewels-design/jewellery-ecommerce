'use client';

import { useMemo, useState, FormEvent } from 'react';
import { LoadingLabel } from '@/components/ui/Spinner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useToast } from '@/lib/context/ToastContext';
import { useCaptchaPost } from '@/components/ui/TurnstileChallenge';
import {
  CONTACT_CATEGORIES,
  CONTACT_FIELD_LABELS,
  CONTACT_FIELD_ORDER,
  CONTACT_MESSAGE_MAX,
  validateContact,
  type ContactField,
  type ContactValues,
} from '@/lib/formValidation';

const emptyForm: ContactValues = { name: '', email: '', phone: '', category: CONTACT_CATEGORIES[0], message: '' };

const inputBase =
  'w-full px-4 py-3 rounded-lg border bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none transition-colors';

export default function ContactPage() {
  const { showToast } = useToast();
  const { postJson, challenge } = useCaptchaPost();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ContactValues>(emptyForm);
  const [website, setWebsite] = useState(''); // hidden bot trap — real visitors never see or fill it
  const [startedAt] = useState(() => Date.now()); // when the form appeared (a form filled in "instantly" is a bot)
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => validateContact(form), [form]);
  const visibleError = (field: ContactField) => (touched[field] || submitAttempted ? errors[field] : undefined);

  const handleChange = (field: ContactField) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    // Phone: only characters people actually type in a number.
    const value = field === 'phone' ? e.target.value.replace(/[^\d+\s()-]/g, '') : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** id, value, handlers and error styling for a field. */
  const fieldProps = (field: ContactField) => {
    const err = visibleError(field);
    return {
      id: `contact-${field}`,
      name: field,
      value: form[field],
      onChange: handleChange(field),
      onBlur: () => setTouched((prev) => ({ ...prev, [field]: true })),
      'aria-invalid': err ? (true as const) : undefined,
      'aria-describedby': err ? `contact-${field}-error` : undefined,
      className: `${inputBase} ${err ? 'border-error focus:border-error bg-error-container/10' : 'border-outline-variant/60 focus:border-secondary'}`,
    };
  };

  const renderError = (field: ContactField) => {
    const err = visibleError(field);
    if (!err) return null;
    return (
      <p id={`contact-${field}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-xs text-error">
        <span className="material-symbols-outlined text-[14px] leading-4">error</span>
        <span>{err}</span>
      </p>
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitAttempted(true);
    const badFields = CONTACT_FIELD_ORDER.filter((field) => errors[field]);
    if (badFields.length > 0) {
      showToast(`Please fix: ${badFields.map((field) => CONTACT_FIELD_LABELS[field]).join(', ')}.`, 'warning');
      const first = document.getElementById(`contact-${badFields[0]}`);
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first?.focus({ preventScroll: true });
      return;
    }

    setIsSubmitting(true);
    try {
      // A plain request; only a visitor over the rate limit is ever asked to tick Cloudflare's one-click check
      const { ok, json: body, dismissed } = await postJson('/api/contact', { ...form, website, startedAt });
      if (dismissed) return;
      if (!ok || !body?.success) {
        showToast(body?.error || 'Sorry, we could not send your message. Please try again or email concierge@sushijewels.com.', 'error');
        return;
      }
      showToast('💬 Message sent! Our team will respond shortly.', 'success');
      setForm(emptyForm);
      setTouched({});
      setSubmitAttempted(false);
    } catch (err) {
      console.error('Failed to submit enquiry:', err);
      showToast('Sorry, we could not send your message. Please check your connection or email concierge@sushijewels.com.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Contact Us' },
          ]}
        />

        <div className="text-center max-w-2xl mx-auto mt-8 sm:mt-12 mb-10 sm:mb-16">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Concierge</span>
          <h1 className="font-headline-lg text-[28px] sm:text-display-md text-primary mt-2">Contact &amp; Private Appointments</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
            Whether you&apos;re commissioning a bespoke piece or have a question about an existing order, our concierge team is here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-10">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-6">Bespoke Enquiry &amp; Appointment Booking</h2>
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                      Full Name
                    </label>
                    <input type="text" required maxLength={100} autoComplete="name" placeholder="Your name" {...fieldProps('name')} />
                    {renderError('name')}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                      Phone
                    </label>
                    <input type="tel" required inputMode="tel" maxLength={18} autoComplete="tel" placeholder="+91 00000 00000" {...fieldProps('phone')} />
                    {renderError('phone')}
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-email" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <input type="email" required inputMode="email" maxLength={254} autoComplete="email" placeholder="you@example.com" {...fieldProps('email')} />
                  {renderError('email')}
                </div>

                <div>
                  <label htmlFor="contact-category" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                    Preferred Category
                  </label>
                  <select {...fieldProps('category')}>
                    {CONTACT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {renderError('category')}
                </div>

                <div>
                  <label htmlFor="contact-message" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    maxLength={CONTACT_MESSAGE_MAX}
                    placeholder="Tell us about the piece you have in mind..."
                    {...fieldProps('message')}
                    className={`${fieldProps('message').className} resize-none`}
                  />
                  {renderError('message')}
                </div>

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
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-surface py-3.5 rounded-full font-label-md uppercase tracking-wide hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LoadingLabel loading={isSubmitting} loadingText="Sending...">Submit Enquiry</LoadingLabel>
                </button>
              </form>
            </div>
          </div>

          {/* Boutique Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-8">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-5">Flagship Boutique</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">location_on</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Sushi Jewels Atelier, 4th Floor, Zaveri Bazaar Heritage House, Mumbai, Maharashtra 400002, India
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">schedule</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Open Daily, 10:30 AM – 8:30 PM
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">directions_car</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Complimentary VIP valet parking available for all appointment bookings.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-8">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-5">Direct Contact</h3>
              <div className="space-y-3">
                <a href="tel:+918001234567" className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[22px]">call</span>
                  +91 800 123 4567
                </a>
                <a href="mailto:concierge@sushijewels.com" className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[22px]">mail</span>
                  concierge@sushijewels.com
                </a>

              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/40 h-56 sm:h-64 bg-surface-container-low flex items-center justify-center">
              <div className="text-center px-6">
                <span className="material-symbols-outlined text-outline text-[32px] mb-2 block">map</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Interactive map available at the boutique location</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {challenge}
      <Footer />
    </>
  );
}
