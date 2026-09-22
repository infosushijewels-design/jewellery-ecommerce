"use client";

import { Fragment } from 'react';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

export default function AnnouncementBar() {
  const { announcement } = useStoreSettings();
  const messages = announcement.messages.map((m) => m.trim()).filter(Boolean);

  if (!announcement.enabled || messages.length === 0) return null;

  return (
    <aside className="bg-primary-container text-surface border-b border-outline-variant/20 tracking-wider">
      {/* Mobile: single centered message */}
      <p className="sm:hidden font-label-sm text-[10px] text-center py-2 px-3 opacity-90">{messages[0]}</p>
      {/* sm and above: all messages; the middle one is highlighted */}
      <p className="hidden sm:flex items-center justify-center gap-2 md:gap-3 py-2.5 px-4 font-label-sm text-label-sm flex-wrap">
        {messages.map((message, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed flex-shrink-0" />}
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
      </p>
    </aside>
  );
}
