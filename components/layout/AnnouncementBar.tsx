"use client";

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

export default function AnnouncementBar() {
  const { announcement } = useStoreSettings();
  const messages = announcement.messages.map((m) => m.trim()).filter(Boolean);

  // Mobile cycling state
  const [mobileIndex, setMobileIndex] = useState(0);

  // Total mobile items = store messages + 1 appointment booking item
  const totalMobileItems = messages.length + 1;

  useEffect(() => {
    if (totalMobileItems <= 1) return;
    const interval = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % totalMobileItems);
    }, 4500);
    return () => clearInterval(interval);
  }, [totalMobileItems]);

  if (!announcement.enabled && messages.length === 0) return null;

  const isAppointmentSlide = mobileIndex === messages.length;

  return (
    <aside
      className="bg-primary-container text-surface border-b border-outline-variant/20 tracking-wider relative z-30"
      aria-label="Announcements"
    >
      {/* Mobile: Smooth cycling view preventing overflow while keeping the appointment booking option directly tap-able */}
      <div className="sm:hidden min-h-[34px] flex items-center justify-center px-3 py-1.5 text-center">
        {isAppointmentSlide ? (
          <Link
            href="/book-appointment"
            className="inline-flex items-center justify-center gap-1.5 font-label-sm text-[10.5px] text-secondary-fixed active:text-surface font-semibold tracking-wide transition-colors"
          >
            <span className="material-symbols-outlined text-[13px] leading-none" aria-hidden="true">
              calendar_month
            </span>
            <span>Book a Personalised Appointment</span>
            <span className="material-symbols-outlined text-[11px] leading-none">arrow_forward</span>
          </Link>
        ) : (
          <p className="font-label-sm text-[10.5px] text-center opacity-90 truncate max-w-full">
            {messages[mobileIndex] || messages[0]}
          </p>
        )}
      </div>

      {/* sm and above: all announcements plus the clickable appointment link with calendar icon */}
      <div className="hidden sm:flex items-center justify-center gap-2 md:gap-3 py-2.5 px-4 font-label-sm text-label-sm flex-wrap">
        {messages.map((message, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed flex-shrink-0" aria-hidden="true" />}
            <span
              className={
                messages.length > 1 && i === Math.floor(messages.length / 2)
                  ? 'opacity-95 font-semibold text-secondary-fixed'
                  : 'opacity-80'
              }
            >
              {message}
            </span>
          </Fragment>
        ))}

        {/* Separator before Appointment option */}
        <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed flex-shrink-0" aria-hidden="true" />

        {/* Clickable Appointment Option */}
        <Link
          href="/book-appointment"
          className="inline-flex items-center gap-1.5 text-secondary-fixed hover:text-surface font-semibold transition-colors group underline-offset-4 hover:underline"
        >
          <span
            className="material-symbols-outlined text-[14px] leading-none text-secondary-fixed group-hover:text-surface transition-colors"
            aria-hidden="true"
          >
            calendar_month
          </span>
          <span>Book a Personalised Appointment</span>
        </Link>
      </div>
    </aside>
  );
}
