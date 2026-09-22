"use client";

import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

/** "Sushi Jewels Promises" — trust badges, each linking to the policy that backs it. */
export default function TrustMatrix() {
  const { store, commerce } = useStoreSettings();
  const freeShippingLabel =
    commerce.freeShippingThreshold > 0
      ? `Free Shipping above ₹${commerce.freeShippingThreshold.toLocaleString('en-IN')}`
      : 'Free Insured Shipping';

  const promises = [
    { icon: 'assignment_return', title: 'Easy Returns & Exchange', href: '/return-policy' },
    { icon: 'verified', title: 'Certified Jewellery', href: '/terms' },
    { icon: 'diamond', title: '100% Natural Diamonds', href: '/search?q=diamond' },
    { icon: 'workspace_premium', title: 'BIS Hallmarked Gold', href: '/terms' },
    { icon: 'currency_exchange', title: 'Lifetime Exchange & Buyback*', href: '/return-policy' },
    { icon: 'local_shipping', title: freeShippingLabel, href: '/shipping-policy' },
  ];

  return (
    <section className="py-10 sm:py-16 bg-surface border-b border-outline-variant/30" aria-labelledby="promises-heading">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <h2 id="promises-heading" className="font-headline-md text-[22px] sm:text-headline-md text-primary text-center mb-8 sm:mb-12">
          {store.name} Promises <span className="text-on-surface-variant/70">—</span> Excellence You Can Trust
        </h2>
        <ul className="grid grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-8 sm:gap-6">
          {promises.map((p) => (
            <li key={p.title}>
              <Link href={p.href} className="group flex flex-col items-center text-center">
                <span className="w-[72px] h-[72px] sm:w-[104px] sm:h-[104px] rounded-full border border-secondary/60 bg-surface flex items-center justify-center transition-all duration-300 group-hover:border-secondary group-hover:bg-secondary/5 group-hover:-translate-y-0.5">
                  <span className="material-symbols-outlined text-secondary text-[32px] sm:text-[44px]" style={{ fontVariationSettings: "'wght' 200" }}>
                    {p.icon}
                  </span>
                </span>
                <span className="mt-3 sm:mt-4 font-body-sm text-[12px] sm:text-body-md text-on-surface leading-snug max-w-[150px] group-hover:text-primary">
                  {p.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-center text-label-sm text-on-surface-variant/70 mt-8">*As per our return &amp; buyback policy.</p>
      </div>
    </section>
  );
}
