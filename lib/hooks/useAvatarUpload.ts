"use client";

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { uploadAvatar, removeAvatar } from '@/lib/avatarStorage';

/** File-picking, upload and remove logic for a profile photo control. Each call site
 *  (sidebar badge, Personal Info card) gets its own hidden <input> and loading state. */
export function useAvatarUpload() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file || !user) return;

    setIsUploading(true);
    try {
      await uploadAvatar(file, user.id);
      await refreshProfile();
      showToast('✨ Profile photo updated successfully!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not upload your photo. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user || isUploading) return;
    setIsUploading(true);
    try {
      await removeAvatar(user.id);
      await refreshProfile();
      showToast('Profile photo removed.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not remove your photo. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    inputRef,
    openPicker,
    handleFileSelected,
    handleRemove,
    isUploading,
    avatarUrl: profile?.avatar_url ?? null,
    fullName: profile?.full_name ?? null,
  };
}
