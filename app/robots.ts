import { MetadataRoute } from 'next';
import { getPublicStoreSettings } from '@/lib/supabase/public';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicStoreSettings();
  const rawBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    settings.store.websiteUrl ||
    'https://www.sushijewels.in';

  const baseUrl = rawBase.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/account/',
          '/account',
          '/checkout/',
          '/checkout',
          '/orders/',
          '/orders',
          '/api/',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
