import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import Collections from '@/components/home/Collections';
import NewArrivals from '@/components/home/NewArrivals';
import Campaign from '@/components/home/Campaign';
import Bestsellers from '@/components/home/Bestsellers';
import Editorial from '@/components/home/Editorial';
import Materials from '@/components/home/Materials';
import SignatureEdit from '@/components/home/SignatureEdit';
import GiftFinder from '@/components/home/GiftFinder';
import Heritage from '@/components/home/Heritage';
import TrustMatrix from '@/components/home/TrustMatrix';
import StoreExperience from '@/components/home/StoreExperience';
import Testimonials from '@/components/home/Testimonials';
import Newsletter from '@/components/layout/Newsletter';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Categories />
        <Collections />
        <NewArrivals />
        <Campaign />
        <Bestsellers />
        <Editorial />
        <Materials />
        <SignatureEdit />
        <GiftFinder />
        <Heritage />
        <TrustMatrix />
        <StoreExperience />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
