import Link from 'next/link';
import Image from 'next/image';
import FooterContact from './FooterContact';
import FooterSocialLinks from './FooterSocialLinks';

export default function Footer() {
  return (
    <footer className="bg-primary text-surface pt-12 sm:pt-20 pb-8 sm:pb-10 border-t border-outline-variant/20 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 relative z-10">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8 lg:gap-x-0">

          {/* Brand */}
          <div className="lg:pr-8">
            <Link className="inline-flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6" href="/" aria-label="Sushi Jewels — home">
              {/* The logo file has the "SUSHI JEWELS" wordmark baked into its bottom ~18%; no
                  symbol-only asset exists, so this crops it out visually (file itself is untouched)
                  since the brand name is now shown separately beside the logo. */}
              <div className="h-[46px] sm:h-[56px] overflow-hidden flex-shrink-0">
                {/* White-on-transparent version of the logo for the dark footer */}
                <Image src="/logo-footer.png" alt="Sushi Jewels Fine Jewellery" width={638} height={978} className="h-14 sm:h-[68px] w-auto" />
              </div>
              <span className="font-headline-sm sm:font-headline-md text-[17px] sm:text-headline-md text-surface tracking-wide leading-tight whitespace-nowrap">
                Sushi Jewels
              </span>
            </Link>
            <p className="font-body-sm text-body-sm text-surface-dim leading-relaxed max-w-sm">
              Timeless fine jewellery, crafted with care. BIS hallmarked gold and certified natural diamonds.
            </p>
            <FooterSocialLinks />
          </div>

          {/* Collections */}
          <div className="lg:border-l lg:border-outline-variant/20 lg:pl-8">
            <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">The Collections</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/collections/premium-collection">High Jewellery</Link></li>
              <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/collections/best-sellers">Everyday Edit</Link></li>
              <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/collections/bridal-collection">Bridal Trousseau</Link></li>
              <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/search?q=men">Menswear Classics</Link></li>
            </ul>
          </div>

          {/* Client Services */}
          <div className="lg:border-l lg:border-outline-variant/20 lg:pl-8">
            <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">Client Services</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/about">About Us</Link></li>
              <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Concierge & Contact */}
          <div className="lg:border-l lg:border-outline-variant/20 lg:pl-8">
            <FooterContact />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <p className="font-label-sm text-label-sm text-surface-dim">© 2025 Sushi Jewels Private Limited. All Rights Reserved.</p>
        <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4 md:gap-8">
          <Link className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="/terms">Terms &amp; Conditions</Link>
          <Link className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
