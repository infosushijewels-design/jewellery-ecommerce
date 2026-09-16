export default function TrustMatrix() {
  return (
    <section className="py-12 bg-surface border-b border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-2">workspace_premium</span>
            <h4 className="font-label-md text-label-md text-primary font-semibold">100% Certified Jewellery</h4>
            <p className="font-label-sm text-[11px] text-outline mt-0.5">Government &amp; Lab Approved</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-2">local_shipping</span>
            <h4 className="font-label-md text-label-md text-primary font-semibold">Insured Express Shipping</h4>
            <p className="font-label-sm text-[11px] text-outline mt-0.5">Tamper-proof door delivery</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-2">change_circle</span>
            <h4 className="font-label-md text-label-md text-primary font-semibold">15-Day Exchange Guarantee</h4>
            <p className="font-label-sm text-[11px] text-outline mt-0.5">No questions asked policy</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-2">autorenew</span>
            <h4 className="font-label-md text-label-md text-primary font-semibold">Lifetime Exchange &amp; Buyback</h4>
            <p className="font-label-sm text-[11px] text-outline mt-0.5">At prevailing market rates</p>
          </div>
          <div className="flex flex-col items-center col-span-2 md:col-span-1">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-2">support_agent</span>
            <h4 className="font-label-md text-label-md text-primary font-semibold">Personal Stylist Concierge</h4>
            <p className="font-label-sm text-[11px] text-outline mt-0.5">Dedicated salon experts</p>
          </div>
        </div>
      </div>
    </section>
  );
}
