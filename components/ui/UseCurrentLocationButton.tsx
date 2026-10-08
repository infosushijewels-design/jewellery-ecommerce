"use client";

import { useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { canonicalState, canonicalCity } from '@/lib/indianStatesCities';

export interface DetectedLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface UseCurrentLocationButtonProps {
  onLocationDetected: (location: DetectedLocation) => void;
  className?: string;
}

interface NominatimAddress {
  postcode?: string;
  state?: string;
  city?: string;
  town?: string;
  district?: string;
  county?: string;
  suburb?: string;
  road?: string;
  neighbourhood?: string;
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;

/**
 * 1-click "Use Current Location" pill: reads the browser's GPS position, then reverse-geocodes
 * it via OpenStreetMap Nominatim (free, no API key) and hands the caller back address/city/state/
 * pincode so it can fill its own form state (and run its own validation, unchanged).
 */
export default function UseCurrentLocationButton({ onLocationDetected, className = '' }: UseCurrentLocationButtonProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const { showToast } = useToast();

  const handleClick = () => {
    if (isDetecting) return;

    if (!('geolocation' in navigator)) {
      showToast('Location detection is not supported on this device. Please enter your address manually.', 'error');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Nominatim's usage policy asks for a custom User-Agent, but browsers block scripts
          // from setting that header — the Origin header sent automatically is the best a
          // client-side app can offer for identification here.
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('reverse geocode request failed');

          const data: { address?: NominatimAddress } = await res.json();
          const addr = data.address || {};

          const rawState = addr.state || '';
          const rawCity = addr.city || addr.town || addr.district || addr.county || addr.suburb || '';
          const street = addr.road || addr.suburb || addr.neighbourhood || '';
          const rawPincode = (addr.postcode || '').trim();

          const matchedState = canonicalState(rawState);
          const state = matchedState || rawState;
          const city = state ? canonicalCity(state, rawCity) : rawCity;
          const pincode = PINCODE_RE.test(rawPincode) ? rawPincode : '';
          const address = street ? `[Flat/House No.], Near ${street}` : '[Flat/House No.]';

          onLocationDetected({ address, city, state, pincode });
          showToast('📍 Location detected successfully! Please add your Flat / House number.', 'success');
        } catch {
          showToast('Could not detect your location. Please enter manually.', 'error');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          showToast('Location access was denied. Please enter your address manually.', 'error');
        } else {
          showToast('Could not detect your location. Please enter manually.', 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDetecting}
      aria-busy={isDetecting || undefined}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-secondary/50 bg-secondary-container/15 text-secondary font-label-sm text-label-sm uppercase tracking-wider hover:bg-secondary-container/30 hover:border-secondary transition-colors disabled:opacity-60 disabled:cursor-wait ${className}`}
    >
      {isDetecting ? (
        <>
          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          Detecting location...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-[16px]">my_location</span>
          Use Current Location
        </>
      )}
    </button>
  );
}
