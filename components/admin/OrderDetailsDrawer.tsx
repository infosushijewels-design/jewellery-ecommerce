"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { FullOrder } from '@/lib/supabase/orderService';
import { printOrderInvoice } from '@/lib/utils/printInvoice';
import { useToast } from '@/lib/context/ToastContext';
import { CHEVRON_BG, Drawer, formatDateTime, formatINR, getInitials } from './AdminUI';

type OrderStatus = FullOrder['status'];

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'placed', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  placed: 'bg-amber-50 border-amber-200 text-amber-800',
  processing: 'bg-sky-50 border-sky-200 text-sky-800',
  shipped: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  delivered: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
};

export function orderStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

export function paymentLabel(method?: string) {
  return method === 'cod' ? 'Cash on Delivery' : method === 'online' ? 'Online' : method || '—';
}



const TIMELINE: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered'];

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

export default function OrderDetailsDrawer({
  order,
  onClose,
  onStatusChange,
  updating,
}: {
  order: FullOrder | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  updating: boolean;
}) {
  const { showToast } = useToast();
  if (!order) return null;

  const addr = order.shipping_address;

  const currentStep = TIMELINE.indexOf(order.status);
  const itemsSubtotal = (order.items || []).reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);
  const subtotal = Number(order.subtotal) || itemsSubtotal;
  const shipping = Number(order.shipping_fee) || 0;
  const tax = Number(order.tax) || 0;
  const discount = Math.max(0, subtotal + shipping + tax - Number(order.total));

  const handlePrint = () => {
    if (!printOrderInvoice(order)) showToast('Allow pop-ups to print the invoice', 'error');
  };

  return (
    <Drawer open onClose={onClose}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFFCF7]/95 backdrop-blur-sm border-b border-[#E8D5C5] px-6 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[11px] uppercase tracking-widest text-[#8A6F3C] font-semibold">Order Details</span>
          <h3 className="font-headline-sm text-xl text-[#2D2024] truncate">#{order.order_number}</h3>
          <p className="text-xs text-[#2D2024]/55 mt-0.5">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ORDER_STATUS_STYLES[order.status]}`}>
            {orderStatusLabel(order.status)}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Status control + timeline */}
        <Section title="Order Status" icon="timeline">
          {order.status === 'cancelled' ? (
            <p className="text-sm text-red-700 mb-3">This order has been cancelled.</p>
          ) : (
            <ol className="flex items-center mb-4">
              {TIMELINE.map((step, i) => {
                const done = i <= currentStep;
                return (
                  <li key={step} className="flex-1 flex items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                          done ? 'bg-[#B99A62] border-[#B99A62] text-white' : 'bg-white border-[#E8D5C5] text-[#2D2024]/40'
                        }`}
                      >
                        {done ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                      </span>
                      <span className={`text-[10px] ${done ? 'text-[#2D2024]' : 'text-[#2D2024]/45'}`}>{orderStatusLabel(step)}</span>
                    </div>
                    {i < TIMELINE.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-[#B99A62]' : 'bg-[#E8D5C5]'}`} />
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          <div className="flex items-center gap-3">
            <label htmlFor="drawer-status" className="text-xs text-[#2D2024]/60">Update status</label>
            <select
              id="drawer-status"
              value={order.status}
              disabled={updating}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className={`rounded-full min-w-[150px] pl-3.5 pr-8 py-1.5 text-xs font-semibold border focus:outline-none cursor-pointer appearance-none disabled:opacity-60 ${ORDER_STATUS_STYLES[order.status]}`}
              style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </Section>

        {/* Customer */}
        <Section title="Customer Info" icon="person">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {getInitials(addr?.full_name)}
            </div>
            <div className="min-w-0 text-sm space-y-0.5">
              {addr?.email ? (
                <Link
                  href={`/admin/customers?q=${encodeURIComponent(addr.email)}&open=1`}
                  className="font-semibold text-[#2D2024] hover:text-[#8A6F3C] inline-flex items-center gap-1"
                  title="Open full customer profile"
                >
                  {addr?.full_name || 'Guest'}
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </Link>
              ) : (
                <p className="font-semibold text-[#2D2024]">{addr?.full_name || 'Guest'}</p>
              )}
              {addr?.email && (
                <Link
                  href={`/admin/customers?q=${encodeURIComponent(addr.email)}&open=1`}
                  className="block text-[#2D2024]/70 hover:text-[#8A6F3C] truncate"
                  title="Open full customer profile"
                >
                  {addr.email}
                </Link>
              )}
              {addr?.phone && (
                <a href={`tel:${addr.phone}`} className="block text-[#2D2024]/70 hover:text-[#8A6F3C]">{addr.phone}</a>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E8D5C5]/70 text-sm">
            <p className="text-[11px] uppercase tracking-wider text-[#2D2024]/50 mb-1">Shipping Address</p>
            <p className="text-[#2D2024]/80">{addr?.address}</p>
            <p className="text-[#2D2024]/80">
              {addr?.city}, {addr?.state} - {addr?.pincode}
            </p>
          </div>
        </Section>

        {/* Items */}
        <Section title={`Items Ordered (${order.items?.length || 0})`} icon="diamond">
          <div className="space-y-3">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#B99A62]">
                      <span className="material-symbols-outlined">diamond</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D2024] truncate">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {item.metal && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5EEE7] border border-[#E8D5C5] text-[#2D2024]/75">{item.metal}</span>
                    )}
                    {item.size && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5EEE7] border border-[#E8D5C5] text-[#2D2024]/75">Size {item.size}</span>
                    )}
                    <span className="text-[11px] text-[#2D2024]/55">
                      {formatINR(item.price)} × {item.quantity}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#2D2024] whitespace-nowrap">
                  {formatINR(Number(item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Payment */}
        <Section title="Payment Summary" icon="receipt_long">
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-[#2D2024]/65">Subtotal</dt>
              <dd className="text-[#2D2024]">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#2D2024]/65">Shipping</dt>
              <dd className={shipping > 0 ? 'text-[#2D2024]' : 'text-emerald-700 font-medium'}>{shipping > 0 ? formatINR(shipping) : 'Free'}</dd>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#2D2024]/65">Tax</dt>
                <dd className="text-[#2D2024]">{formatINR(tax)}</dd>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#2D2024]/65">Discount</dt>
                <dd className="text-red-600">−{formatINR(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-1 border-t border-[#E8D5C5] text-base">
              <dt className="font-semibold text-[#2D2024]">Total</dt>
              <dd className="font-semibold text-[#2D2024]">{formatINR(order.total)}</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8D5C5]/70 text-xs">
            <span className="text-[#2D2024]/65">{paymentLabel(order.payment_method)}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full border font-semibold capitalize ${
                order.payment_status === 'paid'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : order.payment_status === 'failed'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {order.payment_status}
            </span>
          </div>
        </Section>

        {order.notes && (
          <Section title="Customer Note" icon="sticky_note_2">
            <p className="text-sm text-[#2D2024]/80 whitespace-pre-line">{order.notes}</p>
          </Section>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print Invoice
          </button>

          {addr?.email && (
            <a
              href={`mailto:${addr.email}?subject=${encodeURIComponent(`Your Sushi Jewels order #${order.order_number}`)}`}
              className="flex items-center justify-center gap-2 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              Email
            </a>
          )}
          <Link
            href={`/orders/${order.id}`}
            target="_blank"
            className="flex items-center justify-center gap-2 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Tracking Page
          </Link>
        </div>
      </div>
    </Drawer>
  );
}
