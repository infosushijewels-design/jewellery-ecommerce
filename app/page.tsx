import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import Collections from '@/components/home/Collections';
import Campaign from '@/components/home/Campaign';
import Bestsellers from '@/components/home/Bestsellers';
import Editorial from '@/components/home/Editorial';
import Materials from '@/components/home/Materials';
import ShopByDiamond from '@/components/home/ShopByDiamond';
import CustomizeDesignCard from '@/components/home/CustomizeDesignCard';
import GiftFinder from '@/components/home/GiftFinder';
import Heritage from '@/components/home/Heritage';
import TrustMatrix from '@/components/home/TrustMatrix';
import FlagshipAtelier from '@/components/home/FlagshipAtelier';
import Testimonials from '@/components/home/Testimonials';
import Footer from '@/components/layout/Footer';

export const revalidate = 60;

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Categories />
        <Collections />
        <Campaign />
        <Bestsellers />
        <Editorial />
        <Materials />
        <ShopByDiamond />
        <CustomizeDesignCard />
        <GiftFinder />
        <Heritage />
        <TrustMatrix />
        <FlagshipAtelier />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
