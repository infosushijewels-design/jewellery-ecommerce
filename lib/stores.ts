/** Store branches shown on the homepage, /stores and managed in Admin → Stores. */
export interface StoreBranch {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: string | null;
  image_url: string | null;
  map_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_flagship: boolean;
  is_active: boolean;
  sort_order: number;
}

/** Shown until migration 012 is applied (same two branches it seeds). */
export const FALLBACK_BRANCHES: StoreBranch[] = [
  {
    id: 'jaipur-flagship',
    name: 'Jaipur Flagship',
    address: 'MI Road, Heritage District',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    phone: null,
    whatsapp: null,
    email: null,
    hours: 'Mon – Sat: 10:00 AM – 7:00 PM',
    image_url: null,
    map_url: null,
    latitude: 26.9157,
    longitude: 75.8105,
    is_flagship: true,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'mumbai-atelier',
    name: 'Mumbai Atelier',
    address: 'Turner Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: null,
    whatsapp: null,
    email: null,
    hours: 'Mon – Sat: 10:00 AM – 7:00 PM',
    image_url: null,
    map_url: null,
    latitude: 19.0625,
    longitude: 72.8347,
    is_flagship: false,
    is_active: true,
    sort_order: 2,
  },
];

export function isValidPincode(pin: string) {
  return /^[1-9][0-9]{5}$/.test(pin);
}

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Orders branches by closeness to a pincode. Indian PIN codes are geographic
 * (first digit = region, first 3 = sorting district), so a longer shared prefix
 * means nearer; ties fall back to numeric difference.
 */
export function sortByPincode(stores: StoreBranch[], pincode: string) {
  const sharedPrefix = (a: string, b: string) => {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    return i;
  };
  return [...stores].sort((x, y) => {
    const byPrefix = sharedPrefix(y.pincode, pincode) - sharedPrefix(x.pincode, pincode);
    if (byPrefix !== 0) return byPrefix;
    return Math.abs(Number(x.pincode) - Number(pincode)) - Math.abs(Number(y.pincode) - Number(pincode));
  });
}

export function directionsUrl(store: StoreBranch) {
  if (store.map_url) return store.map_url;
  if (store.latitude != null && store.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }
  const q = `Sushi Jewels ${store.name}, ${store.address}, ${store.city} ${store.pincode}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function storeWhatsappUrl(store: StoreBranch, fallbackNumber?: string) {
  const digits = (store.whatsapp || fallbackNumber || '').replace(/\D/g, '');
  if (!digits) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  const text = `Hello! I'd like to know more about the ${store.name} store.`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export function sortStores(stores: StoreBranch[]) {
  return [...stores].sort((a, b) => Number(b.is_flagship) - Number(a.is_flagship) || a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}
