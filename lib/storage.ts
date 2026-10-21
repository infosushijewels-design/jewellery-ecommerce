import { createClient } from '@/lib/supabase/client';

export const MEDIA_BUCKET = 'store-media';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// SVG is deliberately excluded: an uploaded SVG can carry script and is served from a public URL
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
export const ACCEPTED_ICON_TYPES = [...ACCEPTED_IMAGE_TYPES, 'image/x-icon', 'image/vnd.microsoft.icon'];

// Dedicated bucket (migration 041) so the hero video's larger size cap doesn't
// loosen the limit on every other image upload that shares MEDIA_BUCKET.
export const HERO_VIDEO_BUCKET = 'hero-video';
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

export function validateImageFile(file: File, accepted = ACCEPTED_IMAGE_TYPES): string | null {
  if (!accepted.includes(file.type)) return 'Please choose a JPG, PNG, WEBP, AVIF or GIF image.';
  if (file.size > MAX_IMAGE_BYTES) return `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB.`;
  return null;
}

/** Uploads an image to the public media bucket and returns its public URL. */
export async function uploadImage(file: File, folder: string, accepted = ACCEPTED_IMAGE_TYPES): Promise<string> {
  const problem = validateImageFile(file, accepted);
  if (problem) throw new Error(problem);

  const supabase = createClient();
  const ext = EXTENSIONS[file.type] || 'bin';
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder.replace(/^\/+|\/+$/g, '')}/${id}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw new Error('Image storage is not set up — run migration 011_media_storage.sql in Supabase.');
    }
    if (/row-level security|unauthorized|permission/i.test(error.message)) {
      throw new Error('Upload not permitted — sign in with an admin account.');
    }
    throw new Error(error.message);
  }
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

export function validateVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'Please choose an MP4 or WebM video.';
  if (file.size > MAX_VIDEO_BYTES) return `Video is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_VIDEO_BYTES / 1024 / 1024} MB.`;
  return null;
}

/**
 * Uploads a video to the hero-video bucket and returns its public URL. Unlike
 * uploadImage, this goes through XMLHttpRequest directly against the Storage
 * REST endpoint (same bucket/RLS the supabase-js client would hit) because the
 * supabase-js upload() call has no upload-progress event — videos are large
 * enough that real progress feedback matters, so onProgress reports genuine
 * bytes-sent percentages, not a fake/simulated bar.
 */
export async function uploadVideo(file: File, folder: string, onProgress?: (percent: number) => void): Promise<string> {
  const problem = validateVideoFile(file);
  if (problem) throw new Error(problem);

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Upload not permitted — sign in with an admin account.');

  const ext = VIDEO_EXTENSIONS[file.type] || 'mp4';
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder.replace(/^\/+|\/+$/g, '')}/${id}.${ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) throw new Error('Supabase is not configured.');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${HERO_VIDEO_BUCKET}/${path}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', publishableKey);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', '31536000');
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = `Upload failed (status ${xhr.status})`;
      if (xhr.status === 404) message = 'Video storage is not set up — run migration 041_hero_video_storage.sql in Supabase.';
      else if (xhr.status === 401 || xhr.status === 403) message = 'Upload not permitted — sign in with an admin account.';
      else {
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) message = body.message;
        } catch {
          // keep default message
        }
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });

  return supabase.storage.from(HERO_VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;
}
