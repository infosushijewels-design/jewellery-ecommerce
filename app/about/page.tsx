import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'The Atelier & Heritage | Sushi Jewels',
  description: 'Discover the story of Sushi Jewels — master karigars, BIS 916 hallmarked gold, and conflict-free natural diamonds, handcrafted into timeless heirlooms.',
};

const values = [
  {
    icon: 'diversity_3',
    title: 'Ethical Sourcing',
    description: 'Every diamond and gemstone is traced through the Kimberley Process Certification Scheme, ensuring fair, conflict-free mining livelihoods across our supply chain.',
  },
  {
    icon: 'no_accounts',
    title: 'Zero Child Labour',
    description: 'We audit every atelier and sourcing partner against strict labour standards. Our karigars are skilled adult artisans, fairly compensated for generational craft.',
  },
  {
    icon: 'eco',
    title: 'Sustainability Commitment',
    description: 'From recycled precious metals to responsibly mined gold, we minimise environmental impact at every stage of the jewellery-making journey.',
  },
];

const certifications = [
  {
    icon: 'verified',
    title: 'BIS 916 Hallmarking',
    description: 'Every gram of gold used across our collections is assayed and hallmarked to the Bureau of Indian Standards\' 916 (22K) purity grade, so authenticity is never in question.',
  },
  {
    icon: 'diamond',
    title: 'IGI / GIA Certification',
    description: 'Natural diamonds above 30 cents are accompanied by independent IGI or GIA grading reports verifying the 4Cs — carat, cut, clarity, and colour.',
  },
  {
    icon: 'workspace_premium',
    title: 'Purity Guarantee',
    description: 'Every invoice discloses exact metal weight, purity, and diamond certification numbers — full transparency, with a lifetime buyback promise to match.',
  },
];

export default function AboutPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full">
        {/* Hero */}
        <section className="relative bg-[#0F0F11] overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6">
            <div className="text-white/80">
              <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'About Us' },
                ]}
              />
            </div>
          </div>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-10 sm:py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              {/* Text Content */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <span className="font-label-sm text-sm text-[#D4AF37] tracking-[0.3em] uppercase">The Atelier &amp; Heritage</span>
                <h1 className="font-serif mt-4 leading-[1.1] text-white" style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 5vw, 64px)' }}>
                  Made to Make You Feel Beautiful
                </h1>
                <p className="font-body-md text-sm sm:text-body-lg text-white/70 mt-4 sm:mt-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  For four generations, Sushi Jewels has translated the eternal grammar of Indian royalty into fine jewellery meant to be lived in — handcrafted by master karigars, in certified gold and conflict-free diamonds. Our commitment is to timeless beauty, tradition, and luxury craftsmanship.
                </p>
                <div className="mt-8 flex justify-center lg:justify-start">
                  <div className="w-16 h-[1px] bg-[#D4AF37]"></div>
                </div>
              </div>
              {/* Image Content */}
              <div className="order-1 lg:order-2 relative">
                <div className="relative w-full max-w-[280px] sm:max-w-sm mx-auto lg:max-w-none aspect-[3/4] sm:aspect-[4/5] rounded-tl-[60px] sm:rounded-tl-[80px] rounded-br-[60px] sm:rounded-br-[80px] overflow-hidden border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                  <Image
                    src="/images/about-hero.png"
                    alt="Made to Make You Feel Beautiful"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F11]/60 via-transparent to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Heritage & Craftsmanship */}
        <section className="py-14 sm:py-24 bg-surface">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Heritage &amp; Craftsmanship</span>
              <h2 className="font-headline-lg text-[26px] sm:text-headline-lg text-primary mt-2 leading-tight">
                Sculpted by Master Karigars
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Our ateliers in Jaipur and Mumbai are home to karigars whose families have shaped royal jewellery for more than four generations. Each piece begins as a hand-drawn sketch and passes through the hands of specialist goldsmiths, stone-setters, and polishers before it earns the Sushi Jewels mark.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                We work exclusively with hallmarked gold and conflict-free natural diamonds, honouring a craft tradition that prizes patience over production speed. Nothing leaves our workshop until it meets the exacting standard our founders set decades ago.
              </p>
            </div>
          </div>
        </section>

        {/* Certification & Purity Matrix */}
        <section className="py-14 sm:py-24 bg-surface-container-low border-y border-outline-variant/30">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
            <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
              <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Certification &amp; Purity Matrix</span>
              <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Provenance You Can Verify</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
              {certifications.map((cert) => (
                <div key={cert.title} className="p-6 sm:p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-5">
                    <span className="material-symbols-outlined text-[26px]">{cert.icon}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">{cert.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">{cert.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Values */}
        <section className="py-14 sm:py-24 bg-surface">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
            <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
              <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Our Values</span>
              <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">A Promise Beyond the Piece</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
              {values.map((value) => (
                <div key={value.title} className="p-6 sm:p-8 rounded-xl border border-outline-variant/40 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-5 mx-auto sm:mx-0">
                    <span className="material-symbols-outlined text-[26px]">{value.icon}</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">{value.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-20 bg-primary text-surface text-center">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
            <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-surface mb-4">Experience the Atelier in Person</h2>
            <p className="font-body-md text-body-md text-surface-dim max-w-xl mx-auto mb-8">
              Book a private consultation with our concierge team to explore bespoke commissions and heirloom collections.
            </p>
            <Link href="/contact" className="inline-block bg-secondary text-primary px-8 py-3.5 rounded-full font-label-md uppercase tracking-wide hover:bg-secondary-fixed-dim transition-colors">
              Book an Appointment
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
