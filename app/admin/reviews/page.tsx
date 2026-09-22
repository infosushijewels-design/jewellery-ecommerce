"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import {
  ConfirmDialog,
  Drawer,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  Field,
  FilterPills,
  IconButton,
  LoadingState,
  MigrationNotice,
  PageHeader,
  Pagination,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SelectFilter,
  StatTile,
  TableCard,
  formatDate,
  formatDateTime,
  friendlyDbError,
  getInitials,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

type Review = Database['public']['Tables']['product_reviews']['Row'];
type ReviewStatus = Review['status'];
type StatusTab = 'all' | ReviewStatus;
type ProductLite = { id: string; title: string; slug: string; image_url: string };

const MIGRATION = '009_engagement_and_content.sql';
const PAGE_SIZE = 10;

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: 'bg-amber-50 border-amber-200 text-amber-800',
  approved: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  rejected: 'bg-red-50 border-red-200 text-red-700',
};

const RATING_OPTIONS = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '★★★★★ 5' },
  { value: '4', label: '★★★★ 4' },
  { value: '3', label: '★★★ 3' },
  { value: '2', label: '★★ 2' },
  { value: '1', label: '★ 1' },
];

function Stars({ rating, size = 'text-base' }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`material-symbols-outlined ${size} ${n <= rating ? 'text-[#B99A62]' : 'text-[#E8D5C5]'}`}
          style={{ fontVariationSettings: `'FILL' ${n <= rating ? 1 : 0}` }}
        >
          star
        </span>
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Map<string, ProductLite>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const supabase = createClient();
    try {
      const [revRes, prodRes] = await Promise.all([
        supabase.from('product_reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, title, slug, image_url'),
      ]);
      if (revRes.error) throw revRes.error;
      setReviews(revRes.data || []);
      setProducts(new Map((prodRes.data || []).map((p) => [p.id, p])));
      setMissingTable(false);
      if (isRefresh) showToast('Reviews refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const stats = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'approved');
    const avg = approved.length ? approved.reduce((acc, r) => acc + r.rating, 0) / approved.length : 0;
    const counts: Record<string, number> = { all: reviews.length };
    reviews.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return { avg, counts };
  }, [reviews]);

  const ratingBreakdown = useMemo(() => {
    const approved = reviews.filter((r) => r.status === 'approved');
    return [5, 4, 3, 2, 1].map((n) => {
      const count = approved.filter((r) => r.rating === n).length;
      return { n, count, pct: approved.length ? (count / approved.length) * 100 : 0 };
    });
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter((r) => {
      const product = products.get(r.product_id);
      const matchesSearch =
        !q ||
        r.reviewer_name.toLowerCase().includes(q) ||
        (r.reviewer_email || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q) ||
        (product?.title || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesRating = ratingFilter === 'all' || r.rating === Number(ratingFilter);
      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [reviews, products, searchQuery, statusFilter, ratingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const selected = reviews.find((r) => r.id === selectedId) || null;

  function openReview(r: Review) {
    setSelectedId(r.id);
    setReplyDraft(r.admin_reply || '');
  }

  async function updateReview(r: Review, patch: Partial<Pick<Review, 'status' | 'admin_reply'>>, successMessage: string) {
    setBusyId(r.id);
    try {
      const { data, error } = await createClient().from('product_reviews').update(patch).eq('id', r.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
      showToast(successMessage, 'success');
      return true;
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await createClient().from('product_reviews').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      showToast('Review deleted', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const selectedProduct = selected ? products.get(selected.product_id) : undefined;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Engagement"
        title="Reviews & Ratings"
        subtitle="Moderate customer reviews before they appear on product pages."
        actions={
          <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadReviews(true)} disabled={refreshing || loading}>
            Refresh
          </SecondaryButton>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-5">
          <StatTile icon="reviews" value={reviews.length} label="Total Reviews" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
          <StatTile icon="star" value={stats.avg ? stats.avg.toFixed(1) : '—'} label="Average Rating (approved)" tone="bg-amber-100 text-amber-700" />
          <StatTile icon="pending_actions" value={stats.counts.pending || 0} label="Awaiting Moderation" tone="bg-sky-100 text-sky-700" />
          <StatTile icon="verified" value={stats.counts.approved || 0} label="Published" tone="bg-emerald-100 text-emerald-700" />
        </div>
        <div className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-5 shadow-[0_2px_10px_rgba(45,32,36,0.05)]">
          <p className="text-[11px] uppercase tracking-wider text-[#2D2024]/55 font-semibold mb-3">Rating Breakdown</p>
          <ul className="space-y-2">
            {ratingBreakdown.map(({ n, count, pct }) => (
              <li key={n} className="flex items-center gap-2.5 text-xs">
                <span className="w-6 text-[#2D2024]/70 tabular-nums">{n}★</span>
                <div className="flex-1 h-2 rounded-full bg-[#E8D5C5]/60 overflow-hidden">
                  <div className="h-full rounded-full bg-[#B99A62]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-[#2D2024]/60 tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search reviewer, product or text..."
          />
          <SelectFilter
            value={ratingFilter}
            onChange={(v) => {
              setRatingFilter(v);
              setPage(1);
            }}
            options={RATING_OPTIONS}
            ariaLabel="Filter by rating"
          />
        </div>
        <FilterPills
          tabs={STATUS_TABS}
          active={statusFilter}
          counts={stats.counts}
          onChange={(k) => {
            setStatusFilter(k);
            setPage(1);
          }}
        />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading reviews..." />
        ) : reviews.length === 0 ? (
          <EmptyState icon="rate_review" title="No reviews yet." hint={missingTable ? undefined : 'Customer reviews will appear here for moderation.'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No reviews match your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Product</th>
                    <th className="py-3.5 px-4">Reviewer</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4">Review</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((r) => {
                    const product = products.get(r.product_id);
                    return (
                      <tr key={r.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0">
                              {product?.image_url ? (
                                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#B99A62]">
                                  <span className="material-symbols-outlined">diamond</span>
                                </div>
                              )}
                            </div>
                            <span className="text-[#2D2024] font-medium truncate max-w-[180px]">{product?.title || 'Deleted product'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[#2D2024] font-medium truncate max-w-[160px]">{r.reviewer_name}</div>
                          <div className="text-xs text-[#2D2024]/55 truncate max-w-[160px]">{r.reviewer_email || (r.user_id ? 'Registered' : 'Guest')}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap"><Stars rating={r.rating} size="text-[16px]" /></td>
                        <td className="py-3.5 px-4 max-w-[280px]">
                          {r.title && <p className="text-[#2D2024] font-medium truncate">{r.title}</p>}
                          <p className="text-xs text-[#2D2024]/60 line-clamp-2">{r.comment || '—'}</p>
                          {r.admin_reply && (
                            <p className="text-[11px] text-[#8A6F3C] mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">reply</span>Replied
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {r.status !== 'approved' && (
                              <IconButton icon="check_circle" title="Approve" tone="whatsapp" onClick={() => busyId || updateReview(r, { status: 'approved' }, 'Review approved and published')} />
                            )}
                            {r.status !== 'rejected' && (
                              <IconButton icon="block" title="Reject" onClick={() => busyId || updateReview(r, { status: 'rejected' }, 'Review rejected')} />
                            )}
                            <IconButton icon="reply" title="View & reply" onClick={() => openReview(r)} />
                            <IconButton icon="delete" title="Delete review" tone="danger" onClick={() => setDeleteTarget(r)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} noun="reviews" />
          </>
        )}
      </TableCard>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} widthClass="max-w-lg">
        {selected && (
          <div className="flex flex-col min-h-full">
            <DrawerHeader eyebrow="Review" title={selectedProduct?.title || 'Product review'} onClose={() => setSelectedId(null)} />
            <div className="p-6 space-y-4 flex-1">
              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {getInitials(selected.reviewer_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2D2024] truncate">{selected.reviewer_name}</p>
                      <p className="text-xs text-[#2D2024]/55 truncate">{selected.reviewer_email || '—'}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize flex-shrink-0 ${STATUS_STYLES[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Stars rating={selected.rating} />
                  <span className="text-xs text-[#2D2024]/55">{formatDateTime(selected.created_at)}</span>
                </div>
                {selected.title && <p className="font-medium text-[#2D2024]">{selected.title}</p>}
                <p className="text-sm text-[#2D2024]/80 whitespace-pre-line">{selected.comment || 'No written comment.'}</p>
                {selectedProduct && (
                  <a
                    href={`/product/${selectedProduct.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#8A6F3C] hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    View product
                  </a>
                )}
              </section>

              <Field label="Public reply from Sushi Jewels" htmlFor="rev-reply" hint="Shown under the review once it is approved.">
                <textarea
                  id="rev-reply"
                  rows={4}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Thank you for your kind words..."
                />
              </Field>
            </div>
            <DrawerFooter>
              {selected.status !== 'rejected' && (
                <SecondaryButton
                  icon="block"
                  disabled={busyId === selected.id}
                  onClick={() => updateReview(selected, { status: 'rejected', admin_reply: replyDraft.trim() || null }, 'Review rejected')}
                >
                  Reject
                </SecondaryButton>
              )}
              <PrimaryButton
                icon="check"
                disabled={busyId === selected.id}
                onClick={async () => {
                  const ok = await updateReview(
                    selected,
                    { status: 'approved', admin_reply: replyDraft.trim() || null },
                    selected.status === 'approved' ? 'Reply saved' : 'Review approved and published'
                  );
                  if (ok) setSelectedId(null);
                }}
              >
                {selected.status === 'approved' ? 'Save Reply' : 'Approve & Publish'}
              </PrimaryButton>
            </DrawerFooter>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete review?"
        message={<>The review by <strong>{deleteTarget?.reviewer_name}</strong> will be permanently removed.</>}
        confirmLabel="Yes, Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
