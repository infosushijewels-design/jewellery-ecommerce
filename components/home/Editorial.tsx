export default function Editorial() {
  return (
    <section className="border-y border-outline-variant/40 bg-surface-container-low">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12">
        {/* Left: High Fashion Model */}
        <div className="lg:col-span-6 relative min-h-[240px] sm:min-h-[380px] lg:min-h-[620px]">
          <img className="w-full h-full object-cover absolute inset-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOz-P_QEyALRQOzazI3u8leIDYBTzfuhKbtqWA297SOi6y9VSdeUCp8FWZqhNrSfM9BOuOhr66eRBgotf-Wyt-Y6l5tCxURf1Ma_XTS6o652hdeUZ2QRKVd1LAca3L6Jl27SFPltgKNvxOnf7gDXNsE0akFurR4r1Owbsz0KHpyV6zO96pDcLBk_RXFfIBZvdtntEs4lT05acgnaZ7pL0IOfvNmq_domEN21H-IK96H-ElXfxpDFRb-w" alt="High Fashion Model" />
        </div>
        {/* Right: Ivory Panel with Quote */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-20 flex flex-col justify-center bg-surface">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase mb-4">The Philosophy</span>
          <blockquote className="font-headline-lg text-[20px] sm:text-headline-lg lg:text-[36px] text-primary leading-snug font-headline-md italic">
            &ldquo;Jewellery That Feels Like You — Crafted with BIS 916 hallmarked gold and certified diamonds to accompany every milestone.&rdquo;
          </blockquote>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 sm:mt-6 leading-relaxed">
            At Sushi Jewels, we believe precious metals are living archives. Each curve is carved by master karigars with generational precision, honouring India&apos;s artisanal lineage while speaking fluent contemporary grace.
          </p>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-headline-sm text-headline-sm text-primary">Vipul &amp; Meera Singhania</p>
              <p className="font-label-sm text-label-sm text-outline tracking-wider">FOUNDING ATELIER ARTISANS</p>
            </div>
            <a
              className="px-5 sm:px-6 py-2.5 sm:py-3 border border-primary text-primary hover:bg-primary hover:text-surface font-label-md text-label-md rounded-full transition-all duration-200 flex-shrink-0 text-center"
              href="#heritage"
            >
              Discover Our Heritage
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
