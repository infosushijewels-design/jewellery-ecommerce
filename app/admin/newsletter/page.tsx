"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import {
  ConfirmDialog,
  EmptyState,
  IconButton,
  LoadingState,
  MigrationNotice,
  PageHeader,
  Pagination,
  SearchInput,
  SecondaryButton,
  StatTile,
  TableCard,
  formatDateTime,
  friendlyDbError,
  isMissingTableError,
} from '@/components/admin/AdminUI';

interface Subscriber {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  source: string;
  created_at: string;
}

const MIGRATION = '027_contact_newsletter.sql';
const PAGE_SIZE = 15;

/** A spreadsheet treats a cell starting with = + - @ as a formula; a leading quote keeps it plain text. */
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function AdminNewsletterPage() {
  const { showToast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSubscribers();
  }, []);

  async function loadSubscribers(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient()
        .from('newsletter_subscribers')
        .select('id, email, status, source, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      setSubscribers((data || []) as Subscriber[]);
      setMissingTable(false);
      if (isRefresh) showToast('Subscribers refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? subscribers.filter((s) => s.email.includes(q)) : subscribers;
  }, [subscribers, searchQuery]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: subscribers.length,
      active: subscribers.filter((s) => s.status === 'subscribed').length,
      lastWeek: subscribers.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length,
    };
  }, [subscribers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function exportCsv() {
    const rows = [['Email', 'Status', 'Source', 'Subscribed on'], ...filtered.map((s) => [s.email, s.status, s.source, new Date(s.created_at).toISOString()])];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await createClient().from('newsletter_subscribers').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setSubscribers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showToast('Subscriber removed', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Newsletter"
        subtitle="Email addresses collected by the “Join the Inner Circle” form on the website."
        actions={
          <>
            <SecondaryButton icon="download" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </SecondaryButton>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadSubscribers(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        <StatTile icon="groups" value={stats.total} label="Subscribers" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="mark_email_read" value={stats.active} label="Active" tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="trending_up" value={stats.lastWeek} label="New in 7 days" tone="bg-sky-100 text-sky-700" />
      </div>

      <SearchInput
        value={searchQuery}
        onChange={(v) => {
          setSearchQuery(v);
          setPage(1);
        }}
        placeholder="Search email address..."
      />

      <TableCard>
        {loading ? (
          <LoadingState label="Loading subscribers..." />
        ) : subscribers.length === 0 ? (
          <EmptyState icon="mail" title="No subscribers yet." hint={missingTable ? undefined : 'Sign-ups from the website footer will appear here.'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No subscribers match your search." />
        ) : (
          <>
            <div className="w-full overflow-x-auto custom-scroll">
              <table className="w-full text-left text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Subscribed</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                      <td className="py-3.5 px-5 text-[#2D2024] break-all">{s.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${
                            s.status === 'subscribed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {s.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDateTime(s.created_at)}</td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5">
                          <IconButton icon="mail" title="Email this subscriber" href={`mailto:${s.email}`} />
                          <IconButton icon="delete" title="Remove subscriber" tone="danger" onClick={() => setDeleteTarget(s)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} noun="subscribers" />
          </>
        )}
      </TableCard>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove subscriber?"
        message={<><strong>{deleteTarget?.email}</strong> will be removed from the list.</>}
        confirmLabel="Yes, Remove"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
