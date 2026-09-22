"use client";

import type { ReactNode } from 'react';

/** Shared light-luxury building blocks for admin pages. */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <span className="text-[11px] uppercase tracking-widest text-[#8A6F3C] font-semibold">{eyebrow}</span>
        <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#2D2024] mt-1">{title}</h1>
        <p className="text-sm text-[#2D2024]/60 mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  icon,
  disabled,
  spinning,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 bg-[#FFFCF7] hover:bg-[#E8D5C5]/40 border border-[#E8D5C5] text-[#2D2024] px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {icon && (
        <span className={`material-symbols-outlined text-[18px] text-[#8A6F3C] ${spinning ? 'animate-spin' : ''}`}>{icon}</span>
      )}
      {children}
    </button>
  );
}

export function StatTile({ icon, value, label, tone }: { icon: string; value: ReactNode; label: string; tone: string }) {
  return (
    <div className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_10px_rgba(45,32,36,0.05)]">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="font-headline-sm text-2xl text-[#2D2024] leading-tight truncate">{value}</div>
        <div className="text-xs text-[#2D2024]/60 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2024]/50 text-xl">search</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-full pl-11 pr-9 py-2.5 text-sm text-[#2D2024] placeholder:text-[#2D2024]/40 focus:outline-none focus:border-[#B99A62] focus:ring-2 focus:ring-[#B99A62]/20 transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2024]/40 hover:text-[#2D2024]"
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-full pl-4 pr-9 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62] cursor-pointer appearance-none"
      style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FilterPills<T extends string>({
  tabs,
  active,
  onChange,
  counts,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
              isActive
                ? 'bg-[#2D2024] border-[#2D2024] text-[#FAF7F2]'
                : 'bg-[#FFFCF7] border-[#E8D5C5] text-[#2D2024]/75 hover:text-[#2D2024] hover:bg-[#E8D5C5]/40'
            }`}
          >
            <span>{tab.label}</span>
            {counts && (
              <span className={`text-[11px] tabular-nums ${isActive ? 'text-[#FAF7F2]/70' : 'text-[#2D2024]/45'}`}>
                {counts[tab.key] || 0}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[#B99A62]' : 'bg-[#2D2024]/15'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function IconButton({
  icon,
  title,
  onClick,
  tone = 'default',
  href,
  external,
}: {
  icon: string;
  title: string;
  onClick?: () => void;
  tone?: 'default' | 'danger' | 'whatsapp';
  href?: string;
  external?: boolean;
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-[#2D2024]/55 hover:text-red-600 hover:bg-red-50'
      : tone === 'whatsapp'
        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
        : 'text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/50';
  const className = `p-2 rounded-full inline-flex transition-colors ${toneClass}`;

  if (href) {
    return (
      <a
        href={href}
        title={title}
        aria-label={title}
        className={className}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} className={className}>
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
  noun,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
  noun: string;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  // Compact page list: first, last, current ±1, with ellipses
  const pages: (number | '…')[] = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) pages.push(n);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-[#E8D5C5]">
      <p className="text-sm text-[#2D2024]/70">
        Showing {start}–{end} of {totalItems} {noun}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-full border border-[#E8D5C5] bg-[#FFFCF7] text-[#2D2024] flex items-center justify-center hover:bg-[#E8D5C5]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        {pages.map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-[#2D2024]/40">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                n === page
                  ? 'bg-[#2D2024] text-[#FAF7F2]'
                  : 'border border-[#E8D5C5] bg-[#FFFCF7] text-[#2D2024]/75 hover:bg-[#E8D5C5]/40'
              }`}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-full border border-[#E8D5C5] bg-[#FFFCF7] text-[#2D2024] flex items-center justify-center hover:bg-[#E8D5C5]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(45,32,36,0.05)]">
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="py-16 text-center text-[#2D2024]/60">
      <span className="material-symbols-outlined text-4xl mb-2 text-[#2D2024]/25">{icon}</span>
      <p className="text-sm">{title}</p>
      {hint && <p className="text-xs text-[#2D2024]/45 mt-1">{hint}</p>}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="py-20 text-center text-[#2D2024]/60">
      <span className="material-symbols-outlined text-3xl animate-spin text-[#B99A62] mb-2">progress_activity</span>
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-[#2D2024]/45 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-600 text-xl">delete_forever</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-base text-[#2D2024]">{title}</h3>
            <div className="text-sm text-[#2D2024]/70 mt-1">{message}</div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="border border-[#E8D5C5] text-[#2D2024]/80 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-[#F5EEE7] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  widthClass = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#2D2024]/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className={`relative w-full ${widthClass} h-full bg-[#FFFCF7] border-l border-[#E8D5C5] shadow-2xl overflow-y-auto animate-[drawerIn_0.22s_ease-out]`}
      >
        {children}
      </aside>
    </div>
  );
}

export const CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232D2024' stroke-opacity='0.55' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

export function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatINR(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

/** wa.me link for an Indian mobile number (adds 91 when a bare 10-digit number is given). */
export function whatsappLink(phone?: string | null, text?: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const inputClass =
  'w-full bg-white border border-[#E8D5C5] rounded-lg px-4 py-2.5 text-sm text-[#2D2024] placeholder:text-[#2D2024]/35 focus:outline-none focus:border-[#B99A62] focus:ring-2 focus:ring-[#B99A62]/20 transition';

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] uppercase tracking-wider text-[#2D2024]/60 mb-1.5 font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[#2D2024]/50 mt-1">{hint}</p>}
    </div>
  );
}

export function DrawerHeader({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 bg-[#FFFCF7]/95 backdrop-blur-sm border-b border-[#E8D5C5] px-6 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <span className="text-[11px] uppercase tracking-widest text-[#8A6F3C] font-semibold">{eyebrow}</span>
        <h3 className="font-headline-sm text-xl text-[#2D2024] truncate">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-full text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/50"
        aria-label="Close"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}

export function DrawerFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 bg-[#FFFCF7]/95 backdrop-blur-sm border-t border-[#E8D5C5] px-6 py-4 flex justify-end gap-3">
      {children}
    </div>
  );
}

/** Turns Supabase/RLS failures into an actionable message. `migration` names the SQL file that creates the table. */
export function friendlyDbError(err: unknown, migration: string) {
  const message = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Something went wrong';
  if (/does not exist|schema cache|Could not find the table/i.test(message)) {
    return `Table not found — run migration ${migration} in the Supabase SQL editor.`;
  }
  if (/row-level security|permission denied/i.test(message)) {
    return 'Permission denied — sign in with an admin account.';
  }
  if (/duplicate key|unique/i.test(message)) {
    return 'That value is already in use — please choose another.';
  }
  return message;
}

export function MigrationNotice({ migration, show }: { migration: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
      <span className="material-symbols-outlined text-amber-600">database</span>
      <p>
        This section needs its database table. Run <code className="font-mono text-xs bg-white/70 px-1.5 py-0.5 rounded">{migration}</code> in
        the Supabase SQL editor, then refresh.
      </p>
    </div>
  );
}

export function isMissingTableError(err: unknown) {
  const message = (err as { message?: string })?.message || '';
  const code = (err as { code?: string })?.code || '';
  return code === '42P01' || code === 'PGRST205' || /does not exist|schema cache|Could not find the table/i.test(message);
}
