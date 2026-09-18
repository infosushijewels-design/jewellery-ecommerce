export default function Heritage() {
  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="heritage">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Generational Mastery</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Made with Meaning</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Every piece embodies an unbroken lineage of Indian goldsmithing and transparent sourcing.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Pillar 1 */}
          <div className="p-5 sm:p-6 rounded-xl bg-surface border border-outline-variant/40">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-4 sm:mb-5">
              <span className="material-symbols-outlined text-[22px] sm:text-[26px]">verified</span>
            </div>
            <h3 className="font-headline-sm text-[16px] sm:text-headline-sm text-primary">BIS 916 Hallmarking</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              Every gram of gold is rigorously tested and stamped with Bureau of Indian Standards hallmark credentials for certified bullion purity.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-5 sm:p-6 rounded-xl bg-surface border border-outline-variant/40">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-4 sm:mb-5">
              <span className="material-symbols-outlined text-[22px] sm:text-[26px]">diamond</span>
            </div>
            <h3 className="font-headline-sm text-[16px] sm:text-headline-sm text-primary">IGI &amp; GIA Certified</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              All natural diamonds feature international laboratory grading certificates guaranteeing color, cut grade, clarity, and carat veracity.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-5 sm:p-6 rounded-xl bg-surface border border-outline-variant/40">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-4 sm:mb-5">
              <span className="material-symbols-outlined text-[22px] sm:text-[26px]">public</span>
            </div>
            <h3 className="font-headline-sm text-[16px] sm:text-headline-sm text-primary">Conflict-Free Sourcing</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              Adhering strictly to the Kimberley Process Certification Scheme, ensuring our supply chain supports fair mining livelihoods with zero conflict.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-5 sm:p-6 rounded-xl bg-surface border border-outline-variant/40">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-4 sm:mb-5">
              <span className="material-symbols-outlined text-[22px] sm:text-[26px]">handyman</span>
            </div>
            <h3 className="font-headline-sm text-[16px] sm:text-headline-sm text-primary">Master Indian Goldsmithing</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              Handcrafted in Jaipur and Mumbai ateliers by heritage karigars whose families have sculpted royal jewellery for more than four generations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
