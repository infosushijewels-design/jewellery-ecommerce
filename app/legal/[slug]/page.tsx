import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LegalContent from '@/components/legal/LegalContent';
import { getLegalPage } from '@/lib/supabase/queries';
import { isBuiltInLegalSlug, legalPagePath } from '@/lib/legal';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return { title: 'Page not found | Sushi Jewels' };
  return { title: `${page.title} | Sushi Jewels`, description: page.summary || undefined };
}

export default async function LegalSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Built-in pages have their own canonical routes
  if (isBuiltInLegalSlug(slug)) redirect(legalPagePath(slug));

  const page = await getLegalPage(slug);
  if (!page) notFound();
  return <LegalContent page={page} />;
}
