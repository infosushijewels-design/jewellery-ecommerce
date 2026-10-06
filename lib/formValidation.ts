/**
 * Validation for the shop's forms beyond checkout: the contact form, the saved-address form and profile in
 * My Account, and the newsletter sign-up. Pure functions (no React, no network) built from the same single-field
 * rules the checkout uses (lib/checkoutValidation.ts), so a phone number, PIN code or name is judged identically
 * everywhere. Every rule returns a short, specific message so a form can show the customer exactly which field is
 * wrong and why. The same functions run again on the server for the forms that post to an API route.
 */
import {
  HAS_LETTER_RE,
  NAME_RE,
  normalizeIndianPhone,
  validateEmailAddress,
  validateName,
  validatePhoneNumber,
  validatePincode,
  validateCity,
  validateState,
  validateStreetAddress,
} from '@/lib/checkoutValidation';

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** The first message in `order` that has an error (handy for a "fix this first" toast and for focusing). */
export function firstErrorField<K extends string>(errors: FieldErrors<K>, order: readonly K[]): K | undefined {
  return order.find((field) => errors[field]);
}

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
export const CONTACT_CATEGORIES = ['Engagement', 'High Jewellery', 'Bespoke'] as const;
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 2000;

export type ContactField = 'name' | 'email' | 'phone' | 'category' | 'message';
export const CONTACT_FIELD_ORDER: readonly ContactField[] = ['name', 'email', 'phone', 'category', 'message'];
export const CONTACT_FIELD_LABELS: Record<ContactField, string> = {
  name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  category: 'Preferred Category',
  message: 'Message',
};
export type ContactValues = Record<ContactField, string>;

export function validateContact(values: ContactValues): FieldErrors<ContactField> {
  const errors: FieldErrors<ContactField> = {};

  const name = values.name.trim();
  const nameError = validateName(name, 'name');
  if (nameError) errors.name = nameError;
  else if (name.length < 2) errors.name = 'Name is too short.';

  const emailError = validateEmailAddress(values.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhoneNumber(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (!(CONTACT_CATEGORIES as readonly string[]).includes(values.category)) errors.category = 'Choose what your enquiry is about.';

  const message = values.message.trim();
  if (!message) errors.message = 'Write your message.';
  else if (message.length < CONTACT_MESSAGE_MIN) errors.message = `Your message is a little short — please tell us a bit more (at least ${CONTACT_MESSAGE_MIN} characters).`;
  else if (message.length > CONTACT_MESSAGE_MAX) errors.message = `Your message is too long (max ${CONTACT_MESSAGE_MAX} characters).`;
  else if (!HAS_LETTER_RE.test(message)) errors.message = 'Please write your message in words.';

  return errors;
}

// ---------------------------------------------------------------------------
// Saved addresses (My Account)
// ---------------------------------------------------------------------------
export type AddressField = 'label' | 'fullName' | 'phone' | 'address' | 'city' | 'state' | 'pincode';
export const ADDRESS_FIELD_ORDER: readonly AddressField[] = ['label', 'fullName', 'phone', 'address', 'state', 'city', 'pincode'];
export const ADDRESS_FIELD_LABELS: Record<AddressField, string> = {
  label: 'Label',
  fullName: 'Full Name',
  phone: 'Phone',
  address: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
};
export type AddressValues = Record<AddressField, string>;

const LABEL_RE = /^[A-Za-z0-9][A-Za-z0-9 &'.\-]*$/;

export function validateAddressBook(values: AddressValues): FieldErrors<AddressField> {
  const errors: FieldErrors<AddressField> = {};

  const label = values.label.trim();
  if (label && (label.length > 30 || !LABEL_RE.test(label))) errors.label = 'Label can use letters, numbers and spaces only (max 30 characters).';

  const fullName = values.fullName.trim();
  if (!fullName) errors.fullName = 'Enter your full name.';
  else if (fullName.length > 100) errors.fullName = 'Name is too long (max 100 characters).';
  else if (!NAME_RE.test(fullName)) errors.fullName = 'Name should contain letters only — no numbers or symbols.';
  else if (fullName.split(/\s+/).length < 2) errors.fullName = 'Enter your first and last name.';

  const phoneError = validatePhoneNumber(values.phone);
  if (phoneError) errors.phone = phoneError;
  const addressError = validateStreetAddress(values.address);
  if (addressError) errors.address = addressError;
  const stateError = validateState(values.state);
  if (stateError) errors.state = stateError;
  const cityError = validateCity(values.city);
  if (cityError) errors.city = cityError;
  const pinError = validatePincode(values.pincode);
  if (pinError) errors.pincode = pinError;

  return errors;
}

/** The 10 digits to store for a valid phone number (the address book keeps plain digits). */
export function phoneDigits(value: string): string | null {
  const canonical = normalizeIndianPhone(value);
  return canonical ? canonical.replace(/\D/g, '').slice(-10) : null;
}

// ---------------------------------------------------------------------------
// Profile (My Account → Personal Info): both fields are optional, but must be sensible when filled in.
// ---------------------------------------------------------------------------
export type ProfileField = 'fullName' | 'phone';
export const PROFILE_FIELD_ORDER: readonly ProfileField[] = ['fullName', 'phone'];
export const PROFILE_FIELD_LABELS: Record<ProfileField, string> = { fullName: 'Full Name', phone: 'Phone Number' };

export function validateProfile(values: Record<ProfileField, string>): FieldErrors<ProfileField> {
  const errors: FieldErrors<ProfileField> = {};
  const fullName = values.fullName.trim();
  if (fullName) {
    if (fullName.length > 100) errors.fullName = 'Name is too long (max 100 characters).';
    else if (!NAME_RE.test(fullName)) errors.fullName = 'Name should contain letters only — no numbers or symbols.';
  }
  if (values.phone.trim()) {
    const phoneError = validatePhoneNumber(values.phone);
    if (phoneError) errors.phone = phoneError;
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export const validateNewsletterEmail = validateEmailAddress;
