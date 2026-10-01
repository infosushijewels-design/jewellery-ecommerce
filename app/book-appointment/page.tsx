'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useToast } from '@/lib/context/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import {
  APPOINTMENT_TOPICS,
  appointmentConfigFrom,
  bookableDates,
  formatDateChip,
  formatSlot,
  formatSlotTime,
  isWithinHours,
  overlapsBooked,
  slotTimes,
  slotToISO,
} from '@/lib/appointments';

const inputCls =
  'w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors';
const labelCls = 'block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2';

export default function BookAppointmentPage() {
  const { showToast } = useToast();
  // Hours, slot length, booking window and closed days are set by the store owner (Admin → Settings).
  const settings = useStoreSettings();
  const config = useMemo(() => appointmentConfigFrom(settings.appointments), [settings.appointments]);
  const dates = useMemo(() => bookableDates(config), [config]);
  const times = useMemo(() => slotTimes(config), [config]);

  const [pickedDate, setDate] = useState<string | null>(null);
  // If the chosen day stops being bookable (settings loaded / changed), fall back to the first open day.
  const date = pickedDate && dates.includes(pickedDate) ? pickedDate : dates[0];
  const [time, setTime] = useState<string | null>(null);
  // true while the customer is typing their own time instead of picking a slot
  const [customMode, setCustomMode] = useState(false);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(true);
  // Captured in state (not read during render) so slot cut-offs stay stable between renders.
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: APPOINTMENT_TOPICS[0] as string,
    message: '',
    website: '', // honeypot
  });

  // Bumping this re-fetches the booked slots (used after a booking conflict).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const end = new Date(now.getTime() + (config.daysAhead + 1) * 24 * 60 * 60 * 1000);
    createClient()
      .rpc('get_booked_slots', { range_start: now.toISOString(), range_end: end.toISOString() })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Not fatal: the server still rejects a taken slot when the form is submitted.
          console.error('Could not load booked slots:', error);
        } else {
          setBooked(new Set(((data as string[]) || []).map((iso) => new Date(iso).toISOString())));
          setNowMs(Date.now());
        }
        setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, config.daysAhead]);

  const isTaken = (d: string, t: string) => {
    const iso = slotToISO(d, t);
    if (new Date(iso).getTime() < nowMs + config.minLeadHours * 60 * 60 * 1000) return true;
    return overlapsBooked(iso, booked, config);
  };

  const availableOnDate = (d: string) => times.filter((t) => !isTaken(d, t)).length;

  /** Why the typed custom time can't be booked (null = fine or nothing typed yet). */
  const customProblem = (() => {
    if (!customMode || !time) return null;
    if (!isWithinHours(time, config)) {
      const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      return `Please choose a time between ${formatSlotTime(hhmm(config.startMinutes))} and ${formatSlotTime(hhmm(config.endMinutes - config.slotMinutes))} (calls run ${config.slotMinutes} minutes).`;
    }
    if (isTaken(date, time)) return 'That time is too soon or overlaps another booking. Please try a different time.';
    return null;
  })();

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!time) {
      showToast('Please choose a time slot.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const scheduledAt = slotToISO(date, time);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, scheduledAt }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(json.error || 'Could not book your appointment. Please try again.', 'error');
        if (res.status === 409 || res.status === 400) {
          setTime(null);
          setReloadKey((k) => k + 1);
        }
        return;
      }
      setConfirmedSlot(scheduledAt);
    } catch (err) {
      console.error('Booking failed:', err);
      showToast('Could not book your appointment. Please check your connection and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Book a Video Appointment' }]} />

        <div className="text-center max-w-2xl mx-auto mt-8 sm:mt-12 mb-8 sm:mb-12">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Personalised Appointment</span>
          <h1 className="font-headline-lg text-[28px] sm:text-display-md text-primary mt-2">Book a Video Consultation</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
            Meet one of our jewellery experts over a Google Meet video call — for shopping help, a live product demo, or a custom design inquiry.
          </p>
        </div>

        {!config.enabled ? (
          <div className="max-w-xl mx-auto bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-8 sm:p-10 text-center">
            <span className="material-symbols-outlined text-secondary text-[48px]">event_busy</span>
            <h2 className="font-headline-sm text-headline-sm text-primary mt-3">Bookings are paused</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
              We aren&apos;t taking new video appointments right now. Please check back soon, or reach us from the contact page.
            </p>
            <Link href="/contact" className="inline-block mt-6 bg-primary text-surface px-8 py-3 rounded-full font-label-md uppercase tracking-wide hover:bg-tertiary transition-colors">
              Contact Us
            </Link>
          </div>
        ) : confirmedSlot ? (
          <div className="max-w-xl mx-auto bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-8 sm:p-10 text-center">
            <span className="material-symbols-outlined text-secondary text-[48px]">event_available</span>
            <h2 className="font-headline-sm text-headline-sm text-primary mt-3">Request received!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-3 leading-relaxed">
              We&apos;ve noted your request for <strong className="text-primary">{formatSlot(confirmedSlot)}</strong>. Our concierge will confirm it
              shortly and email you the Google Meet link.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-primary text-surface px-8 py-3 rounded-full font-label-md uppercase tracking-wide hover:bg-tertiary transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Slot picker */}
            <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-8">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-1">1. Choose a date &amp; time</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-5">All times are in Indian Standard Time (IST). Each call is {config.slotMinutes} minutes.</p>

              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="tablist" aria-label="Date">
                {dates.map((d) => {
                  const chip = formatDateChip(d);
                  const active = d === date;
                  const none = !slotsLoading && availableOnDate(d) === 0;
                  return (
                    <button
                      key={d}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      disabled={none}
                      onClick={() => {
                        setDate(d);
                        setTime(null);
                      }}
                      className={`flex-shrink-0 w-[64px] py-2.5 rounded-xl border text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        active ? 'bg-primary text-surface border-primary' : 'bg-surface border-outline-variant/60 text-on-surface hover:border-secondary'
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-wide opacity-80">{chip.weekday}</div>
                      <div className="text-lg font-semibold leading-tight">{chip.day}</div>
                      <div className="text-[11px] opacity-80">{chip.month}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-5">
                {times.map((t) => {
                  const taken = isTaken(date, t);
                  const active = time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={taken || slotsLoading}
                      onClick={() => {
                        setCustomMode(false);
                        setTime(t);
                      }}
                      aria-pressed={active}
                      className={`py-2.5 rounded-lg border text-sm transition-colors disabled:cursor-not-allowed ${
                        active
                          ? 'bg-secondary text-primary border-secondary font-semibold'
                          : taken
                            ? 'bg-surface-container text-outline border-outline-variant/30 line-through opacity-60'
                            : 'bg-surface border-outline-variant/60 text-on-surface hover:border-secondary'
                      }`}
                    >
                      {formatSlotTime(t)}
                    </button>
                  );
                })}
              </div>
              {config.allowCustomTime && (
                <div className="mt-5 pt-5 border-t border-outline-variant/40">
                  {!customMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMode(true);
                        setTime(null);
                      }}
                      className="font-label-md text-label-md text-secondary underline underline-offset-4 hover:text-primary transition-colors"
                    >
                      Need a different time? Enter your own
                    </button>
                  ) : (
                    <div>
                      <label htmlFor="appt-custom-time" className={labelCls}>Your preferred time (IST)</label>
                      <div className="flex items-center gap-3">
                        <input
                          id="appt-custom-time"
                          type="time"
                          step={60}
                          value={time ?? ''}
                          onChange={(e) => setTime(e.target.value || null)}
                          className={`${inputCls} max-w-[200px]`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMode(false);
                            setTime(null);
                          }}
                          className="font-label-sm text-label-sm text-on-surface-variant underline underline-offset-4 hover:text-primary"
                        >
                          Back to slots
                        </button>
                      </div>
                      {customProblem && <p className="font-body-sm text-body-sm text-error mt-2">{customProblem}</p>}
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                        We&apos;ll confirm your exact time by email — if it doesn&apos;t work for our team, we&apos;ll suggest the nearest one.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {!slotsLoading && availableOnDate(date) === 0 && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-4">No slots left on this day — please pick another date.</p>
              )}
            </div>

            {/* Details */}
            <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-8 space-y-5">
              <h2 className="font-headline-sm text-headline-sm text-primary">2. Your details</h2>

              <div>
                <label htmlFor="appt-name" className={labelCls}>Full Name</label>
                <input id="appt-name" type="text" required maxLength={100} value={form.name} onChange={set('name')} className={inputCls} placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="appt-email" className={labelCls}>Email</label>
                <input id="appt-email" type="email" required maxLength={200} value={form.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="appt-phone" className={labelCls}>Phone / WhatsApp</label>
                <input id="appt-phone" type="tel" required maxLength={20} value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+91 00000 00000" />
              </div>
              <div>
                <label htmlFor="appt-topic" className={labelCls}>What would you like help with?</label>
                <select id="appt-topic" value={form.topic} onChange={set('topic')} className={inputCls}>
                  {APPOINTMENT_TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="appt-message" className={labelCls}>Notes (optional)</label>
                <textarea
                  id="appt-message"
                  rows={3}
                  maxLength={1000}
                  value={form.message}
                  onChange={set('message')}
                  className={`${inputCls} resize-none`}
                  placeholder="Occasion, budget, pieces you'd like to see..."
                />
              </div>

              {/* Honeypot: hidden from people, bots tend to fill it */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={set('website')}
                className="hidden"
                aria-hidden="true"
              />

              {time && !customProblem && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Selected: <strong className="text-primary">{formatSlot(slotToISO(date, time))}</strong>
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !time || !!customProblem}
                className="w-full bg-primary text-surface py-3.5 rounded-full font-label-md uppercase tracking-wide hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Request Appointment'}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
