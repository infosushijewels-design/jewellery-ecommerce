"use client";

import { useMemo, useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import {
  directionsUrl,
  distanceKm,
  isValidPincode,
  sortByPincode,
  type StoreBranch,
} from '@/lib/stores';

type Origin = { kind: 'pincode'; pincode: string } | { kind: 'location'; lat: number; lng: number } | null;

/* ─── Desktop card (unchanged) ─────────────────────────────────────── */
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

/* ─── Mobile compact list row ───────────────────────────────────────── */
function StoreListRow({ store, distance, onTap }: { store: StoreBranch; distance: number | null; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors text-left"
    >
      {/* icon / image */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex-shrink-0 flex items-center justify-center border border-outline-variant/40">
        {store.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-[18px] text-secondary">diamond</span>
        )}
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="font-label-lg text-[13px] text-primary font-semibold leading-tight truncate">
          {store.name}
          {store.is_flagship && <span className="ml-1.5 text-[9px] font-semibold text-secondary uppercase tracking-wider">Flagship</span>}
        </p>
        <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{store.city}, {store.state}</p>
        {store.hours && (
          <p className="text-[10px] text-on-surface-variant/70 mt-0.5 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[11px]">schedule</span>
            {store.hours}
          </p>
        )}
      </div>

      {/* distance + chevron */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {distance != null && (
          <span className="text-[10px] text-on-surface-variant">{distance < 1 ? '<1' : Math.round(distance)} km</span>
        )}
        <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
      </div>
    </button>
  );
}

/* ─── Bottom sheet ──────────────────────────────────────────────────── */
function StoreBottomSheet({ store, onClose }: { store: StoreBranch | null; onClose: () => void }) {
  useEffect(() => {
    if (store) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [store]);

  if (!store) return null;

  const actionClass =
    'flex flex-col items-center justify-center gap-1.5 py-3.5 text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors flex-1';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Close btn */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
        </button>

        {/* Store image */}
        {store.image_url && (
          <div className="mx-4 h-40 rounded-xl overflow-hidden mb-4">
            <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Info */}
        <div className="px-5 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-headline-sm text-[18px] text-primary font-semibold leading-snug">
                {store.name}
              </h3>
              {store.is_flagship && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-secondary">Flagship</span>
              )}
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
            {store.address}, {store.city}, {store.state} {store.pincode}
          </p>
          {store.hours && (
            <p className="text-label-sm text-on-surface-variant/80 mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
              {store.hours}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 border-t border-outline-variant/40 divide-x divide-outline-variant/40 mt-4">
          {store.phone ? (
            <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className={actionClass}>
              <span className="material-symbols-outlined text-[22px]">call</span>
              Call
            </a>
          ) : (
            <Link href="/contact" onClick={onClose} className={actionClass}>
              <span className="material-symbols-outlined text-[22px]">mail</span>
              Enquire
            </Link>
          )}
          <a href={directionsUrl(store)} target="_blank" rel="noopener noreferrer" className={actionClass}>
            <span className="material-symbols-outlined text-[22px]">directions</span>
            Directions
          </a>
          <Link href="/new-arrivals" onClick={onClose} className={actionClass}>
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
            Designs
          </Link>
        </div>

        <div className="pb-safe-area pb-4" />
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </>
  );
}

/* ─── Main StoreFinder ──────────────────────────────────────────────── */
export default function StoreFinder({ stores, limit, showCityFilter = false }: { stores: StoreBranch[]; limit?: number; showCityFilter?: boolean }) {
  const { contact } = useStoreSettings();
  const [pincode, setPincode] = useState('');
  const [origin, setOrigin] = useState<Origin>(null);
  const [city, setCity] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [activeStore, setActiveStore] = useState<StoreBranch | null>(null);

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
      {/* Pincode search */}
      <div className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
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
        <>
          {/* ── MOBILE: Compact list rows ── */}
          <div className="sm:hidden bg-surface border border-outline-variant/40 rounded-xl overflow-hidden">
            {visible.map(({ store, distance }) => (
              <StoreListRow
                key={store.id}
                store={store}
                distance={distance}
                onTap={() => setActiveStore(store)}
              />
            ))}
          </div>

          {/* ── DESKTOP: Card grid ── */}
          <div className={`hidden sm:grid grid-cols-2 ${limit && limit <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-5`}>
            {visible.map(({ store, distance }) => (
              <StoreCard key={store.id} store={store} distance={distance} whatsappFallback={contact.whatsapp} />
            ))}
          </div>
        </>
      )}

      {/* Bottom sheet (mobile only) */}
      <StoreBottomSheet store={activeStore} onClose={() => setActiveStore(null)} />
    </div>
  );
}
