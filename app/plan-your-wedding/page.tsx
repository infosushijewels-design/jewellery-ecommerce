import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import WeddingPlanner from '@/components/wedding/WeddingPlanner';
import { getWeddingPlannerCatalog } from '@/lib/supabase/queries';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Plan Your Wedding, With Love | Sushi Jewels',
  description: 'Share your wedding jewellery budget, preferred items, and style — Sushi Jewels will curate matching pieces or arrange a private atelier consultation.',
};

export default async function PlanYourWeddingPage() {
  const catalog = await getWeddingPlannerCatalog();

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full bg-surface">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Plan Your Wedding' }]} />
        </div>
        <WeddingPlanner catalog={catalog} />
      </main>
      <Footer />
    </>
  );
}
