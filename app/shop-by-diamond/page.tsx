import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ShopByDiamond from '@/components/home/ShopByDiamond';

export const metadata = {
  title: 'Shop by Diamond | Sushi Jewels',
  description: 'Explore fine jewellery by diamond type — Natural Diamonds, Lab Grown, Solitaire, Pavé, and Gemstone.',
};

export default function ShopByDiamondPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="pt-4">
        <ShopByDiamond />
      </main>
      <Footer />
    </>
  );
}
