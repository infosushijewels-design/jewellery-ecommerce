import Link from 'next/link';

const BANNERS = [
  {
    id: 'shop-by-metal',
    heading: 'Shop by Metal',
    href: '/shop-by-metal',
    image: '/images/yellow_gold.jpg',
    alt: 'Premium yellow, white, and rose gold jewellery finishes',
  },
  {
    id: 'shop-by-diamond',
    heading: 'Shop by Diamond',
    href: '/shop-by-diamond',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    alt: 'Certified natural and lab-grown diamond jewellery',
  },
];

export default function CategoryBanners() {
  return (
    <section className="pb-12 sm:pb-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {BANNERS.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low overflow-hidden h-[140px] sm:h-[180px]"
          >
            <div className="pl-5 sm:pl-8 flex-shrink-0">
              <h3 className="font-headline-sm text-[18px] sm:text-headline-sm text-primary leading-tight">
                {banner.heading}
              </h3>
              <Link
                href={banner.href}
                className="font-label-md text-label-md text-primary hover:text-secondary transition-colors underline underline-offset-4 mt-2 inline-block"
              >
                Discover More
              </Link>
            </div>
            <div className="h-full w-[42%] sm:w-[45%] flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                src={banner.image}
                alt={banner.alt}
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
