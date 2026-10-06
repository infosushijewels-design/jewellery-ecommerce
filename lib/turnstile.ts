/**
 * Cloudflare Turnstile — a conditional "are you human?" check, shown ONLY to a visitor who has hit a rate limit.
 * Normal visitors never see it: they are protected by the hidden honeypot, the form-speed check and the limits
 * (lib/requestGuard.ts). Server-only.
 *
 * Environment variables (both optional):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   public key the widget needs (set at build time)
 *   TURNSTILE_SECRET_KEY             secret used to verify the token (server only — never expose it)
 * Without them nothing changes: a visitor over the limit just gets the normal "please wait" 429.
 */
import { NextResponse } from 'next/server';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Past this multiple of the limit a visitor is refused outright — solving the check does not unlock more. */
export const CAPTCHA_HARD_CEILING_FACTOR = 4;

export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY?.trim() && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
}

/** Checks a token the widget produced. false when keys are missing, the token is empty/invalid, or Cloudflare is unreachable. */
export async function verifyTurnstileToken(token: unknown, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set('remoteip', ip);
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export type LimitDecision = 'ok' | 'captcha' | 'blocked';

/**
 * What to do with a request given how many the visitor has already made.
 *   under the limit                      → ok
 *   over, but solved the check           → ok (a person, so let them through — up to the hard ceiling)
 *   over, check available, not yet solved → captcha (the form shows the widget and retries)
 *   over, no check configured / way over  → blocked (plain "please wait")
 */
export async function decideRateLimit(input: { count: number; limit: number; token?: unknown; ip?: string | null }): Promise<LimitDecision> {
  const { count, limit, token, ip } = input;
  if (count < limit) return 'ok';
  if (count >= limit * CAPTCHA_HARD_CEILING_FACTOR || !turnstileConfigured()) return 'blocked';
  return (await verifyTurnstileToken(token, ip)) ? 'ok' : 'captcha';
}

/** The 429 answer. `captchaRequired` tells the form to show the Turnstile widget and retry with its token. */
export function tooManyRequests(decision: Exclude<LimitDecision, 'ok'>, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, error: message, ...(decision === 'captcha' ? { captchaRequired: true } : {}), ...extra },
    { status: 429, headers: { 'Retry-After': '600' } }
  );
}
