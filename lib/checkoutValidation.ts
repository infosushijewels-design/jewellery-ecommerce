/**
 * Checkout form validation (pure functions — no React). Every rule returns a short, specific message so the
 * form can show the customer exactly which field is wrong and why.
 */

export type CheckoutField = 'email' | 'phone' | 'firstName' | 'lastName' | 'address' | 'city' | 'state' | 'pincode';

/** Top-to-bottom order of the fields on the page: the first error in this order gets focus. */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'pincode'];

export const CHECKOUT_FIELD_LABELS: Record<CheckoutField, string> = {
  email: 'Email Address',
  phone: 'Mobile Number',
  firstName: 'First Name',
  lastName: 'Last Name',
  address: 'Street Address',
  city: 'City',
  state: 'State',
  pincode: 'PIN Code',
};

export type CheckoutFormValues = Record<CheckoutField, string>;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

// Latin (incl. accents) and Devanagari letters, so names like "Śrī" or "आदित्य" are accepted.
// Written as explicit ranges instead of \p{L} because the project targets ES2017.
const LETTER = 'A-Za-z\\u00C0-\\u024F\\u0900-\\u097F';
const NAME_RE = new RegExp(`^[${LETTER}][${LETTER}\\u0300-\\u036F\\u0900-\\u097F .'\\-]*$`);
const HAS_LETTER_RE = new RegExp(`[${LETTER}]`);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;
const PIN_RE = /^[1-9][0-9]{5}$/;

/**
 * Accepts the usual ways Indians type a mobile number — 9876543210, 98765 43210, +91 98765 43210,
 * 91-9876543210, 09876543210 — and returns the canonical "+91 98765 43210", or null if it isn't a valid
 * 10-digit Indian mobile (starts with 6–9, not one repeated digit).
 */
export function normalizeIndianPhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith('+') && !/^\+\s*91/.test(raw)) return null; // another country code
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  if (/^(\d)\1{9}$/.test(digits)) return null; // 9999999999 and friends are never real
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function validateName(value: string, label: string): string | undefined {
  const v = value.trim();
  if (!v) return `Enter your ${label}.`;
  if (v.length > 50) return `${label[0].toUpperCase()}${label.slice(1)} is too long (max 50 characters).`;
  if (!NAME_RE.test(v)) return `${label[0].toUpperCase()}${label.slice(1)} should contain letters only — no numbers or symbols.`;
  return undefined;
}

export function validateCheckout(values: CheckoutFormValues): CheckoutErrors {
  const errors: CheckoutErrors = {};

  const email = values.email.trim();
  if (!email) errors.email = 'Enter your email address.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address, like name@example.com.';

  const phone = values.phone.trim();
  if (!phone) errors.phone = 'Enter your mobile number.';
  else if (phone.replace(/\D/g, '').length > 13) errors.phone = 'That number has too many digits — enter a 10-digit mobile number (you can add +91).';
  else if (!normalizeIndianPhone(phone)) errors.phone = 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.';

  const firstName = validateName(values.firstName, 'first name');
  if (firstName) errors.firstName = firstName;
  const lastName = validateName(values.lastName, 'last name');
  if (lastName) errors.lastName = lastName;

  const address = values.address.trim();
  if (!address) errors.address = 'Enter your street address.';
  else if (address.length < 5) errors.address = 'Address is too short — add your house/flat number and street (at least 5 characters).';
  else if (address.length > 200) errors.address = 'Address is too long (max 200 characters).';
  else if (!HAS_LETTER_RE.test(address)) errors.address = 'Address should include a street or area name, not just numbers.';

  const city = values.city.trim();
  if (!city) errors.city = 'Enter your city.';
  else if (city.length < 2 || city.length > 60 || !NAME_RE.test(city)) errors.city = 'City should contain letters only — no numbers or symbols.';

  const state = values.state.trim();
  if (!state) errors.state = 'Enter your state.';
  else if (state.length < 2 || state.length > 60 || !NAME_RE.test(state)) errors.state = 'State should contain letters only — no numbers or symbols.';

  const pincode = values.pincode.trim();
  if (!pincode) errors.pincode = 'Enter your 6-digit PIN code.';
  else if (!PIN_RE.test(pincode)) errors.pincode = 'PIN code must be exactly 6 digits and cannot start with 0 (for example 400001).';

  return errors;
}
