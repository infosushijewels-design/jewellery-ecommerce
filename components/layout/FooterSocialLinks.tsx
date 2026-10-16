"use client";

import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { ICONS } from './FooterContact';

/** Brand-column social icons — WhatsApp, Facebook, Instagram, YouTube — using the
 *  same configured URLs (Admin → Settings) as before. */
export default function FooterSocialLinks() {
  const { contact, social } = useStoreSettings();

  const links = [
    {
      key: 'whatsapp',
      title: 'Chat on WhatsApp',
      href: buildWhatsAppLink(contact.whatsapp || '919166967234', 'Hi, I would like to inquire about your jewellery.') || '',
    },
    { key: 'facebook', title: 'Facebook', href: social.facebook },
    { key: 'instagram', title: 'Instagram', href: social.instagram },
    { key: 'youtube', title: 'YouTube', href: social.youtube },
  ].filter((l) => l.href.trim());

  if (links.length === 0) return null;

  return (
    <div className="flex gap-3 mt-5 sm:mt-6">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={link.title}
          aria-label={link.title}
          className="w-10 h-10 rounded-full border border-outline-variant/50 flex items-center justify-center hover:border-secondary-fixed hover:bg-secondary-fixed/10 transition-all group"
        >
          <svg className="w-4 h-4 fill-surface-dim group-hover:fill-surface transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d={ICONS[link.key]} />
          </svg>
        </a>
      ))}
    </div>
  );
}
