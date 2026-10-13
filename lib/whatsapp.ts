/**
 * The number in the form wa.me wants (country code + number, digits only), or null when it isn't a usable mobile
 * number. Spaces, dashes, brackets and "+" are stripped. Indian numbers may be written with or without +91 / 91 / 0;
 * a number from another country must be written with its "+" country code.
 */
export function normalizeWhatsAppNumber(phone?: string | null): string | null {
  const raw = (phone || '').trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  let full: string | null = null;
  if (/^[6-9]\d{9}$/.test(digits)) full = `91${digits}`;
  else if (/^0[6-9]\d{9}$/.test(digits)) full = `91${digits.slice(1)}`;
  else if (/^91[6-9]\d{9}$/.test(digits)) full = digits;
  else if (raw.startsWith('+') && !digits.startsWith('91') && /^[1-9]\d{7,14}$/.test(digits)) full = digits;
  if (!full || /^(\d)\1+$/.test(full.slice(-10))) return null; // 9999999999 and friends are never real
  return full;
}

/** https://wa.me/<number> (with an optional pre-filled message), or null when the phone number isn't valid. */
export function buildWhatsAppLink(phone?: string | null, message?: string): string | null {
  const full = normalizeWhatsAppNumber(phone);
  if (!full) return null;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
