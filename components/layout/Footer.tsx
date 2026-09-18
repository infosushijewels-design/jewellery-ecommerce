import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-primary text-surface pt-12 sm:pt-20 pb-8 sm:pb-10 border-t border-outline-variant/20 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 relative z-10">

        {/* Brand & Manifesto */}
        <div className="sm:col-span-2 lg:col-span-4 lg:pr-4">
          <Link className="flex flex-col items-start group mb-5 sm:mb-6 inline-block" href="/">
            <span className="font-headline-lg text-[28px] sm:text-[32px] text-surface tracking-tight group-hover:text-secondary-fixed transition-colors duration-200">Sushi Jewels</span>
            <span className="font-label-sm text-[9px] sm:text-[10px] text-outline-variant tracking-[0.25em] -mt-1 font-normal">FINE JEWELLERY</span>
          </Link>
          <p className="font-body-sm text-body-sm text-surface-dim leading-relaxed max-w-sm">
            Translating the eternal grammar of Indian royalty into modern fine jewellery. We steward ethically sourced natural diamonds and BIS hallmarked precious metals into heirlooms meant to be lived in.
          </p>
        </div>

        {/* Navigation Columns */}
        <div className="lg:col-span-2">
          <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">The Collections</h4>
          <ul className="space-y-3 sm:space-y-4">
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">High Jewellery</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Everyday Edit</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Bridal Trousseau</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Menswear Classics</a></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">Client Services</h4>
          <ul className="space-y-3 sm:space-y-4">
            <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/about">About Us</Link></li>
            <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/contact">Contact Us</Link></li>
            <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/faq">FAQ</Link></li>
            <li><Link className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="/orders">Track Order</Link></li>
          </ul>
        </div>

        {/* Concierge & Contact */}
        <div className="sm:col-span-2 lg:col-span-4 lg:pl-8">
          <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">Atelier Concierge</h4>
          <p className="font-body-sm text-body-sm text-surface-dim mb-4">Available Monday - Saturday<br />10:00 AM to 7:00 PM (IST)</p>
          <a className="font-headline-sm text-headline-sm text-secondary-fixed hover:text-surface transition-colors block mb-2" href="tel:+918001234567">+91 800 123 4567</a>
          <a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors block mb-6 sm:mb-8" href="mailto:concierge@sushijewels.com">concierge@sushijewels.com</a>

          <div className="flex gap-3 sm:gap-4 flex-wrap">
            {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook"
              className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group">
              <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram"
              className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group">
              <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="YouTube"
              className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group">
              <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/918001234567" target="_blank" rel="noopener noreferrer" title="WhatsApp"
              className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group">
              <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            {/* X (Twitter) */}
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" title="X (Twitter)"
              className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group">
              <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn"
              className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group">
              <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
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
