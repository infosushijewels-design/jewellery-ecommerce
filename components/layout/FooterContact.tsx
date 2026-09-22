"use client";

import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

const ICONS: Record<string, string> = {
  "facebook": "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  "instagram": "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  "youtube": "M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z",
  "whatsapp": "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
  "pinterest": "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"
};

/** Footer concierge block — contact details and social links come from Admin → Settings. */
export default function FooterContact() {
  const { contact, social } = useStoreSettings();
  const telHref = contact.phone.replace(/[^\d+]/g, '');
  const waDigits = contact.whatsapp.replace(/\D/g, '');
  const waNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;

  const links = [
    { key: 'facebook', title: 'Facebook', href: social.facebook },
    { key: 'instagram', title: 'Instagram', href: social.instagram },
    { key: 'youtube', title: 'YouTube', href: social.youtube },
    { key: 'whatsapp', title: 'WhatsApp', href: waNumber ? `https://wa.me/${waNumber}` : '' },
    { key: 'pinterest', title: 'Pinterest', href: social.pinterest },
  ].filter((l) => l.href.trim());

  return (
    <div className="sm:col-span-2 lg:col-span-4 lg:pl-8">
      <h4 className="font-label-md text-label-md text-surface uppercase tracking-wider mb-4 sm:mb-6">Atelier Concierge</h4>
      {(contact.hoursWeekdays || contact.hoursSunday) && (
        <p className="font-body-sm text-body-sm text-surface-dim mb-4 whitespace-pre-line">
          {[contact.hoursWeekdays, contact.hoursSunday].filter(Boolean).join('\n')}
        </p>
      )}
      {contact.phone && (
        <a className="font-headline-sm text-headline-sm text-secondary-fixed hover:text-surface transition-colors block mb-2" href={`tel:${telHref}`}>
          {contact.phone}
        </a>
      )}
      {contact.email && (
        <a className="font-body-sm text-body-sm text-surface-dim hover:text-secondary-fixed transition-colors block mb-2" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      )}
      {contact.address && <p className="font-body-sm text-body-sm text-surface-dim whitespace-pre-line mb-2">{contact.address}</p>}

      {links.length > 0 && (
        <div className="flex gap-3 sm:gap-4 flex-wrap mt-4 sm:mt-6">
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
      )}
    </div>
  );
}
