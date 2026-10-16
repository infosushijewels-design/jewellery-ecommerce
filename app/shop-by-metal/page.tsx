import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Materials from '@/components/home/Materials';

export const metadata = {
  title: 'Shop by Metal | Sushi Jewels',
  description: 'Explore fine jewellery by precious metal — Yellow Gold, White Gold, Rose Gold, Three Tone, and Heritage finishes.',
};

export default function ShopByMetalPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="pt-4">
        <Materials />
      </main>
      <Footer />
    </>
  );
}
