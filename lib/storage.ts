import { createClient } from '@/lib/supabase/client';
import { isDemoAdminActive } from '@/lib/utils/adminDemoAccess';

export const MEDIA_BUCKET = 'store-media';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// SVG is deliberately excluded: an uploaded SVG can carry script and is served from a public URL
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
export const ACCEPTED_ICON_TYPES = [...ACCEPTED_IMAGE_TYPES, 'image/x-icon', 'image/vnd.microsoft.icon'];

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

  if (isDemoAdminActive()) {
    // For local demo testing, bypass Supabase entirely and return a local blob URL
    // This prevents RLS / missing bucket errors when testing the UI.
    return URL.createObjectURL(file);
  }

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
