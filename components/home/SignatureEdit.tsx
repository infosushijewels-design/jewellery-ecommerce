export default function SignatureEdit() {
  return (
    <section className="py-20 bg-surface-container-low border-y border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        <div className="mb-12">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Editorial Selection</span>
          <h2 className="font-headline-lg text-headline-lg text-primary mt-1">The Signature Edit — Quiet Luxury</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Large Hero Feature (Left) */}
          <div className="lg:col-span-7 bg-surface rounded-2xl border border-outline-variant/50 overflow-hidden flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 h-full min-h-[380px] w-full">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbxcArEJQsHF8f0ShD5Zko9bK1zpHhPC6BMYToXI1YDfkwzm1GdkwTY9pYk8JoIHxtKj80Euiu_NCEk3eqvlyJtnmvw7hHagbcO-EbHl8cimIeZQnzHgZBNImGOC9gHYKL6sEsgpsVvuUrc8nFWuEcm_W_L2RpAZjNaVtnCCrxM96Imty9m-JAO3jnn4u_TtbP7UPu_eaAR3cxnK515NelAebMVBaDVKE_hD2tAMoo28NE2EVSdbTIAQ" alt="Highlight Piece" />
            </div>
            <div className="md:w-1/2 p-8 lg:p-10 flex flex-col justify-between h-full">
              <div>
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">Highlight Piece</span>
                <h3 className="font-headline-md text-headline-md text-primary mt-2">The Zoya Pavé Arch Collar</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 leading-relaxed">
                  Sculpted from 28.4 grams of solid 18K gold and set with 1.8 carats of micro-pavé natural diamonds. Conceived to sit seamlessly along the collarbone.
                </p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold">₹1,94,000</span>
                  <span className="font-label-sm text-label-sm text-outline line-through">₹2,10,000</span>
                </div>
              </div>
              <div className="pt-6">
                <button className="w-full py-3 bg-primary-container hover:bg-tertiary-container text-surface rounded-full font-label-md text-label-md transition-all">
                  Add to Salon Bag
                </button>
              </div>
            </div>
          </div>
          
          {/* Tandem Mini-Grid (Right) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mini Card 1 */}
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-between">
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden mb-3">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCYBJ6505QwZN-Ll40SHqdn9tJuNF8xSHd-BnhKsAypoGl9C3WTAn6SpiGz_mwe8X-uSNH9t3Lx0I8SzYFfgLyXAw2M5m4M7G3B4svGD2kRMlH3pnq-_WLqy3ko_1th2snGOxRwsObuaAfxHULfIf6KvKA-T_AFxHOqkfwyCUHq_7FYbjfZDBQK_y2BzwZoeQeElH_fqKadf9p7DSFHTaXhLb3uFHircVSd_D3A69-Kg3UD4dvG2fspw" alt="Mira Huggie Hoops" />
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-secondary">Everyday Spark</span>
                <h4 className="font-headline-sm text-[16px] text-primary mt-0.5">Mira Huggie Hoops</h4>
                <p className="font-body-sm text-body-sm font-semibold text-primary mt-1">₹18,200</p>
              </div>
            </div>
            
            {/* Mini Card 2 */}
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-4 flex flex-col justify-between">
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden mb-3">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjnFFqSZWyVyDoWt9k30IhPZf7RCNe1iPko3icpdo3uVPnw7U_4WHFuYpN5zDRR822C9jIJAdSkhgw13nvt5thS6q5Tj9SFxLynt8YBePEzDSMDzaHBozZhOeuWfVPkYavc7e__l1U-2gNltI3fO1tp9qtDJxWJWCh1wKpps2goeg-7wr-6Uyt1RiPvvVW5PnN0RNEvXKj-wBP5-z1LFD_fsuFewuXIwhc8ztrTB5z8q9gBC8qempKkA" alt="Duo Bezel Gold Ring" />
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-secondary">Bespoke Band</span>
                <h4 className="font-headline-sm text-[16px] text-primary mt-0.5">Duo Bezel Gold Ring</h4>
                <p className="font-body-sm text-body-sm font-semibold text-primary mt-1">₹24,800</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
