"use client";

import { useEffect, useRef, useState } from 'react';
import type { TryOnAnalysis } from './TryItOnModal';

interface TryOnCanvasProps {
  selfieSrc: string;
  jewelryImageUrl: string;
  analysis: TryOnAnalysis;
  productTitle: string;
  onReady?: (canvas: HTMLCanvasElement | null) => void;
}

const MAX_CANVAS_WIDTH = 720;

function loadImage(src: string, tryCrossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (tryCrossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Some hosts reject anonymous CORS requests outright — retry without it
      // so the preview still renders (exporting/downloading may be blocked later).
      if (tryCrossOrigin) {
        loadImage(src, false).then(resolve).catch(reject);
      } else {
        reject(new Error('Failed to load image'));
      }
    };
    img.src = src;
  });
}

export default function TryOnCanvas({ selfieSrc, jewelryImageUrl, analysis, productTitle, onReady }: TryOnCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    onReady?.(null);

    async function render() {
      setIsRendering(true);
      setRenderError(null);
      try {
        const [selfieImg, jewelryImg] = await Promise.all([
          loadImage(selfieSrc, false), // local data URL — no CORS needed
          loadImage(jewelryImageUrl, true),
        ]);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = Math.min(1, MAX_CANVAS_WIDTH / selfieImg.naturalWidth);
        const width = Math.round(selfieImg.naturalWidth * scale);
        const height = Math.round(selfieImg.naturalHeight * scale);
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(selfieImg, 0, 0, width, height);

        const tiltRad = (analysis.tiltDegrees * Math.PI) / 180;
        const isEarring = /ear(ring|stud|hoop|drop)/i.test(productTitle);
        const isRing = /ring/i.test(productTitle) && !isEarring;

        const drawPiece = (point: { x: number; y: number }, pieceWidth: number, mirror: boolean) => {
          const pieceHeight = pieceWidth * (jewelryImg.naturalHeight / jewelryImg.naturalWidth);
          ctx.save();
          ctx.translate(point.x * width, point.y * height);
          ctx.rotate(tiltRad);
          if (mirror) ctx.scale(-1, 1);
          // Anchor the top-center of the piece at the detected point, so it hangs downward naturally.
          ctx.drawImage(jewelryImg, -pieceWidth / 2, 0, pieceWidth, pieceHeight);
          ctx.restore();
        };

        if (isEarring && analysis.leftEarlobe && analysis.rightEarlobe) {
          const earWidth = width * 0.09;
          drawPiece(analysis.leftEarlobe, earWidth, false);
          drawPiece(analysis.rightEarlobe, earWidth, true);
        } else if (isRing && analysis.finger) {
          const ringWidth = width * 0.18; 
          drawPiece(analysis.finger, ringWidth, false);
        } else if (analysis.neck) {
          drawPiece(analysis.neck, width * 0.24, false);
        } else if (analysis.leftEarlobe && analysis.rightEarlobe) {
          // Fallback: no neck point, but earlobes are available
          const earWidth = width * 0.09;
          drawPiece(analysis.leftEarlobe, earWidth, false);
          drawPiece(analysis.rightEarlobe, earWidth, true);
        } else {
          throw new Error('No placement position was detected for this jewellery piece.');
        }

        if (!cancelled) {
          setIsRendering(false);
          onReady?.(canvas);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError((err instanceof Error && err.message) || 'Could not render the try-on preview.');
          setIsRendering(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfieSrc, jewelryImageUrl, analysis, productTitle]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">
      <canvas ref={canvasRef} className="w-full h-auto block" />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
          <span className="material-symbols-outlined text-[32px] text-secondary animate-spin">progress_activity</span>
        </div>
      )}
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/90 p-4 text-center">
          <p className="font-body-sm text-body-sm text-error">{renderError}</p>
        </div>
      )}
    </div>
  );
}
