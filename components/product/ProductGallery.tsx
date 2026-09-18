'use client';

import { useState, useRef, MouseEvent } from 'react';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  badge?: string | null;
}

export default function ProductGallery({ images, alt, badge }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] ?? images[0];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.75)',
    });
  };

  const resetZoom = () => setZoomStyle({ transformOrigin: 'center', transform: 'scale(1)' });

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

      {/* Main image with zoom-on-hover */}
      <div className="relative flex-1 bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetZoom}
          className="aspect-[3/4] sm:aspect-square relative w-full h-full overflow-hidden cursor-zoom-in"
        >
          <img
            src={activeImage}
            alt={alt}
            style={zoomStyle}
            className="w-full h-full object-cover transition-transform duration-300 ease-out will-change-transform"
          />
          {badge && (
            <div className="absolute top-6 left-6 pointer-events-none">
              <span className="bg-surface px-4 py-1.5 rounded-full text-label-sm font-label-sm border border-secondary text-primary uppercase shadow-sm">
                {badge}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
