import { createClient } from '@/lib/supabase/client';

export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB
export const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateAvatarFile(file: File): string | null {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or WEBP image.';
  if (file.size > MAX_AVATAR_BYTES) return `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 3 MB.`;
  return null;
}

/** Uploads to avatars/{userId}/avatar.{ext} (upsert — always the same path, so old file is replaced),
 *  points `profiles.avatar_url` at it, and returns the new (cache-busted) public URL. */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const problem = validateAvatarFile(file);
  if (problem) throw new Error(problem);

  const supabase = createClient();
  const ext = EXTENSIONS[file.type] || 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    if (/bucket not found/i.test(uploadError.message)) {
      throw new Error('Photo storage is not set up yet — run migration 035_avatar_storage.sql in Supabase.');
    }
    if (/row-level security|unauthorized|permission/i.test(uploadError.message)) {
      throw new Error('Upload not permitted — please sign in again.');
    }
    throw new Error(uploadError.message);
  }

  // Cache-bust so an <img> already showing the old photo at this same URL refreshes immediately.
  const publicUrl = `${supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return publicUrl;
}

/** Deletes the stored photo (any extension) and clears `profiles.avatar_url`. */
export async function removeAvatar(userId: string): Promise<void> {
  const supabase = createClient();

  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from(AVATAR_BUCKET).remove(paths);
  }

  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
  if (error) throw new Error(error.message);
}
