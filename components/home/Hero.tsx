"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';

const DEFAULT_VIDEO = '/videos/hero-banner.mp4';
const DEFAULT_POSTER = '/videos/hero-poster.jpg';

export default function Hero() {
  const { homepage } = useStoreSettings();
  const videoRef = useRef<HTMLVideoElement>(null);

  const configuredVideo = homepage.heroVideoUrl?.trim() || '';
  const posterSrc = homepage.heroPosterUrl?.trim() || DEFAULT_POSTER;
  const bannerLink = homepage.heroBannerLink?.trim() || '/collections';

  // Graceful fallback: if the admin-configured video fails to load, fall back to the
  // local default video; if even that fails (e.g. the file was deleted), stop trying
  // to play video at all and show the poster as a plain static image instead of a
  // broken/frozen player.
  const [videoFailed, setVideoFailed] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);

  useEffect(() => {
    // A new video URL was configured — give it a fresh chance to play.
    setVideoFailed(false);
  }, [configuredVideo]);

  const videoSrc = !configuredVideo || videoFailed ? DEFAULT_VIDEO : configuredVideo;
  const showStaticFallback = defaultFailed;

  useEffect(() => {
    // Autoplay when mounted or video src changes
    if (videoRef.current && !showStaticFallback) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc, showStaticFallback]);

  function handleVideoError() {
    if (videoSrc === DEFAULT_VIDEO) {
      setDefaultFailed(true);
    } else {
      setVideoFailed(true);
    }
  }

  return (
    <section className="w-full bg-surface-container-low" aria-label="Brand Hero Banner">
      {/* Video Hero Showcase */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1] max-h-[640px] overflow-hidden bg-[#1A1416] select-none group">
        <Link
          href={bannerLink}
          className="block w-full h-full relative cursor-pointer"
          aria-label="Explore Sushi Jewels High Jewellery Collections"
        >
          {showStaticFallback ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterSrc} alt="Sushi Jewels fine jewellery" className="w-full h-full object-cover object-center pointer-events-none" />
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onError={handleVideoError}
              className="w-full h-full object-cover object-center pointer-events-none"
            />
          )}

          {/* Subtle cinematic gradient overlays for depth and luxury readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        </Link>
      </div>

      {/* Custom design entry point below the video banner */}
      <div className="border-t border-outline-variant/30 py-3 sm:py-3.5 px-4 bg-surface">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-center">
          <p className="font-body-sm text-[12px] sm:text-body-sm text-on-surface-variant italic">
            Have a design in mind? Let us bring it to life.
          </p>
          <Link
            href="/customize-your-design"
            className="flex-shrink-0 px-5 sm:px-6 py-2 bg-primary text-surface rounded-full font-label-md text-[11px] sm:text-label-md uppercase tracking-wider hover:bg-secondary transition-colors"
          >
            Customize Your Jewellery
          </Link>
        </div>
      </div>
    </section>
  );
}
