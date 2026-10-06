/**
 * Guest order access: one-time codes, the signed "verified guest" cookie, and finding a guest's orders.
 * Server-only (uses node:crypto and the service-role client).
 *
 * How a guest proves who they are, with no account:
 *   1. They type the email or mobile number they ordered with.
 *   2. A 6-digit code is emailed to the address on their order(s).
 *   3. The right code sets a signed, HttpOnly cookie that is valid for a few hours and carries ONLY that
 *      email/mobile. Every guest-order API re-checks each order against it on the server.
 * Typing an order id, email or mobile alone never shows anything.
 */
import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EMAIL_RE, normalizeIndianPhone } from '@/lib/checkoutValidation';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_LIMITS = { perIdentifierPerHour: 5, perIpPerHour: 10, globalPerHour: 300 };
export const SESSION_COOKIE = 'sj_guest';
export const SESSION_TTL_SECONDS = 2 * 60 * 60;

export type GuestIdentity = { kind: 'email' | 'phone'; value: string };

// ---------------------------------------------------------------- identifiers
/** What the visitor typed → a normalised email or 10-digit mobile, or null if it is neither. */
export function parseGuestIdentifier(input: unknown): GuestIdentity | null {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!text || text.length > 254) return null;
  if (text.includes('@')) {
    const email = text.toLowerCase();
    return EMAIL_RE.test(email) ? { kind: 'email', value: email } : null;
  }
  const phone = normalizeIndianPhone(text);
  return phone ? { kind: 'phone', value: phone.replace(/\D/g, '').slice(-10) } : null;
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return '***';
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(name.length - 1, 6)))}@${domain}`;
}

// ---------------------------------------------------------------- secrets
function secret(purpose: string): string | null {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return base ? createHmac('sha256', base).update(`sushi-jewels:${purpose}`).digest('hex') : null;
}

// ---------------------------------------------------------------- one-time codes
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

/** Keyed hash of a code, bound to the identifier it was issued for. The code itself is never stored. */
export function hashOtp(code: string, identity: GuestIdentity): string | null {
  const key = secret('guest-otp');
  return key ? createHmac('sha256', key).update(`${identity.kind}:${identity.value}:${code}`).digest('hex') : null;
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

// ---------------------------------------------------------------- signed session cookie
const b64 = (value: string) => Buffer.from(value).toString('base64url');

export function createSessionToken(identity: GuestIdentity, now = Date.now()): string | null {
  const key = secret('guest-session');
  if (!key) return null;
  const payload = b64(JSON.stringify({ k: identity.kind, v: identity.value, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS }));
  const signature = createHmac('sha256', key).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readSessionToken(token: string | undefined | null, now = Date.now()): GuestIdentity | null {
  const key = secret('guest-session');
  if (!key || !token || token.length > 600) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', key).update(payload).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { k?: string; v?: string; exp?: number };
    if ((data.k !== 'email' && data.k !== 'phone') || typeof data.v !== 'string' || typeof data.exp !== 'number') return null;
    if (data.exp * 1000 < now) return null;
    return parseGuestIdentifier(data.v);
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: SESSION_TTL_SECONDS };
}

// ---------------------------------------------------------------- finding a guest's orders
export const GUEST_ORDER_SELECT =
  'id, order_number, status, subtotal, tax, shipping_fee, total, payment_method, payment_status, shipping_address, notes, created_at, updated_at, items:order_items(id, order_id, product_id, title, image_url, price, quantity, metal, size, created_at)';

/** Escapes the characters that act as wildcards in an ILIKE pattern, so an email is matched literally. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Every spelling of a 10-digit mobile number that checkout (old or new) may have stored. */
export function phoneVariants(digits: string): string[] {
  return [`+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, digits, `+91${digits}`, `91${digits}`, `+91 ${digits}`, `0${digits}`];
}

/** Orders placed without an account (user_id NULL) whose checkout email / mobile matches the verified identity. */
export function guestOrdersQuery(admin: SupabaseClient, identity: GuestIdentity) {
  const query = admin.from('orders').select(GUEST_ORDER_SELECT).is('user_id', null);
  return identity.kind === 'email'
    ? query.ilike('shipping_address->>email', escapeLike(identity.value))
    : query.in('shipping_address->>phone', phoneVariants(identity.value));
}

/** Same shape the order pages already use (FullOrder), with everything private blanked out. */
export function toPublicOrder<T extends Record<string, unknown>>(row: T) {
  return {
    ...row,
    user_id: null,
    razorpay_order_id: null,
    razorpay_payment_id: null,
    paid_at: null,
    tracking_token: null,
    stock_reserved: false,
    refunded_amount: 0,
    items: (row as { items?: unknown[] }).items ?? [],
  };
}

/** Short fingerprint, handy for logs without printing an address. */
export const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 8);
