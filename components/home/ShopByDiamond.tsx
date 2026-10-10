export default function ShopByDiamond() {
  const diamondCategories = [
    {
      id: 'natural-diamond',
      tag: 'Earth Mined',
      title: 'Natural Dia Jewellery',
      desc: 'Certified authentic natural diamonds with everlasting prestige and fire.',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      href: '/search?q=natural%20diamond',
    },
    {
      id: 'lab-grown',
      tag: 'Conscious Luxury',
      title: 'Lab Grown Jewellery',
      desc: 'Precision-created diamonds matching identical optical and physical brilliance.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      href: '/search?q=lab%20grown',
    },
    {
      id: 'solitaires',
      tag: 'Statement Centerpiece',
      title: 'Solitaire Essentials',
      desc: 'Iconic single-stone masterpieces cut for maximum light dispersion.',
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
      href: '/search?q=solitaire',
    },
    {
      id: 'dia-jewellery',
      tag: 'Timeless Pavé',
      title: 'Dia Jewellery',
      desc: 'Versatile diamond designs crafted for daily elegance and grand occasions.',
      image: 'https://images.unsplash.com/photo-1611591475152-4735661db190?auto=format&fit=crop&w=800&q=80',
      href: '/search?q=diamond',
    },
    {
      id: 'gemstone',
      tag: 'Royal Hues',
      title: 'Gemstone Jewellery',
      desc: 'Vibrant rubies, emeralds, and sapphires harmonized with glittering diamonds.',
      image: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80',
      href: '/search?q=gemstone',
    },
  ];

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="shop-by-diamond">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">
          Certified Brilliance &amp; Cuts
        </span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">
          Shop by Diamond
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Explore certified natural stones, lab-grown brilliance, iconic solitaire centerpieces, and vivid gemstone harmonies.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
        {diamondCategories.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50 hover:border-secondary/60 transition-all duration-300"
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
              <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">
                {item.tag}
              </span>
              <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1 leading-tight">
                {item.title}
              </h3>
              <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block line-clamp-2">
                {item.desc}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
