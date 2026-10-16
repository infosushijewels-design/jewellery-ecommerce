import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CustomizeDesignCard from '@/components/home/CustomizeDesignCard';

export const metadata = {
  title: 'Customize Your Design | Sushi Jewels',
  description: 'Have a design in mind? Upload your sketch or reference and our master craftsmen will bring it to life.',
};

export default function CustomizeYourDesignPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="pt-4">
        <CustomizeDesignCard />
      </main>
      <Footer />
    </>
  );
}
