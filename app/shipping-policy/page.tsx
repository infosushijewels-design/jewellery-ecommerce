import type { Metadata } from 'next';
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout';
import LegalContent from '@/components/legal/LegalContent';
import { getLegalPage } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Shipping Policy | Sushi Jewels',
  description: 'Fully insured, tamper-proof shipping with armed courier delivery and OTP verification — learn our delivery timelines and packaging standards.',
};

export default async function ShippingPolicyPage() {
  // Content edited in Admin → Legal Pages overrides the default copy below
  const custom = await getLegalPage('shipping-policy');
  if (custom) return <LegalContent page={custom} />;

  return (
    <LegalLayout
      eyebrow="Client Services"
      title="Insured Shipping Policy"
      description="Every Sushi Jewels order travels under full insurance, tamper-proof packaging, and verified handover — from our atelier to your door."
      pageName="Shipping Policy"
    >
      <LegalSection title="100% Fully Insured Transit" icon="verified_user">
        <p>
          Every shipment — regardless of value — is fully insured against loss, theft, or damage from the moment it leaves our atelier until it is signed for at your delivery address. In the rare event of a transit issue, we replace or refund your order in full at no additional cost to you.
        </p>
      </LegalSection>

      <LegalSection title="Delivery Timelines" icon="schedule">
        <ul>
          <li><strong>Metro Cities</strong> (Mumbai, Delhi NCR, Bengaluru, Chennai, Hyderabad, Kolkata, Pune): 2–3 business days</li>
          <li><strong>Pan-India Delivery:</strong> 4–6 business days</li>
          <li><strong>Bespoke &amp; Custom Orders:</strong> Timelines are communicated separately based on design complexity, typically 2–6 weeks.</li>
        </ul>
        <p>Business days exclude Sundays and national holidays. Timelines may extend during peak festive seasons.</p>
      </LegalSection>

      <LegalSection title="Tamper-Proof Security Packaging" icon="inventory_2">
        <p>
          All jewellery ships in double-sealed, tamper-evident packaging with a unique security seal number. Any package showing signs of tampering should be refused at delivery and reported to our concierge team immediately.
        </p>
      </LegalSection>

      <LegalSection title="Armed Courier & OTP Verification" icon="local_police">
        <p>
          High-value shipments are delivered via armed courier partners as an added security measure. Every delivery requires an OTP sent to your registered mobile number, verified at handover to confirm the recipient&apos;s identity before the package is released.
        </p>
      </LegalSection>

      <LegalSection title="Free Insured Shipping" icon="local_shipping">
        <p>
          Insured shipping is offered <strong>free of charge on all orders above ₹2,000</strong>. Orders below this threshold incur a flat, fully insured shipping fee of ₹99, calculated at checkout.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
