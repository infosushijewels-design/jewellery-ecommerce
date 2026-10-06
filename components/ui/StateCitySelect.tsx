"use client";

import React, { useState } from 'react';
import { INDIAN_STATES, OTHER_CITY, canonicalState, citiesForState, isListedCity } from '@/lib/indianStatesCities';

interface StateCitySelectProps {
  /** Prefix for the ids: `${idPrefix}-state`, `${idPrefix}-city` (the text box shown for "Other" takes the city id). */
  idPrefix: string;
  state: string;
  city: string;
  onChange: (next: { state: string; city: string }) => void;
  onBlurField?: (field: 'state' | 'city') => void;
  stateError?: string;
  cityError?: string;
  /** Page-specific styling, so the dropdowns look exactly like the neighbouring inputs. */
  controlClass: (error?: string) => string;
  labelClass: string;
  renderError: (field: 'state' | 'city', message?: string) => React.ReactNode;
  /** Wraps one field (label + control + error) in the page's own grid cell. */
  wrap?: (field: 'state' | 'city', content: React.ReactNode) => React.ReactNode;
  labels?: { state: string; city: string };
}

/**
 * Linked State → City dropdowns. Picking a state fills the city list with that state's major cities (and "Other");
 * choosing "Other" reveals a text box for any town not listed. A saved address whose city is not in the list opens
 * with "Other" selected and the city in the text box, so nothing already stored is lost. Renders the State field
 * first, then the City field, as two siblings so the page can lay them out in its own grid.
 */
export default function StateCitySelect({
  idPrefix,
  state,
  city,
  onChange,
  onBlurField,
  stateError,
  cityError,
  controlClass,
  labelClass,
  renderError,
  wrap = (_field, content) => content,
  labels = { state: 'State', city: 'City' },
}: StateCitySelectProps) {
  const selectedState = canonicalState(state) ?? '';
  const cities = citiesForState(selectedState);
  // "Other" chosen but nothing typed yet (an empty city can't tell us the customer picked Other)
  const [otherPicked, setOtherPicked] = useState(false);
  const cityIsCustom = !!city.trim() && !isListedCity(selectedState, city);
  const showOtherBox = !!selectedState && (otherPicked || cityIsCustom);
  const cityChoice = showOtherBox ? OTHER_CITY : city;

  const pickState = (next: string) => {
    setOtherPicked(false);
    // A different state means a different city list
    onChange({ state: next, city: next === selectedState ? city : '' });
  };

  const pickCity = (next: string) => {
    if (next === OTHER_CITY) {
      setOtherPicked(true);
      onChange({ state, city: '' });
    } else {
      setOtherPicked(false);
      onChange({ state, city: next });
    }
  };

  return (
    <>
      {wrap(
        'state',
        <div>
          <label htmlFor={`${idPrefix}-state`} className={labelClass}>
            {labels.state}
          </label>
          <select
            id={`${idPrefix}-state`}
            name="state"
            required
            autoComplete="address-level1"
            value={selectedState}
            onChange={(e) => pickState(e.target.value)}
            onBlur={() => onBlurField?.('state')}
            aria-invalid={stateError ? true : undefined}
            aria-describedby={stateError ? `${idPrefix}-state-error` : undefined}
            className={controlClass(stateError)}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {renderError('state', stateError)}
        </div>
      )}
      {wrap(
        'city',
        <div>
          <label htmlFor={showOtherBox ? `${idPrefix}-city` : `${idPrefix}-citySelect`} className={labelClass}>
            {labels.city}
          </label>
          <select
            id={showOtherBox ? `${idPrefix}-citySelect` : `${idPrefix}-city`}
            name={showOtherBox ? 'citySelect' : 'city'}
            required
            disabled={!selectedState}
            autoComplete="address-level2"
            value={cityChoice}
            onChange={(e) => pickCity(e.target.value)}
            onBlur={() => onBlurField?.('city')}
            aria-invalid={cityError && !showOtherBox ? true : undefined}
            aria-describedby={cityError && !showOtherBox ? `${idPrefix}-city-error` : undefined}
            className={`${controlClass(showOtherBox ? undefined : cityError)} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="">{selectedState ? 'Select city' : 'Select state first'}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {showOtherBox && (
            <input
              id={`${idPrefix}-city`}
              name="city"
              type="text"
              required
              maxLength={60}
              autoComplete="off"
              placeholder="Type your city / town"
              value={city}
              onChange={(e) => onChange({ state, city: e.target.value })}
              onBlur={() => onBlurField?.('city')}
              aria-invalid={cityError ? true : undefined}
              aria-describedby={cityError ? `${idPrefix}-city-error` : undefined}
              className={`${controlClass(cityError)} mt-2`}
            />
          )}
          {renderError('city', cityError)}
        </div>
      )}
    </>
  );
}
