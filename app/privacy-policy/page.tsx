import type { Metadata } from 'next';
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sushi Jewels',
  description: 'How Sushi Jewels collects, uses, and protects your data, including our 256-bit SSL encryption and payment tokenization standards.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy & Data Security"
      description="Your trust matters as much as our craftsmanship. Here's how we collect, use, and protect your information."
      pageName="Privacy Policy"
    >
      <LegalSection title="256-Bit SSL Data Encryption" icon="lock">
        <p>
          Every page on sushijewels.com is served over HTTPS, secured with industry-standard 256-bit SSL encryption. This ensures that all data transmitted between your browser and our servers — including personal details and order information — remains private and tamper-proof.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect & How We Use It" icon="fact_check">
        <p>We collect information you provide directly, such as your name, email, phone number, and shipping address when you create an account, place an order, or submit an enquiry. This information is used solely to:</p>
        <ul>
          <li>Process and deliver your orders</li>
          <li>Communicate order updates, appointment confirmations, and concierge responses</li>
          <li>Improve our products, services, and website experience</li>
        </ul>
        <p>We never sell or rent your personal information to third parties for marketing purposes.</p>
      </LegalSection>

      <LegalSection title="Secure Payment Gateway Tokenization" icon="credit_card">
        <p>
          All payments are processed through PCI-DSS compliant payment gateways. Card details are tokenized at the point of entry — <strong>we never store your card number, CVV, or expiry date on our servers</strong> at any point in the transaction lifecycle.
        </p>
      </LegalSection>

      <LegalSection title="Cookie Policy" icon="cookie">
        <p>
          We use essential cookies to keep you signed in and remember your cart, along with analytics cookies to understand site usage and improve your experience. You can manage or disable cookies through your browser settings at any time.
        </p>
      </LegalSection>

      <LegalSection title="Your Rights" icon="gavel">
        <p>
          Under applicable data protection laws, you have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact our concierge team at{' '}
          <a href="mailto:concierge@sushijewels.com" className="text-secondary underline underline-offset-2">concierge@sushijewels.com</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
