export default function Materials() {
  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="materials">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Precious Metals &amp; Finishes</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Shop by Metal</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Discover certified purity across our hallmark golds, contemporary hues, and timeless heritage finishes.</p>
      </div>
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5 overflow-x-auto sm:overflow-x-visible pb-3 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Panel 1: Yellow Gold */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50 w-[68vw] sm:w-auto flex-shrink-0 snap-start" href="/search?q=yellow%20gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/yellow_gold.jpg" alt="Yellow Gold" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Pure Gold</span>
            <h3 className="font-headline-sm text-[14px] sm:text-headline-sm mt-0.5 sm:mt-1">Yellow Gold</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Warm heritage sheen with government BIS Hallmarking.</p>
          </div>
        </a>

        {/* Panel 2: White Gold */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50 w-[68vw] sm:w-auto flex-shrink-0 snap-start" href="/search?q=white%20gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80" alt="White Gold" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Precious White</span>
            <h3 className="font-headline-sm text-[14px] sm:text-headline-sm mt-0.5 sm:mt-1">White Gold</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Lustrous rhodium finish with contemporary modern brilliance.</p>
          </div>
        </a>

        {/* Panel 3: Rose Gold */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50 w-[68vw] sm:w-auto flex-shrink-0 snap-start" href="/search?q=rose%20gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80" alt="Rose Gold" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Rose Gold</span>
            <h3 className="font-headline-sm text-[14px] sm:text-headline-sm mt-0.5 sm:mt-1">Rose Gold</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Subtle blush alloys formulated for daily skin comfort.</p>
          </div>
        </a>

        {/* Panel 4: Three Tone */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50 w-[68vw] sm:w-auto flex-shrink-0 snap-start" href="/search?q=three%20tone">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80" alt="Three Tone" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Tricolor Harmony</span>
            <h3 className="font-headline-sm text-[14px] sm:text-headline-sm mt-0.5 sm:mt-1">Three Tone</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Exquisite harmony of yellow, white, and rose gold in one piece.</p>
          </div>
        </a>

        {/* Panel 5: Heritage & Vintage */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50 w-[68vw] sm:w-auto flex-shrink-0 snap-start" href="/collections/premium-collection">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80" alt="Heritage & Vintage" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-5 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Artisan Craft</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Heritage &amp; Vintage</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Intricately handcrafted antique finishes inspired by royal heirlooms.</p>
          </div>
        </a>
      </div>
    </section>
  );
}
