"use client";

import { useCart } from '@/lib/context/CartContext';
import { useToast } from '@/lib/context/ToastContext';

const highlightPiece = {
  productId: 'zoya-pave-arch-collar',
  title: 'The Zoya Pavé Arch Collar',
  price: 194000,
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbxcArEJQsHF8f0ShD5Zko9bK1zpHhPC6BMYToXI1YDfkwzm1GdkwTY9pYk8JoIHxtKj80Euiu_NCEk3eqvlyJtnmvw7hHagbcO-EbHl8cimIeZQnzHgZBNImGOC9gHYKL6sEsgpsVvuUrc8nFWuEcm_W_L2RpAZjNaVtnCCrxM96Imty9m-JAO3jnn4u_TtbP7UPu_eaAR3cxnK515NelAebMVBaDVKE_hD2tAMoo28NE2EVSdbTIAQ',
  metal: '18K Gold',
  size: 'Standard',
};

export default function SignatureEdit() {
  const { addToCart, openCart } = useCart();
  const { showToast } = useToast();

  const handleAddToSalonBag = () => {
    addToCart(highlightPiece);
    openCart();
    showToast(`Added ${highlightPiece.title} to your jewellery bag`, 'success');
  };
  return (
    <section className="py-12 sm:py-20 bg-surface-container-low border-y border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="mb-8 sm:mb-12">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Editorial Selection</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">The Signature Edit — Quiet Luxury</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Large Hero Feature (Left) */}
          <div className="lg:col-span-7 bg-surface rounded-2xl border border-outline-variant/50 overflow-hidden flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2 min-h-[220px] sm:min-h-[380px]">
              <img className="w-full h-full object-cover" style={{ minHeight: 'inherit' }} src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbxcArEJQsHF8f0ShD5Zko9bK1zpHhPC6BMYToXI1YDfkwzm1GdkwTY9pYk8JoIHxtKj80Euiu_NCEk3eqvlyJtnmvw7hHagbcO-EbHl8cimIeZQnzHgZBNImGOC9gHYKL6sEsgpsVvuUrc8nFWuEcm_W_L2RpAZjNaVtnCCrxM96Imty9m-JAO3jnn4u_TtbP7UPu_eaAR3cxnK515NelAebMVBaDVKE_hD2tAMoo28NE2EVSdbTIAQ" alt="Highlight Piece" />
            </div>
            <div className="w-full sm:w-1/2 p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
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
              <div className="pt-5 sm:pt-6">
                <button
                  onClick={handleAddToSalonBag}
                  className="w-full py-3 bg-primary-container hover:bg-tertiary-container text-surface rounded-full font-label-md text-label-md transition-all active:scale-95"
                >
                  Add to Salon Bag
                </button>
              </div>
            </div>
          </div>

          {/* Tandem Mini-Grid (Right) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
            {/* Mini Card 1 */}
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-3 sm:p-4 flex flex-col justify-between">
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden mb-2 sm:mb-3">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCYBJ6505QwZN-Ll40SHqdn9tJuNF8xSHd-BnhKsAypoGl9C3WTAn6SpiGz_mwe8X-uSNH9t3Lx0I8SzYFfgLyXAw2M5m4M7G3B4svGD2kRMlH3pnq-_WLqy3ko_1th2snGOxRwsObuaAfxHULfIf6KvKA-T_AFxHOqkfwyCUHq_7FYbjfZDBQK_y2BzwZoeQeElH_fqKadf9p7DSFHTaXhLb3uFHircVSd_D3A69-Kg3UD4dvG2fspw" alt="Mira Huggie Hoops" />
              </div>
              <div>
                <span className="font-label-sm text-[9px] sm:text-[10px] text-secondary">Everyday Spark</span>
                <h4 className="font-headline-sm text-[13px] sm:text-[16px] text-primary mt-0.5 leading-snug">Mira Huggie Hoops</h4>
                <p className="font-body-sm text-[12px] sm:text-body-sm font-semibold text-primary mt-1">₹18,200</p>
              </div>
            </div>

            {/* Mini Card 2 */}
            <div className="bg-surface rounded-xl border border-outline-variant/50 p-3 sm:p-4 flex flex-col justify-between">
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden mb-2 sm:mb-3">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjnFFqSZWyVyDoWt9k30IhPZf7RCNe1iPko3icpdo3uVPnw7U_4WHFuYpN5zDRR822C9jIJAdSkhgw13nvt5thS6q5Tj9SFxLynt8YBePEzDSMDzaHBozZhOeuWfVPkYavc7e__l1U-2gNltI3fO1tp9qtDJxWJWCh1wKpps2goeg-7wr-6Uyt1RiPvvVW5PnN0RNEvXKj-wBP5-z1LFD_fsuFewuXIwhc8ztrTB5z8q9gBC8qempKkA" alt="Duo Bezel Gold Ring" />
              </div>
              <div>
                <span className="font-label-sm text-[9px] sm:text-[10px] text-secondary">Bespoke Band</span>
                <h4 className="font-headline-sm text-[13px] sm:text-[16px] text-primary mt-0.5 leading-snug">Duo Bezel Gold Ring</h4>
                <p className="font-body-sm text-[12px] sm:text-body-sm font-semibold text-primary mt-1">₹24,800</p>
              </div>
            </div>

            {/* Mini Card 3 - extra to fill space on larger screens */}
            <div className="hidden sm:flex bg-surface rounded-xl border border-outline-variant/50 p-3 sm:p-4 flex-col justify-between col-span-2 sm:col-span-1">
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden mb-2 sm:mb-3">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1UpLJPjsbS5j_VLbJOEwZb4HcAjreKA7ef4OScdYEFykRZUCChZgg9bK7JJL_ePLM25RpVzcpAzsCmAjrgSICl-XZIOKWQ4XxDeCUE_XyvdAu8e9zFW8UUHLItN_etMS4QpI7jasfhuSMsRinBhdM6goBlz5TJ7ljCSbRZKnyIDs9DeAU6QJmRpE36n3xg-7r2zGf2iJz8mzw3U_bhpXSu65yLAPfreUmwsDocmkzrxg1Bif8qUE7Q" alt="Noor Tennis Bracelet" />
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-secondary">Statement Piece</span>
                <h4 className="font-headline-sm text-[16px] text-primary mt-0.5 leading-snug">Noor Tennis Bracelet</h4>
                <p className="font-body-sm text-body-sm font-semibold text-primary mt-1">₹1,15,000</p>
              </div>
            </div>

            <div className="hidden sm:flex bg-surface rounded-xl border border-outline-variant/50 p-3 sm:p-4 flex-col justify-between col-span-2 sm:col-span-1">
              <div className="aspect-square bg-surface-container rounded-lg overflow-hidden mb-2 sm:mb-3">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRFlZwe7uKTdY7eu4pS2NTBd6Gzj1rn_mpCts6L9u6eogyFGG_WAy2UtnGdF24mM6VN8jfYMPaOgb8M3Mbn4Sd-fz7v2qtlANJ1ISEf5TQWAH3QJE8kL8SWQsMr4vazrpxVZF3azvzkeBn8IY7iBPS6N4Bz3oTynNrtIyvlv-QIVu3JoEzevcmeg4Je4iqWCOJYIBxAIFLktJBpkGiJbXERlz75fIdxbi6CuTA3GbdIHBSlMcBjUneTg" alt="Aurelia Cascade Necklace" />
              </div>
              <div>
                <span className="font-label-sm text-[10px] text-secondary">Signature Piece</span>
                <h4 className="font-headline-sm text-[16px] text-primary mt-0.5 leading-snug">Aurelia Cascade Necklace</h4>
                <p className="font-body-sm text-body-sm font-semibold text-primary mt-1">₹48,500</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
