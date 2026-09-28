"use client";

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';

type Props = { productId: string; productTitle: string; userId?: string | null; reviewerName: string; reviewerEmail?: string | null };

export default function ReviewForm({ productId, productTitle, userId, reviewerName, reviewerEmail }: Props) {
  const [open, setOpen] = useState(false); const [rating, setRating] = useState(5); const [title, setTitle] = useState(''); const [comment, setComment] = useState(''); const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 10) return showToast('Please write at least 10 characters about your experience.', 'warning');
    setSaving(true);
    const { error } = await createClient().from('product_reviews').insert({ product_id: productId, user_id: userId || null, reviewer_name: reviewerName || 'Verified customer', reviewer_email: reviewerEmail || null, rating, title: title.trim() || null, comment: comment.trim(), status: 'pending' });
    setSaving(false);
    if (error) return showToast(error.message.includes('does not exist') ? 'Reviews are not enabled yet. Please contact us.' : 'Could not submit your review. Please try again.', 'error');
    setOpen(false); setTitle(''); setComment(''); showToast('Thank you! Your review has been sent for approval.', 'success');
  };
  return <><button type="button" onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-secondary/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-secondary hover:bg-secondary-container/25"><span className="material-symbols-outlined text-[15px]">rate_review</span> Write a review</button><Modal isOpen={open} onClose={() => setOpen(false)} title="Review your purchase"><form onSubmit={submit} className="space-y-5"><div><p className="text-xs uppercase tracking-wider text-on-surface-variant">Delivered item</p><p className="mt-1 font-semibold text-primary">{productTitle}</p></div><div><p className="mb-2 text-sm font-medium text-primary">Your rating</p><div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} className="text-3xl text-[#E0A526]" aria-label={`${star} stars`} aria-pressed={rating === star}><span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}` }}>star</span></button>)}</div></div><label className="block text-sm font-medium text-primary">Title <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="What did you love?" className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" /></label><label className="block text-sm font-medium text-primary">Your review * <textarea required value={comment} onChange={(e) => setComment(e.target.value)} minLength={10} rows={4} placeholder="Tell us about the design, quality, and experience…" className="mt-1.5 w-full resize-none rounded-lg border border-outline-variant bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none" /></label><p className="text-xs text-on-surface-variant">Your review will be published after approval.</p><div className="flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant">Cancel</button><button type="submit" disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-surface disabled:opacity-50">{saving ? 'Sending…' : 'Submit review'}</button></div></form></Modal></>;
}
