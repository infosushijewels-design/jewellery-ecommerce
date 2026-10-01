"use client";

import React, { useRef, useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import TryOnCanvas from './TryOnCanvas';

export interface TryOnAnalysis {
  faceDetected: boolean;
  handDetected: boolean;
  tiltDegrees: number;
  neck: { x: number; y: number } | null;
  leftEarlobe: { x: number; y: number } | null;
  rightEarlobe: { x: number; y: number } | null;
  finger: { x: number; y: number } | null;
  notes?: string;
}

interface TryItOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productImageUrl: string;
}

export default function TryItOnModal({ isOpen, onClose, productTitle, productImageUrl }: TryItOnModalProps) {
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<TryOnAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file.', 'error');
      return;
    }

    setSelfieFile(file);
    setAnalysis(null);
    setAnalysisError(null);
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    setAnalysis(null);
    setAnalysisError(null);
    setDownloadError(null);
    canvasElRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    setIsProcessing(false);
    onClose();
  };

  const handleContinue = async () => {
    if (!selfieFile) return;
    setIsProcessing(true);
    setAnalysis(null);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append('selfie', selfieFile);
      formData.append('productImageUrl', productImageUrl);

      const res = await fetch('/api/try-on', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Could not analyze your photo. Please try again.');
      }

      setAnalysis(data as TryOnAnalysis);
      showToast('Photo analyzed successfully! Rendering your try-on preview...', 'success');
    } catch (err: any) {
      const message = err?.message || 'Could not analyze your photo. Please try again.';
      setAnalysisError(message);
      showToast(message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasElRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `${productTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'try-on'}-preview.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadError(null);
    } catch {
      // toDataURL throws a SecurityError if the jewellery image's host didn't allow CORS
      setDownloadError('This photo couldn’t be saved because the jewellery image is hosted somewhere that blocks downloads. Try a screenshot instead.');
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-surface rounded-2xl border border-outline-variant/40 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-outline-variant/30">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Try It On</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">See {productTitle} on you, powered by AI</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Upload / Preview Area */}
          {(analysis?.faceDetected || analysis?.handDetected) && selfiePreview ? (
            <div className="relative">
              <TryOnCanvas
                selfieSrc={selfiePreview}
                jewelryImageUrl={productImageUrl}
                analysis={analysis}
                productTitle={productTitle}
                onReady={(canvas) => {
                  canvasElRef.current = canvas;
                }}
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm text-primary rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-surface transition-colors"
                aria-label="Try another photo"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          ) : selfiePreview ? (
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">
              <img src={selfiePreview} alt="Your selfie" className="w-full h-full object-cover" />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm text-primary rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-surface transition-colors"
                aria-label="Remove photo"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low hover:border-secondary hover:bg-surface-container transition-colors flex flex-col items-center justify-center gap-2 text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[40px] text-secondary">add_a_photo</span>
              <span className="font-label-md text-label-md">Upload or Take a Photo</span>
              <span className="font-body-sm text-body-sm text-outline px-6 text-center">
                Face the camera directly, or show your hand in good lighting for the most accurate fit.
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selfiePreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-secondary text-secondary hover:bg-secondary-container/20 py-3 rounded-full font-label-lg text-label-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Choose Photo
            </button>
          )}

          <div className="flex items-center gap-2 text-outline">
            <span className="material-symbols-outlined text-[16px]">privacy_tip</span>
            <p className="font-body-sm text-body-sm">Your photo is used only for this preview and isn&apos;t stored.</p>
          </div>

          {analysisError && (
            <div className="flex items-start gap-2 bg-error-container/40 border border-error/30 rounded-xl p-3">
              <span className="material-symbols-outlined text-error text-[18px] flex-shrink-0">error</span>
              <p className="font-body-sm text-body-sm text-primary">{analysisError}</p>
            </div>
          )}

          {(analysis?.faceDetected || analysis?.handDetected) && (
            <div className="flex items-start gap-2 bg-secondary-container/20 border border-secondary/30 rounded-xl p-3">
              <span className="material-symbols-outlined text-secondary text-[18px] flex-shrink-0">check_circle</span>
              <p className="font-body-sm text-body-sm text-primary">
                Here&apos;s how {productTitle} looks on you!
              </p>
            </div>
          )}

          {downloadError && (
            <div className="flex items-start gap-2 bg-error-container/40 border border-error/30 rounded-xl p-3">
              <span className="material-symbols-outlined text-error text-[18px] flex-shrink-0">error</span>
              <p className="font-body-sm text-body-sm text-primary">{downloadError}</p>
            </div>
          )}

          {(analysis?.faceDetected || analysis?.handDetected) ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 bg-primary text-surface py-3.5 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Save Photo
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 border border-secondary text-secondary hover:bg-secondary-container/20 py-3.5 rounded-full font-label-lg text-label-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Try Another Photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selfieFile || isProcessing}
              className="w-full bg-primary text-surface py-3.5 rounded-full font-label-lg text-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Continue
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
