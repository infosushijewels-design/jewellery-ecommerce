import Image from 'next/image';
import Link from 'next/link';

export default function Campaign() {
  return (
    <section className="relative w-full overflow-hidden" id="campaign">
      {/* Full-width banner image. The headline, eyebrow and copy are already
          baked into banner-3.png, so no text is overlaid on top of it here —
          that used to duplicate the same words and made them unreadable. */}
      <Link href="/anthologies" className="relative block w-full aspect-[16/6] md:aspect-[21/7] lg:aspect-[24/7] group">
        <Image
          src="/images/hero/banner-3.png"
          alt="Jewellery that Blooms with You — Natural Diamonds, timeless pieces for your every special moment"
          fill
          className="object-cover object-center"
      </Link>
    </section>
  );
}
