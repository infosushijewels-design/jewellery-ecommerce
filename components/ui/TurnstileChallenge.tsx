"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
/** Loads Cloudflare's script once, and only when a visitor actually needs the check. */
function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the security check.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

function TurnstileModal({ onToken, onCancel }: { onToken: (token: string) => void; onCancel: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widgetId = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onToken(token),
          'error-callback': () => setError('The security check could not be completed. Please close this and try again.'),
          'expired-callback': () => setError('The check expired. Please tick it again.'),
        });
      })
      .catch(() => setError('The security check could not be loaded. Please check your connection and try again.'));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  return (
    <Modal isOpen onClose={onCancel} title="Quick security check">
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
        You have made a lot of requests in a short time. Please confirm you are a person to continue — it takes one click.
      </p>
      <div ref={box} className="flex justify-center min-h-[70px]" />
      {error && (
        <p role="alert" className="mt-3 text-xs text-error">
          {error}
        </p>
      )}
    </Modal>
  );
}

export interface CaptchaReply<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  json: (T & { error?: string; captchaRequired?: boolean; success?: boolean }) | null;
  /** True when the visitor was asked to prove they are human and closed the box instead */
  dismissed?: boolean;
}

/**
 * POST JSON to a public form endpoint. Normally this is a plain fetch. Only when the server answers 429 with
 * `captchaRequired: true` (the visitor is over a rate limit AND Turnstile is configured) does it show Cloudflare's
 * one-click check, then automatically repeat the request with the token as `cf-turnstile-response`.
 * Render `challenge` somewhere in the form's JSX.
 */
export function useCaptchaPost() {
  const [asking, setAsking] = useState<{ resolve: (token: string | null) => void } | null>(null);

  const send = useCallback(async (url: string, payload: Record<string, unknown>): Promise<CaptchaReply> => {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = (await res.json().catch(() => null)) as CaptchaReply['json'];
      return { ok: res.ok, status: res.status, json };
    } catch {
      return { ok: false, status: 0, json: { error: 'Could not reach the server. Please check your connection and try again.' } };
    }
  }, []);

  const postJson = useCallback(
    async (url: string, payload: Record<string, unknown>): Promise<CaptchaReply> => {
      const first = await send(url, payload);
      if (first.status !== 429 || !first.json?.captchaRequired || !SITE_KEY) return first;
      const token = await new Promise<string | null>((resolve) => setAsking({ resolve }));
      setAsking(null);
      if (!token) return { ...first, dismissed: true };
      return send(url, { ...payload, 'cf-turnstile-response': token });
    },
    [send]
  );

  const challenge = asking ? <TurnstileModal onToken={(token) => asking.resolve(token)} onCancel={() => asking.resolve(null)} /> : null;
  return { postJson, challenge };
}
