"use client";

import { useState, type ReactNode } from 'react';
import type { FullOrder } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { ConfirmDialog, Field, formatINR, inputClass } from './AdminUI';

export interface RefundOutcome {
  orderId: string;
  paymentStatus: 'refunded' | 'partially_refunded';
  refundedAmount: number;
}

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-[#E8D5C5] rounded-xl p-4">
      <h4 className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#2D2024]/55 font-semibold mb-3">
        <span className="material-symbols-outlined text-base text-[#8A6F3C]">{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}

/** Whether this order can be refunded through Razorpay from the admin panel. */
export function canRefund(order: FullOrder): boolean {
  const refundable = (Number(order.total) || 0) - (Number(order.refunded_amount) || 0);
  return (
    order.payment_method === 'online' &&
    !!order.razorpay_payment_id &&
    (order.payment_status === 'paid' || order.payment_status === 'partially_refunded') &&
    refundable > 0.001
  );
}

/**
 * Refund (full or partial) an order that was paid online. The server checks the admin's permission and asks
 * Razorpay to return the money; the order then shows "Partly refunded" or "Refunded". Render it with
 * key={order.id + order.refunded_amount} so its fields reset after each refund.
 */
export default function RefundSection({ order, onRefunded }: { order: FullOrder; onRefunded?: (outcome: RefundOutcome) => void }) {
  const { showToast } = useToast();
  const total = Number(order.total) || 0;
  const refunded = Number(order.refunded_amount) || 0;
  const refundable = Math.max(0, Math.round((total - refunded) * 100) / 100);

  const [amount, setAmount] = useState(String(refundable));
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const value = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(value) && value > 0 && value <= refundable + 0.001;
  const isFull = valid && Math.abs(value - refundable) < 0.005 && refunded === 0;

  async function submit() {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, amount: value, reason: reason.trim() || undefined }),
      });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        order?: { paymentStatus: 'refunded' | 'partially_refunded'; refundedAmount: number };
      } | null;
      if (!response.ok || !body?.success || !body.order) {
        showToast(body?.error || 'The refund could not be made.', 'error');
        return;
      }
      showToast(`Refunded ${formatINR(value)} to the customer through Razorpay.`, 'success');
      setConfirming(false);
      onRefunded?.({ orderId: order.id, paymentStatus: body.order.paymentStatus, refundedAmount: body.order.refundedAmount });
    } catch (err) {
      console.error('Refund request failed:', err);
      showToast('The refund could not be made. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Section title="Refund" icon="undo">
        <dl className="text-sm space-y-1.5 mb-4">
          <div className="flex justify-between">
            <dt className="text-[#2D2024]/65">Paid online</dt>
            <dd className="text-[#2D2024]">{formatINR(total)}</dd>
          </div>
          {refunded > 0 && (
            <div className="flex justify-between">
              <dt className="text-[#2D2024]/65">Already refunded</dt>
              <dd className="text-red-600">−{formatINR(refunded)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1.5 border-t border-[#E8D5C5]/70">
            <dt className="font-semibold text-[#2D2024]">Can still be refunded</dt>
            <dd className="font-semibold text-[#2D2024]">{formatINR(refundable)}</dd>
          </div>
        </dl>

        <div className="space-y-3">
          <Field label="Refund amount (₹)" htmlFor={`refund-amount-${order.id}`} hint="Leave the full amount for a complete refund, or enter a smaller one for a partial refund.">
            <input
              id={`refund-amount-${order.id}`}
              type="number"
              inputMode="decimal"
              min={0}
              max={refundable}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Reason (optional)" htmlFor={`refund-reason-${order.id}`}>
            <input
              id={`refund-reason-${order.id}`}
              type="text"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer returned the item"
              className={inputClass}
            />
          </Field>
          {!valid && amount.trim() !== '' && (
            <p className="text-xs text-red-600">Enter an amount between ₹0.01 and {formatINR(refundable)}.</p>
          )}
          <button
            type="button"
            disabled={!valid || busy}
            onClick={() => setConfirming(true)}
            className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">undo</span>
            {valid ? `Refund ${formatINR(value)}` : 'Refund payment'}
          </button>
        </div>
      </Section>

      <ConfirmDialog
        open={confirming}
        icon="undo"
        busyLabel="Refunding…"
        title={isFull ? 'Refund the full payment?' : 'Refund this amount?'}
        message={
          <>
            <strong>{formatINR(value)}</strong> will be returned to the customer through Razorpay for order{' '}
            <strong>{order.order_number}</strong>. This cannot be undone.
          </>
        }
        confirmLabel="Yes, Refund"
        busy={busy}
        onConfirm={submit}
        onCancel={() => !busy && setConfirming(false)}
      />
    </>
  );
}
