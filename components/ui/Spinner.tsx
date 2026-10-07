import React from 'react';

/**
 * The one loading indicator used by every action button in the storefront and the admin panel: Material's
 * "progress_activity" ring, spinning. Colour follows the surrounding text, so it suits dark and light buttons alike.
 */
export default function Spinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined animate-spin leading-none ${className}`} style={{ fontSize: size }}>
      progress_activity
    </span>
  );
}

/**
 * A button's label while its action runs: spinner + short text ("Saving…"), otherwise the normal label.
 * Put it inside the <button> and disable that button while `loading` is true.
 */
export function LoadingLabel({ loading, loadingText, children }: { loading: boolean; loadingText: string; children: React.ReactNode }) {
  if (!loading) return <>{children}</>;
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner size={16} />
      {loadingText}
    </span>
  );
}
