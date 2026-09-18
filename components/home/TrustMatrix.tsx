export default function TrustMatrix() {
  return (
    <section className="py-8 sm:py-12 bg-surface border-b border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[24px] sm:text-[28px] mb-1 sm:mb-2">workspace_premium</span>
            <h4 className="font-label-md text-[11px] sm:text-label-md text-primary font-semibold leading-tight">100% Certified Jewellery</h4>
            <p className="font-label-sm text-[9px] sm:text-[11px] text-outline mt-0.5">Government &amp; Lab Approved</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[24px] sm:text-[28px] mb-1 sm:mb-2">local_shipping</span>
            <h4 className="font-label-md text-[11px] sm:text-label-md text-primary font-semibold leading-tight">Insured Express Shipping</h4>
            <p className="font-label-sm text-[9px] sm:text-[11px] text-outline mt-0.5">Tamper-proof door delivery</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[24px] sm:text-[28px] mb-1 sm:mb-2">change_circle</span>
            <h4 className="font-label-md text-[11px] sm:text-label-md text-primary font-semibold leading-tight">15-Day Exchange Guarantee</h4>
            <p className="font-label-sm text-[9px] sm:text-[11px] text-outline mt-0.5">No questions asked policy</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[24px] sm:text-[28px] mb-1 sm:mb-2">autorenew</span>
            <h4 className="font-label-md text-[11px] sm:text-label-md text-primary font-semibold leading-tight">Lifetime Exchange &amp; Buyback</h4>
            <p className="font-label-sm text-[9px] sm:text-[11px] text-outline mt-0.5">At prevailing market rates</p>
          </div>
          <div className="flex flex-col items-center col-span-2 md:col-span-1">
            <span className="material-symbols-outlined text-secondary text-[24px] sm:text-[28px] mb-1 sm:mb-2">support_agent</span>
            <h4 className="font-label-md text-[11px] sm:text-label-md text-primary font-semibold leading-tight">Personal Stylist Concierge</h4>
            <p className="font-label-sm text-[9px] sm:text-[11px] text-outline mt-0.5">Dedicated salon experts</p>
          </div>
        </div>
      </div>
    </section>
  );
}
