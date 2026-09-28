import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * A Supabase client authenticated with the service role key — bypasses RLS
 * entirely. Only use this for trusted server-side code that must read data
 * no ordinary session (guest OR even a logged-in admin) can via RLS — e.g.
 * reading a payment gateway's secret key to process a guest's checkout, or
 * applying a webhook update that arrives with no user session at all.
 *
 * Never import this from a Client Component; it would ship the service role
 * key to the browser.
 *
 * Returns null (never throws) if SUPABASE_SERVICE_ROLE_KEY isn't set yet —
 * `new Resend(...)`-style module-scope construction crashed the entire build
 * once already in this project (see app/api/send-order-email/route.ts) — so
 * callers create this lazily, inside the request handler, and respond
 * gracefully instead of crashing when the key is missing.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
