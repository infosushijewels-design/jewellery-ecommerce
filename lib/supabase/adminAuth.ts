import { createClient } from '@/lib/supabase/server';

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type AdminAuthResult =
  | { ok: true; supabase: ServerSupabaseClient; userId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Verifies the request's session cookie belongs to a signed-in admin, and returns the same
 * cookie-scoped Supabase client so callers can reuse it for RLS-respecting DB/storage calls
 * (the "Admins can insert products" / "Admins upload store media" policies key off this
 * session's auth.uid(), so no service-role bypass is needed here).
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, error: 'Please sign in with an admin account.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'admin') {
    return { ok: false, status: 403, error: 'Admin access required.' };
  }

  return { ok: true, supabase, userId: user.id };
}
