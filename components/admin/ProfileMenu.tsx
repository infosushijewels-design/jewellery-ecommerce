"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getInitials } from './AdminUI';

export default function ProfileMenu({
  name,
  email,
  roleName,
  showSettings,
  onSignOut,
}: {
  name: string;
  email: string;
  roleName: string;
  showSettings: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass =
    'flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D2024]/80 hover:text-[#2D2024] hover:bg-[#F5EEE7] transition-colors w-full text-left';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full pl-1 pr-2 py-1 hover:bg-[#E8D5C5]/30 transition-colors"
      >
        <span className="w-9 h-9 rounded-full bg-[#2D2024] text-[#FAF7F2] flex items-center justify-center text-xs font-bold uppercase">
          {getInitials(name)}
        </span>
        <span className="hidden sm:block min-w-0 text-left">
          <span className="block text-xs text-[#2D2024] font-medium truncate max-w-[160px]">{name}</span>
          <span className="block text-[10px] text-[#8A6F3C] uppercase tracking-wider">{roleName}</span>
        </span>
        <span className={`material-symbols-outlined text-[18px] text-[#2D2024]/50 transition-transform ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl shadow-[0_12px_32px_rgba(45,32,36,0.12)] overflow-hidden z-50 animate-[drawerIn_0.15s_ease-out]"
        >
          <div className="px-4 py-3.5 border-b border-[#E8D5C5]">
            <p className="text-sm font-semibold text-[#2D2024] truncate">{name}</p>
            <p className="text-xs text-[#2D2024]/55 truncate">{email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B99A62]/15 text-[#8A6F3C]">
              {roleName}
            </span>
          </div>
          <div className="py-1.5">
            {showSettings && (
              <Link href="/admin/settings" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                <span className="material-symbols-outlined text-[20px] text-[#8A6F3C]">settings</span>
                Store Settings
              </Link>
            )}
            <Link href="/forgot-password" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <span className="material-symbols-outlined text-[20px] text-[#8A6F3C]">lock_reset</span>
              Change Password
            </Link>
            <Link href="/" target="_blank" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <span className="material-symbols-outlined text-[20px] text-[#8A6F3C]">storefront</span>
              View Store
            </Link>
          </div>
          <div className="border-t border-[#E8D5C5] py-1.5">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                await onSignOut();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
