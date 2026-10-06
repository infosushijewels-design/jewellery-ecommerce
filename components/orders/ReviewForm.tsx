"use client";

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useCaptchaPost } from '@/components/ui/TurnstileChallenge';
import { useToast } from '@/lib/context/ToastContext';

// userId is still accepted so existing callers keep working, but the server takes the customer from their session
type Props = { productId: string; productTitle: string; userId?: string | null; reviewerName: string; reviewerEmail?: string | null };

export default function ReviewForm({ productId, productTitle, reviewerName, reviewerEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [website, setWebsite] = useState(''); // hidden bot trap — real customers never see or fill it
  const [startedAt, setStartedAt] = useState(() => Date.now()); // when the form was opened (an "instant" submit is a bot)
  const { showToast } = useToast();
  const { postJson, challenge } = useCaptchaPost();

  const openForm = () => {
    setStartedAt(Date.now());
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (comment.trim().length < 10) return showToast('Please write at least 10 characters about your experience.', 'warning');
    setSaving(true);
    // The review goes through the server (bot checks + per-visitor limit); only a visitor over that limit is ever asked to tick a check
    const { ok, json, dismissed } = await postJson('/api/reviews', {
      productId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      reviewerName: reviewerName || 'Verified customer',
      reviewerEmail: reviewerEmail || '',
      website,
      startedAt,
    });
    setSaving(false);
    if (dismissed) return;
    if (!ok || !json?.success) return showToast(json?.error || 'Could not submit your review. Please try again.', 'error');
    setOpen(false);
    setTitle('');
    setComment('');
    showToast('Thank you! Your review has been sent for approval.', 'success');
  };

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-secondary/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-secondary hover:bg-secondary-container/25"
      >
        <span className="material-symbols-outlined text-[15px]">rate_review</span> Write a review
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Review your purchase">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Delivered item</p>
            <p className="mt-1 font-semibold text-primary">{productTitle}</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Your rating</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="text-3xl text-[#E0A526]" aria-label={`${star} stars`} aria-pressed={rating === star}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${star <= rating ? 1 : 0}` }}>
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium text-primary">
            Title{' '}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="What did you love?"
              className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-primary">
            Your review *{' '}
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="Tell us about the design, quality, and experience…"
              className="mt-1.5 w-full resize-none rounded-lg border border-outline-variant bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          {/* Bot trap: invisible to people (and to screen readers / keyboard), but bots fill every field. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" />
          <p className="text-xs text-on-surface-variant">Your review will be published after approval.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-surface disabled:opacity-50">
              {saving ? 'Sending…' : 'Submit review'}
            </button>
          </div>
        </form>
      </Modal>
      {challenge}
    </>
  );
}
