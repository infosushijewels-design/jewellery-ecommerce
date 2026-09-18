'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Accordion, { AccordionData } from '@/components/ui/Accordion';

interface FaqCategory {
  id: string;
  label: string;
  icon: string;
  questions: AccordionData[];
}

const faqCategories: FaqCategory[] = [
  {
    id: 'purity',
    label: 'Diamond & Gold Purity',
    icon: 'diamond',
    questions: [
      {
        question: 'What hallmarking standard does your gold jewellery carry?',
        answer: 'Every gold piece is BIS 916 hallmarked, certifying 22K (91.6%) purity as assayed by a Bureau of Indian Standards recognised centre. The hallmark number is printed on your invoice for verification.',
      },
      {
        question: 'Are your diamonds certified?',
        answer: 'Yes. Natural diamonds above 30 cents ship with an independent IGI or GIA grading report verifying carat weight, cut, clarity, and colour. Certificate numbers are listed on your invoice.',
      },
      {
        question: 'Do you use lab-grown or synthetic diamonds?',
        answer: 'No. Sushi Jewels works exclusively with natural, conflict-free diamonds sourced under the Kimberley Process Certification Scheme unless a piece is explicitly listed otherwise.',
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders & Shipping',
    icon: 'local_shipping',
    questions: [
      {
        question: 'Is my order insured during transit?',
        answer: 'Yes, every shipment is 100% insured against loss or damage from the moment it leaves our atelier until it is signed for at your doorstep.',
      },
      {
        question: 'How can I track my order?',
        answer: 'Once your order ships, you can track live status from the "My Orders" section of your account, including courier handover and delivery OTP confirmation.',
      },
      {
        question: 'What are your delivery timelines?',
        answer: 'Metro cities typically receive orders within 2-3 business days, while Pan-India delivery takes 4-6 business days. Custom and bespoke pieces may take longer — timelines are confirmed at checkout.',
      },
    ],
  },
  {
    id: 'sizing',
    label: 'Ring Sizing & Customization',
    icon: 'straighten',
    questions: [
      {
        question: 'How do I find my correct ring size?',
        answer: 'You can request a complimentary ring sizer from our concierge team, or visit any Sushi Jewels boutique for an in-person fitting before your order ships.',
      },
      {
        question: 'Can I customize a design from your catalogue?',
        answer: 'Absolutely. Most designs can be customized in metal, carat weight, or stone choice. Reach out via our Contact page to begin a bespoke consultation with our design team.',
      },
      {
        question: 'Can I resize my ring after purchase?',
        answer: 'Yes, we offer one complimentary resizing within 60 days of delivery for standard designs. Bespoke and heavily embellished pieces are assessed on a case-by-case basis.',
      },
    ],
  },
  {
    id: 'returns',
    label: 'Returns, Lifetime Buyback & Exchanges',
    icon: 'autorenew',
    questions: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day hassle-free return and exchange window from the date of delivery, provided the piece is unworn and in its original packaging with all certificates.',
      },
      {
        question: 'Do you offer a lifetime buyback guarantee?',
        answer: 'Yes. We buy back gold at 100% of its prevailing market value and diamonds at 90% of the original certified benchmark value, for exchange or refund, for the lifetime of the piece.',
      },
      {
        question: 'Are custom or engraved pieces returnable?',
        answer: 'Custom-designed, resized, or engraved items are non-returnable, as they are made specifically to your specifications and cannot be resold.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Taxes',
    icon: 'receipt_long',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI, net banking, and Cash on Delivery for eligible orders, all processed through secure, tokenized payment gateways.',
      },
      {
        question: 'Is GST included in the listed price?',
        answer: 'Yes, all displayed prices are inclusive of applicable GST. A detailed tax breakup is provided on your invoice for every order.',
      },
      {
        question: 'Will I receive a formal invoice?',
        answer: 'Every order is accompanied by a GST-compliant invoice detailing metal weight, purity, diamond certification, making charges, and applicable taxes.',
      },
    ],
  },
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id);
  const current = faqCategories.find((cat) => cat.id === activeCategory) ?? faqCategories[0];

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'FAQ' },
          ]}
        />

        <div className="text-center max-w-2xl mx-auto mt-8 sm:mt-12 mb-10 sm:mb-14">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Support</span>
          <h1 className="font-headline-lg text-[28px] sm:text-display-md text-primary mt-2">Frequently Asked Questions</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">
            Everything you need to know about purity, shipping, sizing, returns, and payments.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
          {faqCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full border font-label-sm text-label-sm uppercase tracking-wide transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-surface border-primary'
                  : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:border-secondary hover:text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion key={current.id} items={current.questions} />
        </div>

        {/* Still have questions CTA */}
        <div className="max-w-3xl mx-auto mt-12 sm:mt-16">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-8 sm:p-10 text-center">
            <span className="material-symbols-outlined text-secondary text-[32px] mb-3 block">support_agent</span>
            <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Still have questions?</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 max-w-md mx-auto">
              Our concierge team is available to help with anything from sizing to bespoke commissions.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-primary text-surface px-8 py-3 rounded-full font-label-md uppercase tracking-wide hover:bg-tertiary transition-colors"
            >
              Contact Concierge
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
