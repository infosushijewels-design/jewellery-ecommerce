"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoadingLabel } from '@/components/ui/Spinner';
import { SprigArt } from '@/components/auth/LogoutConfirmDialog';

export interface AdminLogoutDialogProps {
  open: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * "READY TO SIGN OUT?" confirmation modal for Admin Panel.
 * Uses createPortal into <body> so backdrop blur in the admin header does not trap it.
 * Matches the client-side modal design with Sushi Jewels logo, serif headline,
 * star divider, botanical watermark and luxury pill buttons.
 */
export function AdminLogoutDialog({
  open,
  busy,
  onConfirm,
  onCancel,
}: AdminLogoutDialogProps) {
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#2D2024]/40 backdrop-blur-sm transition-opacity"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-logout-title"
        className="relative w-full max-w-[calc(100%-32px)] sm:max-w-[480px] md:max-w-[520px] overflow-hidden rounded-[24px] bg-[#FAF7F2] border border-[#E8D5C5]/70 p-6 sm:p-8 md:p-9 shadow-[0_24px_60px_-12px_rgba(45,32,36,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle botanical line-art watermark on right edge */}
        <SprigArt className="text-[#8A6F3C]" />

        {/* Top bar: Centered Brand Logo + Top-Right Close Button */}
        <div className="relative flex items-center justify-center w-full mb-5 sm:mb-6">
          <img
            src="/logo.jpeg"
            alt="Sushi Jewels"
            width={638}
            height={978}
            className="h-11 sm:h-13 w-auto object-contain mix-blend-multiply select-none"
          />
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="absolute right-0 top-0 -mr-2 -mt-2 sm:-mr-3 sm:-mt-3 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6F3C]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Heading */}
        <h3
          id="admin-logout-title"
          className="relative font-headline-sm text-[22px] sm:text-[26px] md:text-[28px] font-normal leading-tight uppercase tracking-[0.08em] text-[#2D2024] text-center"
        >
          READY TO SIGN OUT?
        </h3>

        {/* Luxury Divider with Star Ornament */}
        <div className="relative flex items-center justify-center gap-3 my-5 sm:my-6 w-full max-w-[200px] sm:max-w-[220px] mx-auto">
          <div className="h-[1px] flex-1 bg-[#C6A87D]/50" />
          <svg
            viewBox="0 0 16 16"
            className="w-3.5 h-3.5 text-[#8A6F3C] flex-shrink-0"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 0 Q8 8 16 8 Q8 8 8 16 Q8 8 0 8 Q8 8 8 0 Z" />
          </svg>
          <div className="h-[1px] flex-1 bg-[#C6A87D]/50" />
        </div>

        {/* Buttons */}
        <div className="relative mt-2 grid grid-cols-2 gap-3 sm:gap-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-12 px-4 rounded-full border border-[#8A6F3C]/50 bg-transparent text-xs sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#2D2024] hover:border-[#8A6F3C] hover:bg-[#F5EEE7]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6F3C]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            className="min-h-12 px-4 rounded-full bg-[#2D2024] text-xs sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] hover:bg-[#1E1418] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6F3C]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] disabled:opacity-60 disabled:cursor-wait"
          >
            <LoadingLabel loading={!!busy} loadingText="Signing out…">
              <span className="inline-flex items-center justify-center gap-2">
                SIGN OUT
                <span aria-hidden="true">→</span>
              </span>
            </LoadingLabel>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AdminLogoutDialog;
