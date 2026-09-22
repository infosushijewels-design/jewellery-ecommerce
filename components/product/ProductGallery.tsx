'use client';

import { useEffect, useRef, useState, MouseEvent } from 'react';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  badge?: string | null;
}

const LENS_SIZE = 160; // px, square lens over the cursor
const ZOOM_LEVEL = 2.5; // multiplier applied to the preview pane's background-size

function isFinePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function ProductGallery({ images, alt, badge }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] ?? images[0];

  useEffect(() => {
    if (!isLightboxOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isLightboxOpen]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Clamp so the lens square never overhangs the image edges
    const half = LENS_SIZE / 2;
    const x = Math.max(half, Math.min(e.clientX - rect.left, rect.width - half));
    const y = Math.max(half, Math.min(e.clientY - rect.top, rect.height - half));

    setLensPos({ x: x - half, y: y - half });
    setBgPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseEnter = () => {
    if (isFinePointer()) setIsZooming(true);
  };

  const handleMouseLeave = () => setIsZooming(false);

  const handleImageClick = () => {
    // Touch / coarse-pointer devices get a pinch-zoomable lightbox instead of the hover lens
    if (!isFinePointer()) {
      setIsLightboxOpen(true);
      setIsLightboxZoomed(false);
    }
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:sticky sm:top-24">
      {/* Thumbnail strip: horizontal on mobile, vertical on desktop */}
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible sm:w-20 flex-shrink-0 no-scrollbar">
          {images.map((img, index) => (
            <button
              key={img + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                activeIndex === index
                  ? 'border-secondary ring-1 ring-secondary'
                  : 'border-outline-variant/40 hover:border-secondary/60'
              }`}
            >
              <img src={img} alt={`${alt} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main image with magnifier lens */}
      <div className="relative flex-1">
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleImageClick}
          className="relative aspect-[3/4] sm:aspect-square w-full bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden cursor-zoom-in"
        >
          <img
            src={activeImage}
            alt={alt}
            draggable={false}
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {badge && (
            <div className="absolute top-6 left-6 pointer-events-none z-10">
              <span className="bg-surface px-4 py-1.5 rounded-full text-label-sm font-label-sm border border-secondary text-primary uppercase shadow-sm">
                {badge}
              </span>
            </div>
          )}

          {/* Square lens highlight, follows the cursor (desktop only) */}
          {isZooming && (
            <div
              className="hidden lg:block absolute border-2 border-secondary bg-white/20 shadow-[0_0_0_1px_rgba(0,0,0,0.15)] pointer-events-none z-20"
              style={{ width: LENS_SIZE, height: LENS_SIZE, left: lensPos.x, top: lensPos.y }}
            />
          )}

          {/* Mobile affordance hinting the image is tappable to zoom */}
          <div className="lg:hidden absolute bottom-3 right-3 bg-primary/70 text-surface rounded-full p-2 pointer-events-none">
            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
          </div>
        </div>

        {/* Zoomed preview glass panel, mirrors the exact area under the lens (desktop only) */}
        {isZooming && (
          <div
            className="hidden lg:block absolute top-0 left-[calc(100%+16px)] w-full aspect-square rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden bg-surface-container-low z-30"
            style={{
              backgroundImage: `url(${activeImage})`,
              backgroundSize: `${ZOOM_LEVEL * 100}%`,
              backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>

      {/* Mobile lightbox: pinch-to-zoom (native) with a double-tap toggle fallback */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center lg:hidden"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close zoom view"
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div
            className="w-full h-full overflow-auto flex items-center justify-center"
            style={{ touchAction: 'pinch-zoom' }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => setIsLightboxZoomed((z) => !z)}
          >
            <img
              src={activeImage}
              alt={alt}
              draggable={false}
              className="max-w-none transition-[width] duration-300 ease-out"
              style={{ width: isLightboxZoomed ? '220%' : '100%', touchAction: 'pinch-zoom' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
