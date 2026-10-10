import type { Metadata } from 'next';
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout';
import LegalContent from '@/components/legal/LegalContent';
import { getLegalPage } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Return Policy | Sushi Jewels',
  description: 'Sushi Jewels operates a strict No-Returns Policy on all certified gold and diamond fine jewellery.',
};

export default async function ReturnPolicyPage() {
  // Content edited in Admin → Legal Pages overrides the default copy below
  const custom = await getLegalPage('return-policy');
  if (custom) return <LegalContent page={custom} />;

  return (
    <LegalLayout
      eyebrow="Client Policies"
      title="No-Return Policy &amp; Final Sale"
      description="At Sushi Jewels, every jewel is an exclusive bespoke creation handcrafted upon order with certified gold and precious stones. All sales are final."
      pageName="Return Policy"
    >
      <LegalSection title="Strict No-Return Policy (All Sales Final)" icon="block">
        <p>
          Due to the personalized nature, high intrinsic value, individualized ring/bangle sizing, and strict hygiene standards associated with certified fine jewellery, <strong>Sushi Jewels does not accept returns or process monetary refunds</strong>.
        </p>
        <p className="mt-3">
          Once an order is confirmed, metal allocation and master atelier crafting begin specifically for your piece. Please review all design specifications, metal colours, diamond carats, and measurements carefully before placing your order.
        </p>
      </LegalSection>

      <LegalSection title="Transit Damage &amp; Defect Protection" icon="verified">
        <p>
          Every shipment dispatched from our atelier is 100% insured until it reaches your hands. In the highly unlikely event that your parcel arrives visibly damaged or with a verified manufacturing flaw:
        </p>
        <ul className="mt-3 space-y-2">
          <li><strong>Report Within 24 Hours:</strong> Contact our atelier concierge immediately at <strong>+91 91191 87655</strong> or <strong>concierge@sushijewels.com</strong> within 24 hours of delivery.</li>
          <li><strong>Mandatory Unboxing Video:</strong> A continuous, unedited video of the parcel being opened for the first time is required to substantiate transit claims with our insured logistics partners.</li>
          <li><strong>Resolution:</strong> Upon verification by our master craftsmen, our atelier will repair or replace the piece at zero additional expense.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Pre-Production Cancellations" icon="cancel">
        <p>
          You may request an order cancellation within <strong>12 hours</strong> of placement. Once casting, stone-setting, or gold procurement has commenced in the atelier, cancellations can no longer be accepted.
        </p>
      </LegalSection>

      <LegalSection title="Personalized Concierge Assistance" icon="support_agent">
        <p>
          Need sizing help or wish to inspect high-resolution images or videos of a piece before purchasing? Our concierge is available via WhatsApp or phone call at <strong>+91 91669 67234</strong> to guide you every step of the way.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
