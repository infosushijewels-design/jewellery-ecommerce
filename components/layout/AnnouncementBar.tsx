export default function AnnouncementBar() {
  return (
    <aside className="bg-primary-container text-surface py-2.5 px-4 text-center border-b border-outline-variant/20 tracking-wider">
      <p className="font-label-sm text-label-sm flex items-center justify-center gap-3">
        <span className="opacity-80">Complimentary Insured Shipping on Orders Above ₹2,000</span>
        <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed"></span>
        <span className="opacity-95 font-semibold text-secondary-fixed">100% Certified 18K/22K Gold &amp; Natural Diamonds</span>
        <span className="inline-block w-1 h-1 rounded-full bg-secondary-fixed"></span>
        <span className="opacity-80">15-Day Easy Returns</span>
      </p>
    </aside>
  );
}
