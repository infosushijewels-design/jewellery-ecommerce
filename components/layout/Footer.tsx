export default function Footer() {
  return (
    <footer className="bg-primary text-surface pt-20 pb-10 border-t border-outline-variant/20 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 relative z-10">
        
        {/* Brand & Manifesto */}
        <div className="lg:col-span-4 pr-4">
          <a className="flex flex-col items-start group inline-block mb-6" href="#">
            <span className="font-headline-lg text-[32px] text-surface tracking-tight group-hover:text-secondary-fixed transition-colors duration-200">Sushi Jewels</span>
            <span className="font-label-sm text-[10px] text-outline-variant tracking-[0.25em] -mt-1 font-normal">FINE JEWELLERY</span>
          </a>
          <p className="font-body-sm text-body-sm text-surface-dim leading-relaxed max-w-sm">
            Translating the eternal grammar of Indian royalty into modern fine jewellery. We steward ethically sourced natural diamonds and BIS hallmarked precious metals into heirlooms meant to be lived in.
          </p>
        </div>
        
        {/* Navigation Columns */}
        <div className="lg:col-span-2">
          <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-6">The Collections</h4>
          <ul className="space-y-4">
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">High Jewellery</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Everyday Edit</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Bridal Trousseau</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Menswear Classics</a></li>
          </ul>
        </div>
        
        <div className="lg:col-span-2">
          <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-6">Client Services</h4>
          <ul className="space-y-4">
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Book Consultation</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Bespoke Design</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Jewellery Care</a></li>
            <li><a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors" href="#">Track Order</a></li>
          </ul>
        </div>
        
        {/* Concierge & Contact */}
        <div className="lg:col-span-4 lg:pl-8">
          <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-6">Atelier Concierge</h4>
          <p className="font-body-sm text-body-sm text-surface-dim mb-4">Available Monday - Saturday<br/>10:00 AM to 7:00 PM (IST)</p>
          <a className="font-headline-sm text-headline-sm text-secondary-fixed hover:text-surface transition-colors block mb-2" href="tel:+918001234567">+91 800 123 4567</a>
          <a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors block mb-8" href="mailto:concierge@sushijewels.com">concierge@sushijewels.com</a>
          
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full border border-outline-variant/40 flex items-center justify-center hover:bg-secondary hover:border-secondary transition-all" href="#" title="Instagram">
              <span className="font-label-sm text-label-sm uppercase">IG</span>
            </a>
            <a className="w-10 h-10 rounded-full border border-outline-variant/40 flex items-center justify-center hover:bg-secondary hover:border-secondary transition-all" href="#" title="Pinterest">
              <span className="font-label-sm text-label-sm uppercase">PT</span>
            </a>
            <a className="w-10 h-10 rounded-full border border-outline-variant/40 flex items-center justify-center hover:bg-secondary hover:border-secondary transition-all" href="#" title="Facebook">
              <span className="font-label-sm text-label-sm uppercase">FB</span>
            </a>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 mt-16 pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-label-sm text-label-sm text-surface-dim">© 2025 Sushi Jewels Private Limited. All Rights Reserved.</p>
        <div className="flex flex-wrap gap-4 md:gap-8">
          <a className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="#">Terms of Service</a>
          <a className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="#">Privacy Policy</a>
          <a className="font-label-sm text-label-sm text-surface-dim hover:text-surface transition-colors" href="#">Shipping &amp; Returns</a>
        </div>
      </div>
    </footer>
  );
}
