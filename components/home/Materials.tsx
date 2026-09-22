export default function Materials() {
  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="materials">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Pure Materials</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Curated by Precious Metal</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Discover certified purity across our hallmark golds and ethically sourced diamonds.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Panel 1 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUGRjechmXyNJ5uZJyu2_vioB_1b5lSDTXQNS4LzGdG4edTR0e1W4FWKHu1TH5BwLslniLr57QBQISNsUg1yTKxeHYPpev1aEezBgTm174gv5XPz15slZPOLBT49XZ0hw7KfQUSje4QeYRvaUBbfOiGgRDWSYcXWoBtX3Z5c8wF8t-cQymS6bHKsZjMcEOQS7d284TNz6_UNZz_ldpLOBePLtkwGb8TPDDtwQGmmn-019iPtCXYG0GdA" alt="Yellow Gold" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Authentic Radiance</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Yellow Gold (22K &amp; 18K)</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Warm heritage sheen with government BIS Hallmarking.</p>
          </div>
        </a>

        {/* Panel 2 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=diamond">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfBfjbsKOf-kmwyXVosUwKoPvg3A72ejkFtJwP9ugsq3V7LuDd7z2UyXQSZtpyVc4gK7zAu1seCpHfdupN0h3CLxRcHADSP9ao3aaiGd0vFpniAeLqRp5r8Yu5uRW3hA4dlrsgjL35bdrjqx5iIO5PVt8jc0VfFIdomok1dAj-4rKKOua1Twxs5zY8KJ67mze-HRXySK-QEEsVkfcc_IQLaViS_qom-YPvBedARGDEvg1uCbgxMMdEZQ" alt="Pure Natural Diamonds" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Uncompromising Fire</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Pure Natural Diamonds</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Conflict-free certified gems graded VVS-VS clarity.</p>
          </div>
        </a>

        {/* Panel 3 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=rose%20gold">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTKrESRN8Hzj_O-ugM67H4ytI_RDMDab0N9dUPIusA0QLWC_j8SDjF_VqnZDWNXSHNbPDHSYId1wPCzhw5RuRV1651TBRAfPw9xDgtK2NhamUgzReIBRmb_r_OWgh1Sxjl5rawdpip3YyrZFI8XWppNtZxqSZ306P7TvGbLxsIhXNpsipy_tFo72W4B1AfXzHle2EiS69LNL_t7c4c6_78zt8KmAFu4D4ojtnfMgbek_3iynWSol17fw" alt="Rose Gold Elegance" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Warm Contemporary</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Rose Gold Elegance</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Subtle blush alloys formulated for daily skin comfort.</p>
          </div>
        </a>

        {/* Panel 4 */}
        <a className="group relative rounded-xl overflow-hidden aspect-[3/4] sm:aspect-[4/5] bg-surface-container border border-outline-variant/50" href="/search?q=solitaire">
          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKXLnmYjpfb86k3Fkq9IlB0GD0lAmoAdsMEBgSIy5J3Xg91tJPXSBh9kVaoiMkOtnA6a5t3ZX91jwafcIRfRovZLfJOaOm8PxkSiwlDCFCNifBkHgmLt8jnW8XfLNjeuo4viJ8lD2wNw0SBVXXjgcyf_TxJgpcTB_knoEH3jReorW-FYRIEAIItT34diNwq-oHhLIZnd9-K5UX8PdSB67J2MPGFFLHeniAipcaVUC3aWHtKmwTucYYNg" alt="Solitaire Essentials" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 text-surface">
            <span className="font-label-sm text-[8px] sm:text-label-sm text-secondary-fixed tracking-wider uppercase">Rare Provenance</span>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm mt-0.5 sm:mt-1">Solitaire Essentials</h3>
            <p className="font-body-sm text-[11px] sm:text-body-sm opacity-80 mt-0.5 sm:mt-1 hidden sm:block">Custom mountings with individual GIA grading dossier.</p>
          </div>
        </a>
      </div>
    </section>
  );
}
