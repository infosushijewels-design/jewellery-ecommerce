import { redirect } from 'next/navigation';

/**
 * Payments live inside Orders now — one screen for fulfilment and reconciliation.
 * Kept as a redirect so old links and bookmarks keep working.
 */
export default function AdminPaymentsRedirect() {
  redirect('/admin/orders');
}
