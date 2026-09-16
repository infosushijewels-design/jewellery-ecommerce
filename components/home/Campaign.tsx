export default function Campaign() {
  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-16 my-10" id="campaign">
      <div className="relative bg-primary-container text-surface rounded-2xl overflow-hidden p-8 lg:p-14 border border-outline-variant/20 shadow-[0_20px_48px_-8px_rgba(45,32,36,0.15)] flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Pattern Overlay */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border border-secondary-fixed/20 pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-60 h-60 rounded-full border border-secondary-fixed/10 pointer-events-none"></div>
        
        <div className="max-w-2xl relative z-10">
          <span className="font-label-sm text-label-sm text-secondary-fixed tracking-[0.2em] uppercase block mb-2">Festive Privileges &amp; Curations</span>
          <h2 className="font-headline-lg text-headline-lg lg:text-[40px] text-surface font-medium leading-tight">
            More Sparkle, More Reasons <br className="hidden sm:block"/>to Celebrate
          </h2>
          <p className="font-body-md text-body-md text-on-primary-container mt-3 max-w-lg">
            Enjoy up to 20% off making charges on signature diamond creations and complimentary bespoke engraving throughout this season.
          </p>
        </div>
        
        <div className="relative z-10 flex-shrink-0">
          <a className="px-8 py-4 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim font-label-lg text-label-lg rounded-full transition-all duration-200 inline-block shadow-lg hover:scale-[1.02]" href="#offers">
            Shop Festival Offers
          </a>
        </div>
      </div>
    </section>
  );
}
