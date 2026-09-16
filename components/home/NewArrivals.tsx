export default function NewArrivals() {
  return (
    <section className="py-20 max-w-[1440px] mx-auto px-6 lg:px-16" id="new-arrivals">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Atelier Release</span>
          <h2 className="font-headline-lg text-headline-lg text-primary mt-1">New Arrivals</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Fresh creations hand-set by master artisans, ready for your moments.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <span className="px-3 py-1 text-xs rounded-full bg-surface-container border border-outline-variant/60 text-primary font-medium">All Stones</span>
          <span className="px-3 py-1 text-xs rounded-full bg-primary text-surface font-medium">Gold &amp; Diamonds</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Product 1 */}
        <div className="group bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all duration-300">
          <div className="relative aspect-[3/4] bg-surface rounded-lg overflow-hidden mb-4">
            <span className="absolute top-3 left-3 z-10 font-label-sm text-label-sm bg-surface/90 backdrop-blur-sm text-primary px-2 py-0.5 rounded-full border border-outline-variant">New</span>
            <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </button>
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRFlZwe7uKTdY7eu4pS2NTBd6Gzj1rn_mpCts6L9u6eogyFGG_WAy2UtnGdF24mM6VN8jfYMPaOgb8M3Mbn4Sd-fz7v2qtlANJ1ISEf5TQWAH3QJE8kL8SWQsMr4vazrpxVZF3azvzkeBn8IY7iBPS6N4Bz3oTynNrtIyvlv-QIVu3JoEzevcmeg4Je4iqWCOJYIBxAIFLktJBpkGiJbXERlz75fIdxbi6CuTA3GbdIHBSlMcBjUneTg" alt="Aurelia Cascade Gold Necklace" />
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="w-full py-2 bg-primary text-surface rounded-full font-label-md text-label-md shadow hover:bg-tertiary-container transition-colors">Quick Add</button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-label-sm text-secondary">18K Yellow Gold</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-[10px] text-outline">BIS 916</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Aurelia Cascade Gold Necklace</h3>
            <p className="font-body-md text-body-md text-primary font-semibold mt-2">₹48,500</p>
          </div>
        </div>
        
        {/* Product 2 */}
        <div className="group bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all duration-300">
          <div className="relative aspect-[3/4] bg-surface rounded-lg overflow-hidden mb-4">
            <span className="absolute top-3 left-3 z-10 font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-medium">Trending</span>
            <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </button>
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl14zRmFpajDitF1j6HU77aIgncoFhlHkSU5b3djxElrNCBqW2HlEoQ9WOKG3paW3X9aV36ZiO97w8tlmvqAyjMnXNi6iMggr0erJwQNejJ_GNE3oMPCroA3HzFZfExcv6p3vchH-L-4TC3hUipTtbiOY7fG-1vp8XVvJM1_B0qoLroIOykJiz8ZcgAwmtpEqxfHlEwOMpIfdksFbGIp7LUxI-aJ9z0Fft1RHIU2-pkzPuk6kPgx978w" alt="Solitaire Celestial Diamond Ring" />
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="w-full py-2 bg-primary text-surface rounded-full font-label-md text-label-md shadow hover:bg-tertiary-container transition-colors">Quick Add</button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-label-sm text-secondary">VVS-VS / EF Diamonds</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-[10px] text-outline">IGI Certified</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Solitaire Celestial Diamond Ring</h3>
            <p className="font-body-md text-body-md text-primary font-semibold mt-2">₹72,200</p>
          </div>
        </div>
        
        {/* Product 3 */}
        <div className="group bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all duration-300">
          <div className="relative aspect-[3/4] bg-surface rounded-lg overflow-hidden mb-4">
            <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </button>
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVJeGE9WYVXBr03UKoTGdDUHBsVVxWsX9kayQCXYD93ylwJo7PJHUc2_mc0evFifVUxfouDEaPAByQ9_S_vsSCycFch35UJuHhznmdGDOkxilScmR5hzh3XLCxISzmRO5P-8TJ_KQFBHui6IS1lyHZJ4HVrA6BrVchBos72eSj8fj-Dy8Qh6L4l3riJX-yw2mfpwfz-Rc3coMUwgCHZlpUjt4ektjZB8A4mvpMNuYZW-Bv-jqdHhjyTg" alt="Elysian Diamond Hoop Earrings" />
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="w-full py-2 bg-primary text-surface rounded-full font-label-md text-label-md shadow hover:bg-tertiary-container transition-colors">Quick Add</button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-label-sm text-secondary">Rose Gold 18K</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-[10px] text-outline">0.45 Ct Dia</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Elysian Diamond Hoop Earrings</h3>
            <p className="font-body-md text-body-md text-primary font-semibold mt-2">₹34,900</p>
          </div>
        </div>
        
        {/* Product 4 */}
        <div className="group bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all duration-300">
          <div className="relative aspect-[3/4] bg-surface rounded-lg overflow-hidden mb-4">
            <span className="absolute top-3 left-3 z-10 font-label-sm text-label-sm bg-primary text-surface px-2 py-0.5 rounded-full font-medium">Exclusive</span>
            <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm text-on-surface-variant hover:text-error flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[18px]">favorite</span>
            </button>
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1UpLJPjsbS5j_VLbJOEwZb4HcAjreKA7ef4OScdYEFykRZUCChZgg9bK7JJL_ePLM25RpVzcpAzsCmAjrgSICl-XZIOKWQ4XxDeCUE_XyvdAu8e9zFW8UUHLItN_etMS4QpI7jasfhuSMsRinBhdM6goBlz5TJ7ljCSbRZKnyIDs9DeAU6QJmRpE36n3xg-7r2zGf2iJz8mzw3U_bhpXSu65yLAPfreUmwsDocmkzrxg1Bif8qUE7Q" alt="Noor Delicate Tennis Bracelet" />
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button className="w-full py-2 bg-primary text-surface rounded-full font-label-md text-label-md shadow hover:bg-tertiary-container transition-colors">Quick Add</button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-sm text-label-sm text-secondary">1.50 Ct Natural Diamonds</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-[10px] text-outline">GIA Provenance</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Noor Delicate Tennis Bracelet</h3>
            <p className="font-body-md text-body-md text-primary font-semibold mt-2">₹1,15,000</p>
          </div>
        </div>
      </div>
      
      {/* Center View All Action */}
      <div className="mt-12 text-center">
        <a className="inline-flex items-center gap-2 px-8 py-3.5 border border-primary text-primary hover:bg-primary hover:text-surface font-label-lg text-label-lg rounded-full transition-all duration-200" href="#">
          View All 84 New Arrivals
          <span className="material-symbols-outlined text-[18px]">east</span>
        </a>
      </div>
    </section>
  );
}
