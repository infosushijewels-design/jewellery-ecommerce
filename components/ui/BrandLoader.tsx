import Image from 'next/image';

/**
 * Sushi Jewels brand loader: the logo breathing softly inside a thin spinning ring, with "SUSHI JEWELS" underneath.
 *
 *   <BrandLoader fullScreen />   covers the whole screen (route changes, long operations)
 *   <BrandLoader />              sits inside its parent (a card, a panel…)
 *
 * Animations are skipped for visitors who ask their device for reduced motion.
 */
export default function BrandLoader({ fullScreen = false, label = 'Loading…' }: { fullScreen?: boolean; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-surface/90 backdrop-blur-sm'
          : 'flex w-full items-center justify-center py-16'
      }
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-28 w-28 items-center justify-center">
          {/* faint full ring + a thin gold arc spinning over it */}
          <span aria-hidden="true" className="absolute inset-0 rounded-full border border-secondary/15" />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-transparent border-t-secondary border-r-secondary/40 motion-safe:animate-spin [animation-duration:1.4s]"
          />
          <Image
            src="/logo.jpeg"
            alt=""
            width={638}
            height={978}
            priority
            // shown about 47px wide, so ask for a small file instead of the full-size logo
            sizes="96px"
            className="h-[72px] w-auto mix-blend-multiply motion-safe:animate-pulse [animation-duration:2.4s]"
          />
        </div>
        <span className="font-label-md text-label-md uppercase tracking-[0.35em] text-primary">Sushi Jewels</span>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
