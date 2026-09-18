export default function AnnouncementBar() {
  return (
    <aside className="bg-primary-container text-surface border-b border-outline-variant/20 tracking-wider">
      {/* Mobile: single centered message */}
      <p className="sm:hidden font-label-sm text-[10px] text-center py-2 px-3 opacity-90">
        100% Certified Gold & Natural Diamonds · Free Shipping ₹2,000+
      </p>
      {/* sm and above: full 3-item bar */}
      <p className="hidden sm:flex items-center justify-center gap-2 md:gap-3 py-2.5 px-4 font-label-sm text-label-sm flex-wrap">
        <span className="opacity-80">Complimentary Insured Shipping on Orders Above ₹2,000</span>
        <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed flex-shrink-0" />
        <span className="opacity-95 font-semibold text-secondary-fixed">100% Certified 18K/22K Gold &amp; Natural Diamonds</span>
        <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed flex-shrink-0" />
        <span className="opacity-80">15-Day Easy Returns</span>
      </p>
    </aside>
  );
}
