"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { downloadCsv } from '@/lib/utils/csv';
import {
  EmptyState,
  LoadingState,
  MigrationNotice,
  PageHeader,
  Pagination,
  SecondaryButton,
  SelectFilter,
  TableCard,
  formatDateTime,
  friendlyDbError,
  isMissingTableError,
} from '@/components/admin/AdminUI';

interface AuditRow {
  id: string;
  admin_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const MIGRATION = '029_audit_logs.sql';
const PAGE_SIZE = 25;
const EXPORT_LIMIT = 5000;

const RESOURCE_OPTIONS = [
  { value: 'all', label: 'All records' },
  { value: 'product', label: 'Products' },
  { value: 'order', label: 'Orders' },
  { value: 'category', label: 'Categories' },
  { value: 'notification', label: 'Bulk emails' },
];

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'refund', label: 'Refunds' },
  { value: 'bulk_email', label: 'Bulk emails' },
];

const ACTION_STYLE: Record<string, string> = {
  create: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  update: 'bg-sky-50 border-sky-200 text-sky-800',
  delete: 'bg-red-50 border-red-200 text-red-700',
  refund: 'bg-amber-50 border-amber-200 text-amber-800',
  bulk_email: 'bg-violet-50 border-violet-200 text-violet-800',
};

const ACTION_LABEL: Record<string, string> = { create: 'Created', update: 'Updated', delete: 'Deleted', refund: 'Refund', bulk_email: 'Bulk email' };

const humanize = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** One-line, human description of what an entry did. */
function summarize(row: AuditRow): string {
  const d = row.details || {};
  const label = typeof d.label === 'string' && d.label ? `“${d.label}”` : row.resource_id ? `#${row.resource_id.slice(0, 8)}` : '';
  if (row.action === 'refund') {
    const amount = typeof d.amount === 'number' ? ` ₹${d.amount.toLocaleString('en-IN')}` : '';
    return `Refunded${amount} on order ${row.resource_id ? `#${row.resource_id.slice(0, 8)}` : ''}`.trim();
  }
  if (row.action === 'bulk_email') {
    return `Sent “${String(d.subject ?? '')}” to ${String(d.sent ?? 0)} ${d.audience === 'customers' ? 'customers' : 'subscribers'}`;
  }
  if (row.action === 'update') {
    const changes = (d.changes && typeof d.changes === 'object' ? d.changes : {}) as Record<string, { from?: string | null; to?: string | null }>;
    const parts = Object.entries(changes)
      .slice(0, 3)
      .map(([field, v]) => `${humanize(field)}: ${v.from ?? '—'} → ${v.to ?? '—'}`);
    const extra = Object.keys(changes).length - parts.length;
    const other = Array.isArray(d.other_fields_changed) ? (d.other_fields_changed as string[]).map(humanize) : [];
    const tail = [extra > 0 ? `+${extra} more` : '', other.length ? `also changed: ${other.join(', ')}` : ''].filter(Boolean).join('; ');
    return [`${humanize(row.resource_type)} ${label}`.trim(), [parts.join(' · '), tail].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
  }
  return `${humanize(row.resource_type)} ${label}`.trim();
}

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [admins, setAdmins] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  /** Filters and paging reload the list, so show the spinner as soon as one of them changes. */
  const changeView = (apply: () => void) => {
    setLoading(true);
    apply();
  };

  const adminName = useCallback((id: string | null) => (id ? admins[id] || 'Unknown admin' : 'System'), [admins]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const supabase = createClient();
        let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
        if (resourceFilter !== 'all') query = query.eq('resource_type', resourceFilter);
        if (actionFilter !== 'all') query = query.eq('action', actionFilter);
        const from = (page - 1) * PAGE_SIZE;
        const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const list = (data || []) as AuditRow[];
        setRows(list);
        setTotal(count ?? list.length);
        setMissingTable(false);

        const unknownIds = [...new Set(list.map((r) => r.admin_id).filter((id): id is string => !!id))];
        if (unknownIds.length) {
          const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', unknownIds);
          setAdmins((prev) => ({
            ...prev,
            ...Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || p.email])),
          }));
        }
        if (isRefresh) showToast('Activity refreshed', 'success');
      } catch (err) {
        if (isMissingTableError(err)) setMissingTable(true);
        else showToast(friendlyDbError(err, MIGRATION), 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resourceFilter, actionFilter, page, showToast]
  );

  // Fetching on mount and whenever the filters change; state is only set once the request returns
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      const supabase = createClient();
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(EXPORT_LIMIT);
      if (resourceFilter !== 'all') query = query.eq('resource_type', resourceFilter);
      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      const { data, error } = await query;
      if (error) throw error;
      const list = (data || []) as AuditRow[];
      downloadCsv(
        'audit-log',
        ['When', 'Admin', 'Action', 'Record type', 'Record ID', 'Summary', 'Details (JSON)'],
        list.map((r) => [new Date(r.created_at).toISOString(), adminName(r.admin_id), r.action, r.resource_type, r.resource_id, summarize(r), JSON.stringify(r.details ?? {})])
      );
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit Logs"
        subtitle="Who created, changed or deleted products, orders and categories — and who issued refunds or sent bulk emails."
        actions={
          <>
            <SecondaryButton icon="download" onClick={exportCsv} disabled={exporting || total === 0}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </SecondaryButton>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => load(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="flex flex-wrap items-center gap-3">
        <SelectFilter
          value={resourceFilter}
          onChange={(v) =>
            changeView(() => {
              setResourceFilter(v);
              setPage(1);
            })
          }
          options={RESOURCE_OPTIONS}
          ariaLabel="Filter by record type"
        />
        <SelectFilter
          value={actionFilter}
          onChange={(v) =>
            changeView(() => {
              setActionFilter(v);
              setPage(1);
            })
          }
          options={ACTION_OPTIONS}
          ariaLabel="Filter by action"
        />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading activity..." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="history"
            title="No activity recorded yet."
            hint={missingTable ? undefined : 'Changes made in the admin panel will appear here.'}
          />
        ) : (
          <>
            <div className="w-full overflow-x-auto custom-scroll">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">When</th>
                    <th className="py-3.5 px-4">Admin</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-5">What happened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {rows.map((r) => {
                    const open = expanded === r.id;
                    return (
                      <tr key={r.id} onClick={() => setExpanded(open ? null : r.id)} className="hover:bg-[#F5EEE7]/50 transition-colors cursor-pointer align-top">
                        <td className="py-3.5 px-5 text-[#2D2024]/70 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                        <td className="py-3.5 px-4 text-[#2D2024] break-all">{adminName(r.admin_id)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${ACTION_STYLE[r.action] || 'bg-slate-100 border-slate-300 text-slate-700'}`}>
                            {ACTION_LABEL[r.action] || humanize(r.action)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-[#2D2024]">
                          <div className="break-words">{summarize(r)}</div>
                          {open && (
                            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] p-3 text-xs text-[#2D2024]/80 whitespace-pre-wrap break-words">
                              {JSON.stringify({ id: r.resource_id, type: r.resource_type, ...(r.details || {}) }, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onChange={(p) => changeView(() => setPage(p))} noun="entries" />
          </>
        )}
      </TableCard>
    </div>
  );
}
