export default function StoreExperience() {
  return (
    <section className="py-12 sm:py-20 border-y border-outline-variant/30" id="salon">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="relative aspect-[4/3] sm:aspect-square lg:aspect-auto lg:h-[600px] rounded-2xl overflow-hidden border border-outline-variant/50">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGBHMckxZb5c0fQWJYYTSyVRHsBc9fXIHCFnuING2mfSghzq6v1g7vKlhEyCx15n58bXutss2o6UA8x_69znxMJvPUQ70rxhrRkLw0WQlHJFDccdObrMwEFGSkennoUsWJaN_nm4S1Tu_lxGzpxbtKYr8Xjz3erODoJ4U9tkcpLT09pgFI4cj6LueTHxAiRdJRY-6CNp5ho3LDlBUectANLrTn3sWDqARr8NAOb7WEGjVsXW-bXKcS3Q" alt="Flagship Salon Interior" />
        </div>
        <div className="lg:pl-10">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Flagship Experience</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-2">Visit Our Heritage Salons</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-3 sm:mt-4 leading-relaxed max-w-lg">
            Immerse yourself in our private viewing rooms. Enjoy personalized consultations with our master stylists while sipping curated artisanal teas, surrounded by the physical manifestation of our craft.
          </p>
          <div className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4">
              <span className="material-symbols-outlined text-secondary mt-1 flex-shrink-0">location_on</span>
              <div>
                <h4 className="font-headline-sm text-[16px] text-primary">Jaipur Flagship</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">MI Road, Heritage District<br />Rajasthan 302001</p>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <span className="material-symbols-outlined text-secondary mt-1 flex-shrink-0">location_on</span>
              <div>
                <h4 className="font-headline-sm text-[16px] text-primary">Mumbai Atelier</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Turner Road, Bandra West<br />Maharashtra 400050</p>
              </div>
            </div>
          </div>
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-primary-container text-surface hover:bg-tertiary-container font-label-lg text-label-lg rounded-full shadow transition-all text-center"
              href="#"
            >
              Book a Private Appointment
            </a>
            <a
              className="px-6 sm:px-8 py-3 sm:py-3.5 border border-primary text-primary hover:bg-surface-container font-label-lg text-label-lg rounded-full transition-all text-center"
              href="#"
            >
              Virtual Try-On
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
