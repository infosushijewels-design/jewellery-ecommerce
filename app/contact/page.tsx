'use client';

import { useState, FormEvent } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useToast } from '@/lib/context/ToastContext';

const categories = ['Engagement', 'High Jewellery', 'Bespoke'];

export default function ContactPage() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: categories[0],
    message: '',
  });

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulated submission — no backend endpoint for enquiries in this phase.
    await new Promise((resolve) => setTimeout(resolve, 900));

    showToast('Thank you. Our concierge team will reach out within 24 hours.', 'success');
    setForm({ name: '', email: '', phone: '', category: categories[0], message: '' });
    setIsSubmitting(false);
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Contact Us' },
          ]}
        />

        <div className="text-center max-w-2xl mx-auto mt-8 sm:mt-12 mb-10 sm:mb-16">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Concierge</span>
          <h1 className="font-headline-lg text-[28px] sm:text-display-md text-primary mt-2">Contact &amp; Private Appointments</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
            Whether you&apos;re commissioning a bespoke piece or have a question about an existing order, our concierge team is here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-10">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-6">Bespoke Enquiry &amp; Appointment Booking</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange('name')}
                      className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={handleChange('phone')}
                      className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange('email')}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                    Preferred Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={handleChange('category')}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange('message')}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-surface font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-secondary transition-colors resize-none"
                    placeholder="Tell us about the piece you have in mind..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-surface py-3.5 rounded-full font-label-md uppercase tracking-wide hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
                </button>
              </form>
            </div>
          </div>

          {/* Boutique Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-8">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-5">Flagship Boutique</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">location_on</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Sushi Jewels Atelier, 4th Floor, Zaveri Bazaar Heritage House, Mumbai, Maharashtra 400002, India
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">schedule</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Open Daily, 10:30 AM – 8:30 PM
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">directions_car</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Complimentary VIP valet parking available for all appointment bookings.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 sm:p-8">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-5">Direct Contact</h3>
              <div className="space-y-3">
                <a href="tel:+918001234567" className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[22px]">call</span>
                  +91 800 123 4567
                </a>
                <a href="mailto:concierge@sushijewels.com" className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface hover:text-secondary transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[22px]">mail</span>
                  concierge@sushijewels.com
                </a>
                <a
                  href="https://wa.me/918001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-4 w-full bg-[#25D366] text-white py-3 rounded-full font-label-md uppercase tracking-wide hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  WhatsApp Concierge
                </a>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-outline-variant/40 h-56 sm:h-64 bg-surface-container-low flex items-center justify-center">
              <div className="text-center px-6">
                <span className="material-symbols-outlined text-outline text-[32px] mb-2 block">map</span>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Interactive map available at the boutique location</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
