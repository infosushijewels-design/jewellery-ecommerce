export default function Hero() {
  return (
    <section className="relative bg-surface-container-low overflow-hidden border-b border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[720px]">
        {/* Text Composition */}
        <div className="lg:col-span-6 space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/40 bg-surface/80">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Royal Solitaire Anthology 2025</span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight">
            Made to Be <br /><span className="italic font-normal">Remembered</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg leading-relaxed">
            Timeless jewellery crafted in 18K gold and conflict-free diamonds for every extraordinary moment, sculpted with Indian royal intimacy.
          </p>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <a className="px-8 py-4 bg-primary-container hover:bg-tertiary-container text-surface font-label-lg text-label-lg rounded-full shadow-sm hover:scale-[1.01] transition-all duration-200" href="#new-arrivals">
              Shop New Arrivals
            </a>
            <a className="px-8 py-4 border border-primary text-primary hover:bg-surface-container font-label-lg text-label-lg rounded-full transition-all duration-200" href="#collections">
              Explore Collections
            </a>
          </div>
          {/* Micro Features */}
          <div className="pt-8 grid grid-cols-3 gap-6 border-t border-outline-variant/40">
            <div>
              <span className="block font-headline-sm text-headline-sm text-primary">100%</span>
              <span className="font-label-sm text-label-sm text-outline tracking-wider">BIS HALLMARKED</span>
            </div>
            <div>
              <span className="block font-headline-sm text-headline-sm text-primary">IGI / GIA</span>
              <span className="font-label-sm text-label-sm text-outline tracking-wider">NATURAL DIAMONDS</span>
            </div>
            <div>
              <span className="block font-headline-sm text-headline-sm text-primary">Bespoke</span>
              <span className="font-label-sm text-label-sm text-outline tracking-wider">MASTER ATELIERS</span>
            </div>
          </div>
        </div>
        
        {/* Hero Visual Composition */}
        <div className="lg:col-span-6 relative">
          <div className="relative w-full aspect-[4/5] max-w-[540px] mx-auto rounded-xl overflow-hidden border border-outline-variant/40 shadow-[0_20px_48px_-8px_rgba(45,32,36,0.09)]">
            <img className="w-full h-full object-cover" data-alt="Editorial portrait of an elegant Indian woman wearing layered high-end 18K gold and solitaire diamond necklaces with matching chandelier earrings, set against a soft ivory studio background with warm atmospheric lighting highlighting the glistening jewelry details and artisanal craftsmanship." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0FB5dAQipFSv89rFwMwZCZkI-5XdmdOGQ_XR2lBdIjLiK_ZJ20efMBqAW_OGEW6n2shguosrj0IfoELmeQi7-BIU_GI6-Zx51A_8wbhuI4dGjC2O4C9VENXNb8Sy2Zx8-BVUL-k2RfTfVyPDB5TTmTAML--wqa0xqc_UUOsxlTpST-OwO-gpbYXbGcoU98K8U3mZWTFRb7AzE1ifEfZTwEEjRH7-NVBHtynfVbBft5bRbgBLc4NCx2A" alt="Hero Banner" />
            
            {/* Floating Editorial Pill */}
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/50 flex items-center justify-between">
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Featured Haute Piece</p>
                <p className="font-headline-sm text-headline-sm text-primary">Aurelia Cascade Collar in 18K Gold</p>
              </div>
              <span className="font-body-md text-body-md font-semibold text-secondary">₹1,85,000</span>
            </div>
          </div>
          
          {/* Slider Pagination Accent */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="w-8 h-1 bg-secondary rounded-full"></span>
            <span className="w-2 h-1 bg-outline-variant rounded-full"></span>
            <span className="w-2 h-1 bg-outline-variant rounded-full"></span>
          </div>
        </div>
      </div>
    </section>
  );
}
