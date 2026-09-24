import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_STORE_SETTINGS, mergeStoreSettings, type StoreSettings } from '@/lib/storeSettings';
import { FALLBACK_BRANCHES, sortStores, type StoreBranch } from '@/lib/stores';

/**
 * Cookie-less client for public, cacheable reads on the server (e.g. metadata).
 * Using it instead of the cookie-based server client keeps pages static; results
 * are revalidated every 5 minutes.
 */
function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 10 } }),
      },
    }
  );
}

export async function getPublicStoreSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await createPublicClient().from('store_settings').select('settings').eq('id', 1).maybeSingle();
    if (error || !data) return DEFAULT_STORE_SETTINGS;
    const settings = mergeStoreSettings(data.settings);
    // Security: Never expose the Razorpay secret to the frontend.
    if (settings.payments?.razorpayKeySecret) {
      settings.payments.razorpayKeySecret = '';
    }
    return settings;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

/** Active store branches for the storefront; falls back to the seeded pair before migration 012. */
export async function getPublicStores(): Promise<StoreBranch[]> {
  try {
    const { data, error } = await createPublicClient()
      .from('store_branches')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) return FALLBACK_BRANCHES;
    return sortStores((data as StoreBranch[]) || []);
  } catch {
    return FALLBACK_BRANCHES;
  }
}

/** Latest approved product reviews for the homepage testimonials (empty before migration 009). */
export async function getPublicTestimonials(limit = 12) {
  try {
    const { data, error } = await createPublicClient()
      .from('product_reviews')
      .select('id, reviewer_name, rating, title, comment, created_at')
      .eq('status', 'approved')
      .gte('rating', 4)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []) as { id: string; reviewer_name: string; rating: number; title: string | null; comment: string | null; created_at: string }[];
  } catch {
    return [];
  }
}
