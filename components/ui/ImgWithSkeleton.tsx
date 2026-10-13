"use client";

import { useState } from 'react';
import Image from 'next/image';

interface ImgWithSkeletonProps {
  src: string;
  alt: string;
}

/** Shared fade-in-on-load image used by ProductCard and BestsellerCard's 3:4 photo block. */
export default function ImgWithSkeleton({ src, alt }: ImgWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative aspect-[3/4] w-full bg-[#F5F0EB] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        // The image can finish loading before React hydrates and attaches onLoad — that event is
        // then lost and the photo would stay blurred forever. Catch the already-loaded case too.
        ref={(el) => {
          if (el?.complete) setLoaded(true);
        }}
        className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${
          loaded ? 'opacity-100' : 'opacity-70 blur-[3px]'
        }`}
      />
    </div>
  );
}
