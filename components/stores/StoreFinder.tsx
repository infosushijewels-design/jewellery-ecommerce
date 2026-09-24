"use client";

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import {
  directionsUrl,
  distanceKm,
  isValidPincode,
  sortByPincode,
  storeWhatsappUrl,
  type StoreBranch,
} from '@/lib/stores';

type Origin = { kind: 'pincode'; pincode: string } | { kind: 'location'; lat: number; lng: number } | null;

function StoreCard({ store, distance, whatsappFallback }: { store: StoreBranch; distance: number | null; whatsappFallback: string }) {
  const actionClass =
    'flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors';

  return (
    <article className="bg-surface border border-outline-variant/50 rounded-xl overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(45,32,36,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(45,32,36,0.12)] transition-shadow">
      <div className="flex gap-3.5 p-4 flex-1">
        <div className="w-[72px] h-[72px] rounded-lg overflow-hidden bg-surface-container flex-shrink-0 flex items-center justify-center">
          {store.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-[30px] text-secondary">storefront</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-label-lg text-[15px] text-primary font-semibold leading-snug">
              {store.name}
              <span className="font-normal text-on-surface-variant">, {store.city}</span>
            </h3>
            {distance != null && (
              <span className="text-label-sm text-on-surface-variant whitespace-nowrap mt-0.5">
                {distance < 1 ? '<1' : Math.round(distance)} KM
              </span>
            )}
          </div>
          {store.is_flagship && (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">Flagship</span>
          )}
          <p className="text-body-sm text-on-surface-variant mt-1 leading-snug">
            {store.address}, {store.city}, {store.state} {store.pincode}
          </p>
          {store.hours && (
            <p className="text-label-sm text-on-surface-variant/80 mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {store.hours}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-outline-variant/40 divide-x divide-outline-variant/40">
        {store.phone ? (
          <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className={actionClass}>
            <span className="material-symbols-outlined text-[20px]">call</span>
            Call
          </a>
        ) : (
          <Link href="/contact" className={actionClass}>
            <span className="material-symbols-outlined text-[20px]">mail</span>
            Enquire
          </Link>
        )}
        <a href={directionsUrl(store)} target="_blank" rel="noopener noreferrer" className={actionClass}>
          <span className="material-symbols-outlined text-[20px]">directions</span>
          Visit Store
        </a>
        <Link href="/new-arrivals" className={actionClass}>
          <span className="material-symbols-outlined text-[20px]">grid_view</span>
          View Designs
        </Link>
      </div>
    </article>
  );
}

export default function StoreFinder({ stores, limit, showCityFilter = false }: { stores: StoreBranch[]; limit?: number; showCityFilter?: boolean }) {
  const { contact } = useStoreSettings();
  const [pincode, setPincode] = useState('');
  const [origin, setOrigin] = useState<Origin>(null);
  const [city, setCity] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const cities = useMemo(() => Array.from(new Set(stores.map((s) => s.city))).sort(), [stores]);

  const ranked = useMemo(() => {
    const pool = city === 'all' ? stores : stores.filter((s) => s.city === city);
    if (origin?.kind === 'location') {
      return pool
        .map((s) => ({
          store: s,
          distance: s.latitude != null && s.longitude != null ? distanceKm(origin, { lat: s.latitude, lng: s.longitude }) : null,
        }))
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    const ordered = origin?.kind === 'pincode' ? sortByPincode(pool, origin.pincode) : pool;
    return ordered.map((s) => ({ store: s, distance: null as number | null }));
  }, [stores, origin, city]);

  const visible = limit ? ranked.slice(0, limit) : ranked;

  function findByPincode(e: FormEvent) {
    e.preventDefault();
    if (!isValidPincode(pincode)) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }
    setError(null);
    setOrigin({ kind: 'pincode', pincode });
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ kind: 'location', lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPincode('');
        setLocating(false);
      },
      () => {
        setError('We could not access your location. Please enter your pincode instead.');
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center gap-2 mb-8">
        <form onSubmit={findByPincode} className="w-full max-w-md flex rounded-xl border border-outline-variant/70 overflow-hidden bg-surface focus-within:border-primary transition-colors">
          <label className="flex-1 flex items-center gap-2 pl-4">
            <span className="material-symbols-outlined text-[20px] text-outline">storefront</span>
            <span className="sr-only">Pincode</span>
            <input
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="Enter Pincode"
              className="w-full py-3 bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
            />
          </label>
          <button type="submit" className="px-5 bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors">
            Find Store
          </button>
        </form>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 text-label-md font-label-md text-secondary hover:underline disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${locating ? 'animate-spin' : ''}`}>{locating ? 'progress_activity' : 'my_location'}</span>
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
        {error && <p className="text-body-sm text-error">{error}</p>}
        {origin && !error && (
          <p className="text-body-sm text-on-surface-variant">
            {origin.kind === 'pincode' ? `Showing stores nearest to ${origin.pincode}` : 'Showing stores nearest to you'}
            <button type="button" onClick={() => setOrigin(null)} className="ml-2 text-primary underline underline-offset-2">
              Clear
            </button>
          </p>
        )}
      </div>

      {showCityFilter && cities.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['all', ...cities].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={`px-4 py-1.5 rounded-full border text-body-sm transition-colors ${
                city === c ? 'bg-primary border-primary text-surface' : 'border-outline-variant/60 text-primary hover:border-primary'
              }`}
            >
              {c === 'all' ? `All Cities (${stores.length})` : c}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-body-md text-on-surface-variant py-10">No stores to show yet.</p>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${limit && limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-5`}>
          {visible.map(({ store, distance }) => (
            <StoreCard key={store.id} store={store} distance={distance} whatsappFallback={contact.whatsapp} />
          ))}
        </div>
      )}
    </div>
  );
}
