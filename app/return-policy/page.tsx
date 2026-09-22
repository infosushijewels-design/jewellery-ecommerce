import type { Metadata } from 'next';
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout';
import LegalContent from '@/components/legal/LegalContent';
import { getLegalPage } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Returns & Lifetime Buyback | Sushi Jewels',
  description: '30-day hassle-free returns and a lifetime buyback & upgrade guarantee on every Sushi Jewels piece.',
};

export default async function ReturnPolicyPage() {
  // Content edited in Admin → Legal Pages overrides the default copy below
  const custom = await getLegalPage('return-policy');
  if (custom) return <LegalContent page={custom} />;

  return (
    <LegalLayout
      eyebrow="Client Services"
      title="Returns & Lifetime Buyback Guarantee"
      description="We stand behind every piece we craft with a generous return window and a lifetime promise on gold and diamond value."
      pageName="Returns & Exchanges"
    >
      <LegalSection title="30-Day Hassle-Free Return & Exchange" icon="assignment_return">
        <p>
          If you&apos;re not completely satisfied, return or exchange your piece within <strong>30 days</strong> of delivery. Items must be unworn, undamaged, and returned in their original packaging with all accompanying certificates and invoices.
        </p>
      </LegalSection>

      <LegalSection title="Lifetime Buyback & Upgrade Guarantee" icon="autorenew">
        <ul>
          <li><strong>100% of Metal Value:</strong> We buy back gold at its full prevailing market rate, for the lifetime of the piece.</li>
          <li><strong>90% of Diamond Benchmark:</strong> Certified diamonds are bought back at 90% of the original certified benchmark value.</li>
          <li>Use the buyback value toward an upgrade to any piece in our current collection, or receive it as store credit.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Return Process, Step-by-Step" icon="checklist">
        <ul>
          <li><strong>1. Request:</strong> Initiate a return from your account&apos;s order history or contact our concierge team.</li>
          <li><strong>2. Insured Pickup:</strong> An insured courier partner collects the piece directly from your address at no cost.</li>
          <li><strong>3. Lab Inspection:</strong> Our in-house gemologists verify authenticity, purity, and condition against the original certification.</li>
          <li><strong>4. Instant Refund or Credit:</strong> Once verified, your refund or store credit is processed within 3–5 business days.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Non-Returnable Items" icon="block">
        <p>
          Custom-designed, engraved, resized, or otherwise bespoke customized orders are made to your exact specifications and are therefore <strong>non-returnable and non-exchangeable</strong>, except in cases of manufacturing defect.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
