"use client";

import type { AddressSuggestion } from '@/lib/hooks/useAddressAutocomplete';

interface AddressSuggestionsDropdownProps {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  visible: boolean;
  onPick: (suggestion: AddressSuggestion) => void;
}

export default function AddressSuggestionsDropdown({ suggestions, isLoading, visible, onPick }: AddressSuggestionsDropdownProps) {
  if (!visible || (!isLoading && suggestions.length === 0)) return null;

  return (
    <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-surface border border-outline-variant/60 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          Searching...
        </div>
      ) : (
        suggestions.map((s, i) => (
          <button
            key={`${s.label}-${i}`}
            type="button"
            // onMouseDown (not onClick) fires before the input's onBlur, so the pick registers
            // before the dropdown unmounts.
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(s);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-start gap-2 border-b border-outline-variant/20 last:border-none"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5">location_on</span>
            <span className="truncate">{s.label}</span>
          </button>
        ))
      )}
    </div>
  );
}
