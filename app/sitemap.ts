import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPublicStoreSettings } from '@/lib/supabase/public';

export const revalidate = 3600; // Cache sitemap for 1 hour

function createPublicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicStoreSettings();
  const rawBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    settings.store.websiteUrl ||
    'https://www.sushijewels.in';

  // Normalize base URL without trailing slash
  const baseUrl = rawBase.replace(/\/+$/, '');

  // 1. Curated Public Static Pages (strictly excluding admin, auth, checkout, account, orders)
  const staticRoutes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/collections', priority: 0.9, changeFrequency: 'daily' },
    { path: '/category', priority: 0.9, changeFrequency: 'daily' },
    { path: '/new-arrivals', priority: 0.9, changeFrequency: 'daily' },
    { path: '/anthologies', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/book-appointment', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy-policy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/shipping-policy', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/return-policy', priority: 0.5, changeFrequency: 'monthly' },
  ];

  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // 2. Dynamic Categories, Collections, Products, and Legal Pages from Supabase
  const supabase = createPublicSupabase();
  if (supabase) {
    try {
      const [categoriesRes, collectionsRes, productsRes, legalRes] = await Promise.all([
        supabase
          .from('categories')
          .select('slug, updated_at, is_active')
          .order('name'),
        supabase
          .from('collections')
          .select('slug, updated_at')
          .order('name'),
        supabase
          .from('products')
          .select('slug, updated_at')
          .order('created_at', { ascending: false })
          .limit(5000),
        supabase
          .from('legal_pages')
          .select('slug, updated_at, is_active')
          .eq('is_active', true),
      ]);

      // Category URLs
      if (categoriesRes.data) {
        for (const cat of categoriesRes.data) {
          if (cat.is_active === false || !cat.slug) continue;
          entries.push({
            url: `${baseUrl}/category/${encodeURIComponent(cat.slug)}`,
            lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }

      // Collection URLs
      if (collectionsRes.data) {
        for (const col of collectionsRes.data) {
          if (!col.slug) continue;
          entries.push({
            url: `${baseUrl}/collections/${encodeURIComponent(col.slug)}`,
            lastModified: col.updated_at ? new Date(col.updated_at) : now,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }

      // Product URLs
      if (productsRes.data) {
        for (const prod of productsRes.data) {
          if (!prod.slug) continue;
          entries.push({
            url: `${baseUrl}/product/${encodeURIComponent(prod.slug)}`,
            lastModified: prod.updated_at ? new Date(prod.updated_at) : now,
            changeFrequency: 'weekly',
            priority: 0.85,
          });
        }
      }

      // Custom Admin Legal Pages (excluding built-in paths which already exist)
      if (legalRes.data) {
        const builtIns = new Set(['privacy-policy', 'terms', 'shipping-policy', 'return-policy']);
        for (const legal of legalRes.data) {
          if (!legal.slug || builtIns.has(legal.slug)) continue;
          entries.push({
            url: `${baseUrl}/legal/${encodeURIComponent(legal.slug)}`,
            lastModified: legal.updated_at ? new Date(legal.updated_at) : now,
            changeFrequency: 'monthly',
            priority: 0.5,
          });
        }
      }
    } catch (err) {
      console.error('Error generating dynamic sitemap from Supabase:', err);
    }
  }

  return entries;
}
