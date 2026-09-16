export default function GiftFinder() {
  return (
    <section className="py-20 max-w-[1440px] mx-auto px-6 lg:px-16" id="gift-finder">
      <div className="bg-surface rounded-2xl border border-outline-variant/60 p-8 lg:p-16 shadow-[0_8px_24px_-4px_rgba(45,32,36,0.04)]">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Concierge Assistant</span>
          <h2 className="font-headline-lg text-headline-lg text-primary mt-1">Find Something They’ll Treasure Forever</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Select the chapter and investment range to reveal tailor-made curations.</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Occasion Selectors */}
          <div>
            <label className="block font-label-md text-label-md text-primary mb-3 text-center sm:text-left">1. Select the Occasion</label>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-primary text-surface transition-all">Anniversary</button>
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary transition-all">Birthday</button>
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary transition-all">Everyday Treat</button>
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary transition-all">Wedding &amp; Vows</button>
            </div>
          </div>
          
          {/* Budget Selectors */}
          <div>
            <label className="block font-label-md text-label-md text-primary mb-3 text-center sm:text-left">2. Choose Investment Range</label>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary transition-all">Under ₹15,000</button>
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-primary text-surface transition-all">₹15,000 - ₹35,000</button>
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary transition-all">₹35,000 - ₹75,000</button>
              <button className="px-5 py-2.5 rounded-full font-label-md text-label-md bg-surface-container border border-outline-variant/60 text-primary hover:border-secondary transition-all">Above ₹75,000</button>
            </div>
          </div>
          
          {/* Submit Search CTA */}
          <div className="pt-6 text-center">
            <button className="px-10 py-4 bg-primary-container text-surface hover:bg-tertiary-container font-label-lg text-label-lg rounded-full shadow hover:scale-[1.01] transition-all">
              Find the Perfect Gift
            </button>
            <p className="font-label-sm text-label-sm text-outline mt-3 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">redeem</span> Complimentary luxury gift packaging included with all orders
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
