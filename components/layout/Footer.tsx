import Link from 'next/link';
import FooterContact from './FooterContact';

export default function Footer() {
  return (
    <footer className="bg-primary text-surface pt-12 sm:pt-20 pb-8 sm:pb-10 border-t border-outline-variant/20 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 relative z-10">

        {/* Top row: Brand full-width on mobile, left col on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">

          {/* Brand & Manifesto */}
          <div className="lg:col-span-4 lg:pr-4">
            <Link className="inline-block mb-5 sm:mb-6" href="/" aria-label="Sushi Jewels — home">
              {/* The logo is black on white; invert + screen turns it white on the dark footer with no box around it */}
              <img src="/logo.jpeg" alt="Sushi Jewels" width={638} height={978} className="h-28 sm:h-32 w-auto invert mix-blend-screen" />
            </Link>
            <p className="font-body-sm text-body-sm text-surface-dim leading-relaxed max-w-sm">
              Translating the eternal grammar of Indian royalty into modern fine jewellery. We steward ethically sourced natural diamonds and BIS hallmarked precious metals into heirlooms meant to be lived in.
            </p>
          </div>

          {/* Nav columns — 2-col grid on mobile, individual cols on desktop */}
          <div className="grid grid-cols-2 sm:contents gap-6 lg:col-span-4">

            {/* Collections */}
            <div className="lg:col-span-2">
              <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">The Collections</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/collections/premium-collection">High Jewellery</Link></li>
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/collections/best-sellers">Everyday Edit</Link></li>
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/collections/bridal-collection">Bridal Trousseau</Link></li>
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/search?q=men">Menswear Classics</Link></li>
              </ul>
            </div>

            {/* Client Services */}
            <div className="lg:col-span-2">
              <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">Client Services</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/about">About Us</Link></li>
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/contact">Contact Us</Link></li>
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/faq">FAQ</Link></li>
                <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/orders">Track Order</Link></li>
              </ul>
            </div>
          </div>

          {/* Concierge & Contact */}
          <FooterContact />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <p className="font-label-sm text-label-sm text-surface-dim">© 2025 Sushi Jewels Private Limited. All Rights Reserved.</p>
        <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4 md:gap-8">
          <Link className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="/terms">Terms &amp; Conditions</Link>
          <Link className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="/privacy-policy">Privacy Policy</Link>
          <Link className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="/shipping-policy">Shipping Policy</Link>
          <Link className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="/return-policy">Returns &amp; Exchanges</Link>
        </div>
      </div>
    </footer>
  );
}

