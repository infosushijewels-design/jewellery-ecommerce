"use client";

import React, { useEffect, useRef } from 'react';
import { LoadingLabel } from '@/components/ui/Spinner';

/**
 * "Are you sure you want to log out?" — shown before a customer is signed out. Styled like the site's other
 * confirmation boxes (e.g. removing a saved address). Escape or a click outside closes it, unless the logout is
 * already running.
 */
export default function LogoutConfirmDialog({
  open,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-text"
        className="bg-surface rounded-xl shadow-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-6">
          <span className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </span>
          <div>
            <h3 id="logout-confirm-title" className="font-headline-sm text-headline-sm text-primary mb-1">
              Are you sure you want to log out?
            </h3>
            <p id="logout-confirm-text" className="text-body-sm text-on-surface-variant">
              Your bag is kept on this device. You can sign back in any time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-5 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            className="px-5 py-2.5 rounded-full font-label-sm text-label-sm uppercase tracking-wider bg-primary text-surface hover:bg-tertiary transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            <LoadingLabel loading={!!busy} loadingText="Logging out…">
              Logout
            </LoadingLabel>
          </button>
        </div>
      </div>
    </div>
  );
}
