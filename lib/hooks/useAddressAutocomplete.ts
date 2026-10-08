"use client";

import { useEffect, useRef, useState } from 'react';
import { canonicalState, canonicalCity } from '@/lib/indianStatesCities';

export interface AddressSuggestion {
  /** What's shown in the dropdown list. */
  label: string;
  /** What gets written into the Address field when picked. */
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface NominatimSearchResult {
  display_name: string;
  address?: {
    postcode?: string;
    state?: string;
    city?: string;
    town?: string;
    district?: string;
    county?: string;
    suburb?: string;
    road?: string;
    neighbourhood?: string;
  };
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;
const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 4;

/**
 * Live address suggestions as the user types, via OpenStreetMap Nominatim's free forward-search
 * (no API key). Debounced and request-cancelling, so only the latest keystroke's result lands.
 */
export function useAddressAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = query.trim();
    // Skip the "[Flat/House No.], Near X" text we write in ourselves after a GPS/suggestion pick
    if (trimmed.length < MIN_QUERY_LENGTH || trimmed.startsWith('[Flat')) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) throw new Error('address search failed');
        const data: NominatimSearchResult[] = await res.json();

        setSuggestions(
          data.map((item) => {
            const addr = item.address || {};
            const rawState = addr.state || '';
            const rawCity = addr.city || addr.town || addr.district || addr.county || addr.suburb || '';
            const street = addr.road || addr.neighbourhood || addr.suburb || '';
            const matchedState = canonicalState(rawState);
            const state = matchedState || rawState;
            const city = state ? canonicalCity(state, rawCity) : rawCity;
            const rawPincode = (addr.postcode || '').trim();
            const pincode = PINCODE_RE.test(rawPincode) ? rawPincode : '';
            const address = street ? `[Flat/House No.], Near ${street}` : item.display_name.split(',')[0];
            return { label: item.display_name, address, city, state, pincode };
          })
        );
      } catch (err: any) {
        if (err?.name !== 'AbortError') setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { suggestions, isLoading, clear: () => setSuggestions([]) };
}
