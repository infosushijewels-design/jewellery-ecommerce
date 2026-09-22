import type { Metadata } from 'next';
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout';
import LegalContent from '@/components/legal/LegalContent';
import { getLegalPage } from '@/lib/supabase/queries';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Sushi Jewels',
  description: 'Authenticity guarantees, pricing policy, intellectual property, and jurisdiction terms governing your use of Sushi Jewels.',
};

export default async function TermsPage() {
  // Content edited in Admin → Legal Pages overrides the default copy below
  const custom = await getLegalPage('terms');
  if (custom) return <LegalContent page={custom} />;

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms & Conditions"
      description="Please read these terms carefully before using our website or purchasing from Sushi Jewels."
      pageName="Terms & Conditions"
    >
      <LegalSection title="Authenticity Guarantee & Hallmarking Disclosure" icon="verified">
        <p>
          Sushi Jewels guarantees that all gold jewellery sold is BIS 916 hallmarked and all applicable natural diamonds are accompanied by IGI or GIA certification. Purity, weight, and certification details are disclosed on the product page and final invoice for every order.
        </p>
      </LegalSection>

      <LegalSection title="Pricing Policy" icon="currency_rupee">
        <p>
          Jewellery prices are calculated based on the prevailing daily market rate of gold and diamonds at the time of order confirmation, combined with making charges and applicable taxes. Prices displayed on the website are subject to change without prior notice due to gold rate fluctuations and do not apply retroactively to already-confirmed orders.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property & Copyright" icon="copyright">
        <p>
          All designs, images, logos, and content on sushijewels.com are the exclusive property of Sushi Jewels Private Limited and are protected under applicable copyright and trademark laws. Reproduction, distribution, or commercial use of any content without prior written consent is strictly prohibited.
        </p>
      </LegalSection>

      <LegalSection title="Jurisdiction & Dispute Resolution" icon="balance">
        <p>
          These terms are governed by the laws of India. Any disputes arising from the use of this website or a purchase made through it shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra. We encourage customers to first reach out to our concierge team to resolve any concerns amicably before pursuing formal proceedings.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
