import React from 'react';
import Link from 'next/link';

export default function FlagshipAtelier() {
  const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=2Ch4+Dadabari+Main+Road+3rd+Floor+Pukhraj+Prime+Kota+Rajasthan';
  const waUrl = 'https://wa.me/919166967234?text=' + encodeURIComponent('Hi Sushi Jewels, I would like to schedule a private visit to your Kota atelier.');

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="atelier">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden shadow-[0_12px_40px_-16px_rgba(45,32,36,0.1)] grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Visual: Luxury Boutique Atmosphere */}
        <div className="lg:col-span-6 relative min-h-[360px] sm:min-h-[440px] lg:min-h-full bg-surface-container">
          <img
            src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80"
            alt="Sushi Jewels Flagship Atelier Kota"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-surface">
            <span className="font-label-sm text-[10px] sm:text-label-sm text-secondary-fixed uppercase tracking-widest font-semibold">
              The Private Studio
            </span>
            <h3 className="font-headline-md text-[22px] sm:text-headline-md font-serif mt-1 text-surface">
              An Intimate Jewellery Experience
            </h3>
            <p className="font-body-sm text-[12px] sm:text-body-sm text-surface/80 mt-1 max-w-md">
              Private bridal viewings, personal diamond consultations, and bespoke jewellery crafting in Kota, Rajasthan.
            </p>
          </div>
        </div>

        {/* Right Info: Boutique Location & Direct Access */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/15 text-secondary font-label-sm text-[11px] uppercase tracking-widest font-semibold mb-3">
              Exclusive Flagship Boutique
            </span>
            <h2 className="font-headline-lg text-[26px] sm:text-[34px] font-serif text-primary leading-tight">
              Visit Our Flagship Atelier
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              Step into our private studio to view hallmarked golds, certified solitaires, and discuss custom designs directly with our master craftsmen.
            </p>
          </div>

          {/* Details list */}
          <div className="space-y-4 py-4 border-y border-outline-variant/40 mb-6">
            
            {/* Address */}
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-full bg-surface-container-low text-secondary flex items-center justify-center shrink-0 border border-outline-variant/40">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
              </span>
              <div>
                <p className="text-[12px] font-label-md uppercase tracking-wider text-secondary font-semibold">Boutique Address</p>
                <p className="font-body-md text-body-md text-primary font-medium mt-0.5">
                  2Ch4 Dadabari Main Road, 3rd Floor, Pukhraj Prime
                </p>
                <p className="text-body-sm text-[13px] text-on-surface-variant">Kota, Rajasthan, India</p>
              </div>
            </div>

            {/* Timings */}
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-full bg-surface-container-low text-secondary flex items-center justify-center shrink-0 border border-outline-variant/40">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </span>
              <div>
                <p className="text-[12px] font-label-md uppercase tracking-wider text-secondary font-semibold">Atelier Hours</p>
                <p className="font-body-md text-body-md text-primary font-medium mt-0.5">
                  Monday – Saturday: 10:00 AM – 7:00 PM (IST)
                </p>
                <p className="text-body-sm text-[12px] text-on-surface-variant">Private viewings by prior appointment recommended</p>
              </div>
            </div>

            {/* Direct Phone */}
            <div className="flex items-start gap-3.5">
              <span className="w-10 h-10 rounded-full bg-surface-container-low text-secondary flex items-center justify-center shrink-0 border border-outline-variant/40">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </span>
              <div>
                <p className="text-[12px] font-label-md uppercase tracking-wider text-secondary font-semibold">Direct Concierge</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                  <a href="tel:+919119187655" className="font-body-md text-body-md text-primary hover:text-secondary font-medium transition-colors">
                    +91 91191 87655
                  </a>
                  <a href="tel:+919166967234" className="font-body-md text-body-md text-primary hover:text-secondary font-medium transition-colors">
                    +91 91669 67234
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-5 rounded-full bg-primary text-surface font-label-md uppercase tracking-wider text-center hover:bg-tertiary transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">directions</span>
              <span>Get Directions</span>
            </a>
            <Link
              href="/book-appointment"
              className="flex-1 py-3.5 px-5 rounded-full border border-secondary/60 text-primary font-label-md uppercase tracking-wider text-center hover:bg-surface-container hover:border-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">event</span>
              <span>Book Appointment</span>
            </Link>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-4 rounded-full bg-[#1A4D2E] text-white hover:bg-[#143B23] transition-colors flex items-center justify-center"
              title="Chat on WhatsApp"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
