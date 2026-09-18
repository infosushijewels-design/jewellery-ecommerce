export default function Collections() {
  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30" id="collections">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Signature Anthologies</span>
            <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Curated Collections</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Themes woven in precious metal, telling stories across generations.</p>
          </div>
          <a className="font-label-lg text-label-lg text-primary hover:text-secondary flex items-center gap-1 group flex-shrink-0" href="#">
            View All Anthologies
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Collection 1 */}
          <article className="group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col">
            <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGBHMckxZb5c0fQWJYYTSyVRHsBc9fXIHCFnuING2mfSghzq6v1g7vKlhEyCx15n58bXutss2o6UA8x_69znxMJvPUQ70rxhrRkLw0WQlHJFDccdObrMwEFGSkennoUsWJaN_nm4S1Tu_lxGzpxbtKYr8Xjz3erODoJ4U9tkcpLT09pgFI4cj6LueTHxAiRdJRY-6CNp5ho3LDlBUectANLrTn3sWDqARr8NAOb7WEGjVsXW-bXKcS3Q" alt="Everyday Luxury" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Everyday Luxury</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-1">The Everyday Edit</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Weightless 18K gold forms designed to glide effortlessly from boardroom cadence to private evenings.</p>
              </div>
              <div className="pt-4 sm:pt-6">
                <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                  Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </article>

          {/* Collection 2 */}
          <article className="group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col">
            <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-H9Xvu3YmPXsf6OF_Qrys1lz3BoPTufC3vXf9bOM0RXDIT6zQPix_VCRp4mjk5kFPMl2iRWofjkSbb8bm-THKprCk07xVq4XlIjOi8Tx4ffcq815fp26tn8ENmKTctiFTPngpHmaLkB25aahzaTvuJD7IGbwsGqe7yYKY3ECHuSRfmd-9iSnpWUS5B3rnX2lP6d7J4RnTjR0VAEaJJCbAzAbOh_vzpWAn86HOKkdzDAoKVvLXhbuz8A" alt="Royal Provenance" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Royal Provenance</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-1">Modern Heirlooms</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Timeless Jadau and antique polish silhouettes re-imagined through contemporary European minimalism.</p>
              </div>
              <div className="pt-4 sm:pt-6">
                <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                  Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </article>

          {/* Collection 3 */}
          <article className="group relative bg-surface rounded-xl overflow-hidden border border-outline-variant/50 hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.08)] transition-all duration-300 flex flex-col sm:col-span-2 md:col-span-1">
            <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-surface-container">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9ZzGg3JyVot2TgX45PNawp2Ve3a69LYtU3LStvvsed6VIzq9znShKly7gQuaXx6h8eAWs9BqWhu2TMh9j8Dlpg6WFqhyvo_i_dZ-lBYU8gyzXzZZZGWcsh4iWRAfqnPeXRlZz4DCBWLicQFwjINfqPkKPSKVBsfydqgwBtqxLkqA9M803ykOvDJIla8mDeBYCXpwJOHaMZExT7UnkAATLxs-BwZyTk6dm4OKs7CKjD1U2ThTNmK69gw" alt="The Vivaha Suite" />
            </div>
            <div className="p-5 sm:p-8 flex flex-col flex-grow justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Vivaha Suite</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-1">Celebration &amp; Bridal</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Sculptural opulence consecrated for grand vows, featuring certified natural diamonds of rare grading.</p>
              </div>
              <div className="pt-4 sm:pt-6">
                <span className="font-label-md text-label-md font-semibold text-primary group-hover:text-secondary transition-colors inline-flex items-center gap-1">
                  Explore Collection <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
