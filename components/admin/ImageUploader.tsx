"use client";

import { useRef, useState, type DragEvent } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { ACCEPTED_IMAGE_TYPES, uploadImage } from '@/lib/storage';
import { inputClass } from './AdminUI';

function useDropZone(onFiles: (files: File[]) => void, disabled?: boolean) {
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    handlers: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files));
      },
    },
  };
}

function UrlFallback({ onAdd, disabled }: { onAdd: (url: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  if (!open) {
    return (
      <button type="button" disabled={disabled} onClick={() => setOpen(true)} className="text-xs text-[#8A6F3C] hover:underline disabled:opacity-40">
        or paste an image link
      </button>
    );
  }
  const submit = () => {
    const url = value.trim();
    if (!/^https?:\/\//i.test(url)) return;
    onAdd(url);
    setValue('');
    setOpen(false);
  };
  return (
    <div className="flex gap-2">
      <input
        type="url"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="https://..."
        className={`${inputClass} py-2 text-xs`}
      />
      <button type="button" onClick={submit} className="px-3 rounded-lg border border-[#E8D5C5] bg-white text-xs font-semibold text-[#2D2024] hover:bg-[#E8D5C5]/40">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 text-[#2D2024]/50 hover:text-[#2D2024]" aria-label="Cancel">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

/** Single image: click or drop to upload, with preview, replace and remove. */
export function ImageUploader({
  value,
  onChange,
  folder,
  label = 'Upload image',
  hint = 'JPG, PNG, WEBP · up to 5 MB',
  aspectClass = 'aspect-square',
  accept = ACCEPTED_IMAGE_TYPES,
  fit = 'cover',
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  hint?: string;
  aspectClass?: string;
  accept?: string[];
  fit?: 'cover' | 'contain';
  disabled?: boolean;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file, folder, accept));
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
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
        accept={accept.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      {value ? (
        <div className={`relative ${aspectClass} w-full rounded-xl overflow-hidden border border-[#E8D5C5] bg-[#F5EEE7] group`} {...handlers}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded preview" className={`w-full h-full ${fit === 'contain' ? 'object-contain p-3' : 'object-cover'}`} />
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#B99A62] animate-spin">progress_activity</span>
            </div>
          )}
          {!busy && (
            <div className="absolute inset-x-0 bottom-0 p-2 flex gap-2 justify-end bg-gradient-to-t from-black/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
          <span className="text-sm font-medium text-[#2D2024]">{uploading ? 'Uploading…' : label}</span>
          <span className="text-[11px] text-[#2D2024]/50">{dragging ? 'Drop to upload' : `Click or drag & drop · ${hint}`}</span>
        </button>
      )}
      {!value && <UrlFallback onAdd={onChange} disabled={busy} />}
    </div>
  );
}

/** Multiple images (e.g. a product gallery): upload several at once, remove or reorder. */
export function MultiImageUploader({
  values,
  onChange,
  folder,
  max = 8,
  disabled,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  max?: number;
  disabled?: boolean;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  async function handleFiles(files: File[]) {
    const room = max - values.length;
    if (room <= 0) {
      showToast(`You can add up to ${max} gallery images`, 'error');
      return;
    }
    const batch = files.slice(0, room);
    if (files.length > room) showToast(`Only the first ${room} image(s) were added (limit ${max})`, 'info');
    setUploadingCount(batch.length);
    const uploaded: string[] = [];
    for (const file of batch) {
      try {
        uploaded.push(await uploadImage(file, folder));
      } catch (err) {
        showToast(`${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`, 'error');
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
    if (uploaded.length) {
      onChange([...values, ...uploaded]);
      showToast(`${uploaded.length} image(s) uploaded`, 'success');
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  const { dragging, handlers } = useDropZone(handleFiles, disabled || uploadingCount > 0);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= values.length) return;
    const next = [...values];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      <div className="grid grid-cols-3 gap-2" {...handlers}>
        {values.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-[#E8D5C5] bg-[#F5EEE7] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <div className="absolute inset-0 flex items-start justify-between p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="w-6 h-6 rounded-full bg-white/95 text-[#2D2024] flex items-center justify-center shadow disabled:opacity-40"
                    aria-label="Move left"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === values.length - 1}
                    className="w-6 h-6 rounded-full bg-white/95 text-[#2D2024] flex items-center justify-center shadow disabled:opacity-40"
                    aria-label="Move right"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, j) => j !== i))}
                  className="w-6 h-6 rounded-full bg-white/95 text-red-600 flex items-center justify-center shadow"
                  aria-label={`Remove gallery image ${i + 1}`}
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div key={`uploading-${i}`} className="aspect-square rounded-lg border border-[#E8D5C5] bg-white flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#B99A62] animate-spin">progress_activity</span>
          </div>
        ))}
        {values.length + uploadingCount < max && (
          <button
            type="button"
            disabled={disabled || uploadingCount > 0}
            onClick={() => inputRef.current?.click()}
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-colors disabled:opacity-60 ${
              dragging ? 'border-[#B99A62] bg-[#B99A62]/10' : 'border-[#E8D5C5] bg-white hover:border-[#B99A62]'
            }`}
          >
            <span className="material-symbols-outlined text-2xl text-[#B99A62]">add_photo_alternate</span>
            <span className="text-[10px] text-[#2D2024]/60">Add images</span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#2D2024]/50">
          {values.length}/{max} · select or drop several at once
        </span>
      </div>
      {values.length < max && <UrlFallback onAdd={(url) => onChange([...values, url])} disabled={disabled} />}
    </div>
  );
}
