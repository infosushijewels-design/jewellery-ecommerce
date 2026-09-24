/**
 * Store-wide settings edited in Admin → Settings and stored as JSON in
 * public.store_settings (single row). Defaults mirror the values that were
 * previously hard-coded, so the storefront behaves the same until an admin
 * changes something (or before migration 010 is applied).
 */
export interface StoreSettings {
  store: {
    name: string;
    companyName: string;
    websiteUrl: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    hoursWeekdays: string;
    hoursSunday: string;
  };
  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    pinterest: string;
  };
  commerce: {
    gstRate: number;
    gstin: string;
    freeShippingThreshold: number;
    shippingFee: number;
  };
  homepage: {
    philosophyEyebrow: string;
    philosophyQuote: string;
    philosophyText: string;
    founderName: string;
    founderTitle: string;
    philosophyImageUrl: string;
  };
  orders: {
    numberPrefix: string;
    minOrderValue: number; // 0 = no minimum
  };
  payments: {
    codEnabled: boolean;
    onlineEnabled: boolean;
    codMaxOrderValue: number; // 0 = no limit
    razorpayKeyId: string;
    razorpayKeySecret: string;
  };
  announcement: {
    enabled: boolean;
    messages: string[];
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store: {
    name: 'Sushi Jewels',
    companyName: 'Sushi Jewels Private Limited',
    websiteUrl: '',
    tagline: 'Fine Jewellery',
    logoUrl: '',
    faviconUrl: '',
  },
  contact: {
    email: 'concierge@sushijewels.com',
    phone: '+91 800 123 4567',
    whatsapp: '918001234567',
    address: '',
    hoursWeekdays: 'Mon – Sat: 10:00 AM – 7:00 PM (IST)',
    hoursSunday: '',
  },
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    pinterest: '',
  },
  commerce: {
    gstRate: 3,
    gstin: '',
    freeShippingThreshold: 2000,
    shippingFee: 99,
  },
  homepage: {
    philosophyEyebrow: 'Our Promise',
    philosophyQuote: 'Jewellery That Feels Like You — Crafted with BIS 916 hallmarked gold and certified diamonds to celebrate every milestone.',
    philosophyText:
      'At Sushi Jewels, we believe jewellery should be timeless and pure. Every piece is handcrafted by master Indian artisans with 100% hallmarked gold and certified natural diamonds.',
    founderName: 'Vipul & Meera Singhania',
    founderTitle: 'Founders & Craftsmen',
    philosophyImageUrl: '',
  },
  orders: {
    numberPrefix: 'SJ',
    minOrderValue: 0,
  },
  payments: {
    codEnabled: true,
    onlineEnabled: true,
    codMaxOrderValue: 0,
    razorpayKeyId: '',
    razorpayKeySecret: '',
  },
  announcement: {
    enabled: true,
    messages: [
      'Complimentary Insured Shipping on Orders Above ₹2,000',
      '100% Certified 18K/22K Gold & Natural Diamonds',
      '15-Day Easy Returns',
    ],
  },
  seo: {
    metaTitle: 'Sushi Jewels | Fine High Jewellery',
    metaDescription: 'Revered high jewellery crafted with BIS 916 hallmarked pure gold and conflict-free natural diamonds.',
    keywords: 'jewellery, gold jewellery, diamond jewellery, BIS hallmarked, fine jewellery India',
  },
};

type Section = keyof StoreSettings;

/** Deep-merges untrusted JSON onto the defaults, keeping only known keys with the right types. */
export function mergeStoreSettings(raw: unknown): StoreSettings {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out = structuredClone(DEFAULT_STORE_SETTINGS);

  (Object.keys(out) as Section[]).forEach((section) => {
    const incoming = src[section];
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return;
    const target = out[section] as unknown as Record<string, unknown>;
    Object.keys(target).forEach((key) => {
      const value = (incoming as Record<string, unknown>)[key];
      const fallback = target[key];
      if (Array.isArray(fallback)) {
        if (Array.isArray(value)) target[key] = value.filter((v): v is string => typeof v === 'string');
      } else if (typeof value === typeof fallback) {
        target[key] = typeof value === 'number' && !Number.isFinite(value) ? fallback : value;
      }
    });
  });
  return out;
}

export function shippingFeeFor(subtotal: number, s: StoreSettings) {
  if (subtotal === 0) return 0;
  return subtotal >= s.commerce.freeShippingThreshold ? 0 : s.commerce.shippingFee;
}
