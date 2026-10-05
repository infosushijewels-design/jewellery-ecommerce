"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import {
  BULK_AUDIENCE_LABELS,
  BULK_CHUNK_SIZE,
  BULK_MESSAGE_MAX,
  BULK_SUBJECT_MAX,
  renderBulkEmail,
  validateBulkEmail,
  type BulkAudience,
} from '@/lib/bulkEmail';
import { ConfirmDialog, Field, PageHeader, PrimaryButton, SecondaryButton, SelectFilter, TableCard, inputClass } from '@/components/admin/AdminUI';

type ApiResult = { success: boolean; error?: string; total?: number; sent?: number; done?: boolean; sentTo?: string };

async function callApi(payload: Record<string, unknown>): Promise<ApiResult> {
  try {
    const res = await fetch('/api/admin/send-bulk-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = (await res.json().catch(() => null)) as ApiResult | null;
    return body ?? { success: false, error: 'Unexpected response from the server.' };
  } catch {
    return { success: false, error: 'Could not reach the server. Check your connection and try again.' };
  }
}

export default function AdminNotificationsPage() {
  const { showToast } = useToast();
  const [audience, setAudience] = useState<BulkAudience>('subscribers');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [result, setResult] = useState<{ sent: number; total: number; error?: string } | null>(null);

  const loadCount = useCallback(async () => {
    const res = await callApi({ action: 'count', audience });
    setRecipientCount(res.success ? (res.total ?? 0) : null);
  }, [audience]);

  // Fetching on mount and whenever the filters change; state is only set once the request returns
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCount();
  }, [loadCount]);

  const check = validateBulkEmail(subject, message);
  const previewHtml = useMemo(
    () =>
      renderBulkEmail({
        subject: subject.trim() || 'Your subject line',
        message: message.trim() || 'Your message will appear here.',
        brand: { storeName: 'Sushi Jewels', storeUrl: '#', supportEmail: 'support@sushijewels.com' },
        audience,
      }).html,
    [subject, message, audience]
  );

  async function sendTest() {
    if (!check.ok) return showToast(check.error, 'warning');
    setTesting(true);
    const res = await callApi({ action: 'test', audience, subject, message });
    setTesting(false);
    if (res.success) showToast(`Test email sent to ${res.sentTo}`, 'success');
    else showToast(res.error || 'Could not send the test email.', 'error');
  }

  async function sendAll() {
    if (!check.ok) return;
    setSending(true);
    setResult(null);
    let sent = 0;
    let total = recipientCount ?? 0;
    let error: string | undefined;
    for (let chunk = 0; ; chunk++) {
      const res = await callApi({ action: 'send', audience, subject, message, chunk });
      if (!res.success) {
        error = res.error || 'Sending stopped unexpectedly.';
        break;
      }
      sent += res.sent ?? 0;
      total = res.total ?? total;
      setProgress({ sent, total });
      if (res.done) break;
    }
    setSending(false);
    setConfirmOpen(false);
    setProgress(null);
    setResult({ sent, total, error });
    if (error) showToast(error, 'error');
    else {
      showToast(`Email sent to ${sent} ${sent === 1 ? 'person' : 'people'}`, 'success');
      setSubject('');
      setMessage('');
    }
  }

  const canSend = check.ok && (recipientCount ?? 0) > 0 && !sending;
  const batches = recipientCount ? Math.ceil(recipientCount / BULK_CHUNK_SIZE) : 0;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Email Notifications"
        subtitle="Send an announcement, offer or update to your subscribers or customers."
      />

      <TableCard>
        <div className="p-5 sm:p-7 space-y-5">
          <Field
            label="Send to"
            hint={
              audience === 'customers'
                ? 'Every registered customer account — only use this for important updates customers expect from you.'
                : 'People who signed up through the website footer and are still subscribed.'
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              <SelectFilter
                value={audience}
                onChange={(v) => {
                  setRecipientCount(null);
                  setAudience(v as BulkAudience);
                }}
                ariaLabel="Who should receive this email"
                options={(Object.keys(BULK_AUDIENCE_LABELS) as BulkAudience[]).map((key) => ({ value: key, label: BULK_AUDIENCE_LABELS[key] }))}
              />
              <span className="text-sm text-[#2D2024]/70">{recipientCount === null ? 'Counting…' : `${recipientCount} ${recipientCount === 1 ? 'recipient' : 'recipients'}`}</span>
            </div>
          </Field>

          <Field label="Subject" htmlFor="bulk-subject">
            <input id="bulk-subject" className={inputClass} value={subject} maxLength={BULK_SUBJECT_MAX} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Our Festive Collection is here" />
          </Field>

          <Field label="Message" htmlFor="bulk-message" hint="Leave a blank line between paragraphs. Web addresses (https://…) become links automatically.">
            <textarea
              id="bulk-message"
              className={`${inputClass} min-h-[220px] resize-y leading-relaxed`}
              value={message}
              maxLength={BULK_MESSAGE_MAX}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={'Dear customer,\n\nWrite your announcement here…'}
            />
            <div className="text-[11px] text-[#2D2024]/45 mt-1 text-right tabular-nums">
              {message.length} / {BULK_MESSAGE_MAX}
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <SecondaryButton icon={showPreview ? 'visibility_off' : 'visibility'} onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? 'Hide preview' : 'Preview'}
            </SecondaryButton>
            <SecondaryButton icon="forward_to_inbox" onClick={sendTest} disabled={testing || !check.ok}>
              {testing ? 'Sending test…' : 'Send test to me'}
            </SecondaryButton>
            <div className="sm:ml-auto">
              <PrimaryButton icon="send" onClick={() => setConfirmOpen(true)} disabled={!canSend}>
                Send to {recipientCount ?? '…'}
              </PrimaryButton>
            </div>
          </div>
          {!check.ok && (subject || message) && <p className="text-xs text-[#2D2024]/55">{check.error}</p>}
        </div>
      </TableCard>

      {showPreview && (
        <TableCard>
          <iframe title="Email preview" sandbox="" srcDoc={previewHtml} className="w-full h-[640px] bg-white rounded-xl" />
        </TableCard>
      )}

      {result && (
        <div className={`rounded-xl border px-5 py-4 text-sm ${result.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {result.error
            ? `Sending stopped after ${result.sent} of ${result.total}. ${result.error} Do not resend the whole list — the first ${result.sent} people already received it.`
            : `Done — sent to ${result.sent} ${result.sent === 1 ? 'person' : 'people'}.`}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Send this email?"
        icon="send"
        busyLabel={progress ? `Sending ${progress.sent} / ${progress.total}…` : 'Sending…'}
        message={
          <>
            “<strong>{subject.trim()}</strong>” will be emailed to <strong>{recipientCount}</strong> {BULK_AUDIENCE_LABELS[audience].toLowerCase()} in {batches} {batches === 1 ? 'batch' : 'batches'}.
            This cannot be undone.
          </>
        }
        confirmLabel="Yes, Send"
        busy={sending}
        onConfirm={sendAll}
        onCancel={() => !sending && setConfirmOpen(false)}
      />
    </div>
  );
}
