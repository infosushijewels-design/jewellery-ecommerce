export default function Materials() {
  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="materials">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Gold &amp; Diamond Purity</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Shop by Metal &amp; Diamond</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Discover certified purity across our hallmark golds and ethically sourced diamonds.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Panel 1 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/yellow_gold.jpg" alt="Yellow Gold" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Pure Gold</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Yellow Gold (22K &amp; 18K)</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Warm heritage sheen with government BIS Hallmarking.</p>
          </div>
        </a>

        {/* Panel 2 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=diamond">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80" alt="Pure Natural Diamonds" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Certified Diamonds</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Pure Natural Diamonds</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Conflict-free certified gems graded VVS-VS clarity.</p>
          </div>
        </a>

        {/* Panel 3 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=rose%20gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80" alt="Rose Gold Elegance" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Rose Gold</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Rose Gold Elegance</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Subtle blush alloys formulated for daily skin comfort.</p>
          </div>
        </a>

        {/* Panel 4 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=solitaire">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80" alt="Solitaire Essentials" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Solitaires</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Solitaire Essentials</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Custom mountings with individual GIA grading dossier.</p>
          </div>
        </a>
      </div>
    </section>
  );
}
