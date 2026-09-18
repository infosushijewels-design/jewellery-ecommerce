export default function Bestsellers() {
  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Iconic Signatures</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Most Loved Creations</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Icons embraced by thousands of discerning patrons across India and beyond.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Item 1 */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-3 sm:p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all">
          <div className="aspect-[3/4] bg-surface rounded-lg overflow-hidden relative mb-3 sm:mb-4">
            <span className="absolute top-2 left-2 z-10 font-label-sm text-[9px] sm:text-label-sm bg-surface-container text-primary px-2 py-0.5 rounded-full border border-secondary/40 font-medium">Bestseller</span>
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHKRah6VbNVk2yGUR8NfOmmOQq8u_Z3l-dujHCpR2pS20F4rWe5P_q5fSH2dmuuO7dENhyAXWTjvZmMhbKQw-5wQ8JVndRnKYChRNb2VVRVLWACaMV1yw8pJG-E9mWYg1i44x1Smcd5yf8NIjVFuQ9Z_woi8kUMlwUkt5QtdkLqPtWdFK5ZSk5l6CjjWM24LlzmeMXX3z-GwUGvXSHDiPz3TNQMok8V2eOci3xgf1Od5_Y2L7TP-z4rA" alt="Anya Pear Solitaire Pendant" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-secondary mb-1">
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-sm text-[10px] sm:text-label-sm text-on-surface font-semibold">4.9</span>
              <span className="font-label-sm text-[9px] sm:text-[11px] text-outline hidden sm:inline">(128 reviews)</span>
            </div>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm text-primary leading-snug">Anya Pear Solitaire Pendant</h3>
            <p className="font-body-md text-[13px] sm:text-body-md text-primary font-semibold mt-1">₹39,800</p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-3 sm:p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all">
          <div className="aspect-[3/4] bg-surface rounded-lg overflow-hidden relative mb-3 sm:mb-4">
            <span className="absolute top-2 left-2 z-10 font-label-sm text-[9px] sm:text-label-sm bg-surface-container text-primary px-2 py-0.5 rounded-full border border-secondary/40 font-medium">Bestseller</span>
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEvqLkgOzyA4ZFqRSztEOGzBsKMUm5tX7qQ_gFH9W5icKQKYNdzNXXxfwblrFvhNXzb1kA_fW3v21xCMNN1CnsHJ60pZhsGXgUEdKKDsHMBu4MwOec6nXunkVrCk0qREibfvylfuYKFq_CUNAuzs7hGCipBUJBLn0w4q08Ff-ufmTY9H4pTwADiC1-qUWcxJmCB_8Bf7TlE4t19jwHk0VhsD4vdqz1UMVLueu3UMheQRJiAFNV7oVEvw" alt="Lumina Classic Diamond Studs" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-secondary mb-1">
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-sm text-[10px] sm:text-label-sm text-on-surface font-semibold">5.0</span>
              <span className="font-label-sm text-[9px] sm:text-[11px] text-outline hidden sm:inline">(342 reviews)</span>
            </div>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm text-primary leading-snug">Lumina Classic Diamond Studs</h3>
            <p className="font-body-md text-[13px] sm:text-body-md text-primary font-semibold mt-1">₹29,500</p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-3 sm:p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all">
          <div className="aspect-[3/4] bg-surface rounded-lg overflow-hidden relative mb-3 sm:mb-4">
            <span className="absolute top-2 left-2 z-10 font-label-sm text-[9px] sm:text-label-sm bg-surface-container text-primary px-2 py-0.5 rounded-full border border-secondary/40 font-medium">Bestseller</span>
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC74A8Fj24b72eTNKX0juw3tNXVixP4hnL3jNhdKtcBzUqH3pzHXErRrTfxb5CBaEBukNt9zwL6s77chvgSBaxQCRfWYNMTJl-fbXsXnn6s_-M78YItIJGQoxcrXKIBUEMm38EwH8JLV3hn3QrzjJ4ys4gatQQcukrPQqTF9nGHrfEwKmXffciZ_z-HQiVsHVK9rn0bNL_L0szyCudjlGDuflsEOsNjZZHPubf5kwnNC0z4opWdcJ14mA" alt="Seraphina Chevron Gold Band" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-secondary mb-1">
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-sm text-[10px] sm:text-label-sm text-on-surface font-semibold">4.8</span>
              <span className="font-label-sm text-[9px] sm:text-[11px] text-outline hidden sm:inline">(96 reviews)</span>
            </div>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm text-primary leading-snug">Seraphina Chevron Gold Band</h3>
            <p className="font-body-md text-[13px] sm:text-body-md text-primary font-semibold mt-1">₹22,400</p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-3 sm:p-4 flex flex-col justify-between hover:shadow-[0_8px_24px_-4px_rgba(45,32,36,0.06)] transition-all">
          <div className="aspect-[3/4] bg-surface rounded-lg overflow-hidden relative mb-3 sm:mb-4">
            <span className="absolute top-2 left-2 z-10 font-label-sm text-[9px] sm:text-label-sm bg-surface-container text-primary px-2 py-0.5 rounded-full border border-secondary/40 font-medium">Bestseller</span>
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQk94Vrv8hyrndTPtEmeNYR9BVP2uHjZ4IXNV_W3sruyiyIU5TQ9ljCTLSEkJWgQOrKkElFfYIZOFHrYI8Ad34aq3-lujQx5_p8f4CJMmSPnJjgJhjXPBEM5VyOWsNULRahjNz2bLF-JJanxMcMrWXS9XmJqV_u0apisX8J41fsQpwA_8XioUtRBnsmnENWuzvU0KQAM4wyn32VPmZQaOfjX1Zgaj7k5NT-drZBFstMiTO9eiQhXDgTA" alt="Kashmiri Floral Gold Kada" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-secondary mb-1">
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-sm text-[10px] sm:text-label-sm text-on-surface font-semibold">4.9</span>
              <span className="font-label-sm text-[9px] sm:text-[11px] text-outline hidden sm:inline">(210 reviews)</span>
            </div>
            <h3 className="font-headline-sm text-[13px] sm:text-headline-sm text-primary leading-snug">Kashmiri Floral Gold Kada</h3>
            <p className="font-body-md text-[13px] sm:text-body-md text-primary font-semibold mt-1">₹68,900</p>
          </div>
        </div>
      </div>
    </section>
  );
}
