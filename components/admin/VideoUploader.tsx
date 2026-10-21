"use client";

import { useRef, useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { ACCEPTED_VIDEO_TYPES, uploadVideo } from '@/lib/storage';
import { useDropZone } from './ImageUploader';

/** Single video: click or drop to upload, with live progress, preview, replace and remove. */
export function VideoUploader({
  value,
  onChange,
  folder,
  label = 'Upload video',
  hint = 'MP4 or WebM · up to 25 MB',
  aspectClass = 'aspect-[21/9]',
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  hint?: string;
  aspectClass?: string;
  disabled?: boolean;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadVideo(file, folder, setProgress);
      onChange(url);
      showToast('Video uploaded', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const { dragging, handlers } = useDropZone(handleFiles, disabled || uploading);
  const busy = disabled || uploading;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      {value ? (
        <div className={`relative ${aspectClass} w-full rounded-xl overflow-hidden border border-[#E8D5C5] bg-black group`} {...handlers}>
          <video src={value} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
              <span className="material-symbols-outlined text-3xl text-[#D9BB83] animate-spin">progress_activity</span>
              <span className="text-xs font-medium">{progress}%</span>
              <div className="w-2/3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[#D9BB83] transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {!busy && (
            <div className="absolute inset-x-0 bottom-0 p-2 flex gap-2 justify-end bg-gradient-to-t from-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1 bg-white/95 hover:bg-white text-[#2D2024] text-xs font-semibold px-3 py-1.5 rounded-full shadow"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 bg-white/95 hover:bg-white text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          {...handlers}
          className={`${aspectClass} w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center px-4 transition-colors disabled:opacity-60 ${
            dragging ? 'border-[#B99A62] bg-[#B99A62]/10' : 'border-[#E8D5C5] bg-white hover:border-[#B99A62] hover:bg-[#FFFCF7]'
          }`}
        >
          <span className={`material-symbols-outlined text-3xl text-[#B99A62] ${uploading ? 'animate-spin' : ''}`}>
            {uploading ? 'progress_activity' : 'cloud_upload'}
          </span>
          <span className="text-sm font-medium text-[#2D2024]">{uploading ? `Uploading… ${progress}%` : label}</span>
          <span className="text-[11px] text-[#2D2024]/50">{dragging ? 'Drop to upload' : `Click or drag & drop · ${hint}`}</span>
          {uploading && (
            <div className="w-2/3 h-1.5 rounded-full bg-[#E8D5C5] overflow-hidden mt-1">
              <div className="h-full bg-[#B99A62] transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
          )}
        </button>
      )}
    </div>
  );
}
