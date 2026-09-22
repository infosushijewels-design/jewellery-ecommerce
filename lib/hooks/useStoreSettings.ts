"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_STORE_SETTINGS, mergeStoreSettings, type StoreSettings } from '@/lib/storeSettings';

// One fetch per page load, shared by every component that needs settings.
let cache: StoreSettings | null = null;
let inflight: Promise<StoreSettings> | null = null;
const listeners = new Set<(s: StoreSettings) => void>();

async function fetchSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await createClient().from('store_settings').select('settings').eq('id', 1).maybeSingle();
    if (error || !data) return DEFAULT_STORE_SETTINGS;
    return mergeStoreSettings(data.settings);
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function loadStoreSettings(force = false): Promise<StoreSettings> {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = fetchSettings().then((s) => {
      cache = s;
      inflight = null;
      listeners.forEach((fn) => fn(s));
      return s;
    });
  }
  return inflight;
}

/** Push freshly saved settings to every mounted consumer (used by Admin → Settings). */
export function publishStoreSettings(s: StoreSettings) {
  cache = s;
  listeners.forEach((fn) => fn(s));
}

/** Store settings with defaults rendered immediately and DB values swapped in once loaded. */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(cache ?? DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    listeners.add(setSettings);
    loadStoreSettings().then(setSettings);
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
}
