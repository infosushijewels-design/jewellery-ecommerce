export default function StoreExperience() {
  return (
    <section className="py-20 border-y border-outline-variant/30" id="salon">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative aspect-square lg:aspect-auto lg:h-[600px] rounded-2xl overflow-hidden border border-outline-variant/50">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAz8x9B_j27bL6hM0X3k4O39P9Zq41U70fM8D9v1o0L_L9_z9-2_O_Z-l0x9_98n35V4_P_T10-X20H91tLh_jH3H0978Q8nZ61Q82n58X0Z3x379j84H81q6D5q4Y4jX0jQ6l6v3k5H5x9o1m_4K0o5_w6g6h2b5P7QZ09g3N4_X0Y0P4xZ9lX3D4h1K9w9P7M8" alt="Flagship Salon Interior" />
        </div>
        <div className="lg:pl-10">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Flagship Experience</span>
          <h2 className="font-headline-lg text-headline-lg text-primary mt-2">Visit Our Heritage Salons</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed max-w-lg">
            Immerse yourself in our private viewing rooms. Enjoy personalized consultations with our master stylists while sipping curated artisanal teas, surrounded by the physical manifestation of our craft.
          </p>
          <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-secondary mt-1">location_on</span>
              <div>
                <h4 className="font-headline-sm text-[16px] text-primary">Jaipur Flagship</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">MI Road, Heritage District<br/>Rajasthan 302001</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-secondary mt-1">location_on</span>
              <div>
                <h4 className="font-headline-sm text-[16px] text-primary">Mumbai Atelier</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Turner Road, Bandra West<br/>Maharashtra 400050</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-outline-variant/30 flex flex-wrap gap-4">
            <a className="px-8 py-3.5 bg-primary-container text-surface hover:bg-tertiary-container font-label-lg text-label-lg rounded-full shadow transition-all" href="#">
              Book a Private Appointment
            </a>
            <a className="px-8 py-3.5 border border-primary text-primary hover:bg-surface-container font-label-lg text-label-lg rounded-full transition-all" href="#">
              Virtual Try-On
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
