import Image from 'next/image';
import Link from 'next/link';

export default function Campaign() {
  return (
    <section className="relative w-full overflow-hidden" id="campaign">
      {/* Full-width banner image */}
      <div className="relative w-full aspect-[16/6] md:aspect-[21/7] lg:aspect-[24/7]">
        <Image
          src="/images/hero/banner-3.png"
          alt="Jewellery that Blooms with You"
          fill
          className="object-cover object-center"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/40 to-transparent sm:via-black/30 sm:to-transparent" />
        {/* On mobile: center overlay */}
        <div className="absolute inset-0 bg-black/30 sm:hidden" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center sm:justify-end">
          <div className="px-5 sm:px-16 lg:px-24 text-center sm:text-right max-w-xs sm:max-w-xl lg:max-w-2xl">
            <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-semibold block mb-2 sm:mb-3">
              Natural Diamonds
            </span>
            <h2
              className="text-white leading-tight"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(22px, 5vw, 58px)',
              }}
            >
              Jewellery that <br />
              <em>Blooms with You</em>
            </h2>
            <p className="text-white/80 text-xs sm:text-base mt-2 sm:mt-3 mb-4 sm:mb-6 leading-relaxed hidden sm:block">
              Timeless pieces for your every special moment.
            </p>
            <Link
              href="/anthologies"
              className="inline-block bg-[#D4AF37] hover:bg-[#c09c2d] text-[#0F0F11] font-semibold px-5 sm:px-7 py-2 sm:py-3 rounded-full text-xs sm:text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
