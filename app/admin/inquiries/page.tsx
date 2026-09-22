"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import {
  CHEVRON_BG,
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
  formatDateTime,
  friendlyDbError,
  getInitials,
  inputClass,
  isMissingTableError,
  whatsappLink,
} from '@/components/admin/AdminUI';

type Inquiry = Database['public']['Tables']['contact_inquiries']['Row'];
type InquiryStatus = Inquiry['status'];
type StatusTab = 'all' | InquiryStatus;

const MIGRATION = '009_engagement_and_content.sql';
const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  ...STATUS_OPTIONS.map((o) => ({ key: o.value as StatusTab, label: o.label })),
];

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-sky-50 border-sky-200 text-sky-800',
  in_progress: 'bg-amber-50 border-amber-200 text-amber-800',
  resolved: 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

export default function AdminInquiriesPage() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient().from('contact_inquiries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setInquiries(data || []);
      setMissingTable(false);
      if (isRefresh) showToast('Inquiries refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: inquiries.length };
    inquiries.forEach((i) => {
      map[i.status] = (map[i.status] || 0) + 1;
    });
    return map;
  }, [inquiries]);

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(inquiries.map((i) => i.category).filter((c): c is string => !!c))).sort();
    return [{ value: 'all', label: 'All topics' }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [inquiries]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries.filter((i) => {
      const matchesSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        (i.phone || '').includes(q) ||
        i.message.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [inquiries, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const selected = inquiries.find((i) => i.id === selectedId) || null;

  async function updateInquiry(i: Inquiry, patch: Partial<Pick<Inquiry, 'status' | 'admin_notes'>>, message: string) {
    setBusyId(i.id);
    try {
      const { data, error } = await createClient().from('contact_inquiries').update(patch).eq('id', i.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setInquiries((prev) => prev.map((x) => (x.id === i.id ? { ...x, ...patch } : x)));
      showToast(message, 'success');
      return true;
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function openInquiry(i: Inquiry) {
    setSelectedId(i.id);
    setNotesDraft(i.admin_notes || '');
    // Opening a new inquiry moves it into the working queue
    if (i.status === 'new') updateInquiry(i, { status: 'in_progress' }, 'Marked as in progress');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await createClient().from('contact_inquiries').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setInquiries((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      showToast('Inquiry deleted', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const replySubject = (i: Inquiry) => encodeURIComponent(`Re: Your ${i.category ? `${i.category} ` : ''}enquiry with Sushi Jewels`);

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Engagement"
        title="Contact Inquiries"
        subtitle="Messages submitted through the Contact Us page."
        actions={
          <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadInquiries(true)} disabled={refreshing || loading}>
            Refresh
          </SecondaryButton>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="mail" value={inquiries.length} label="Total Inquiries" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="mark_email_unread" value={counts.new || 0} label="New" tone="bg-sky-100 text-sky-700" />
        <StatTile icon="pending" value={counts.in_progress || 0} label="In Progress" tone="bg-amber-100 text-amber-700" />
        <StatTile icon="task_alt" value={counts.resolved || 0} label="Resolved" tone="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search name, email, phone or message..."
          />
          <SelectFilter
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
            options={categoryOptions}
            ariaLabel="Filter by topic"
          />
        </div>
        <FilterPills
          tabs={STATUS_TABS}
          active={statusFilter}
          counts={counts}
          onChange={(k) => {
            setStatusFilter(k);
            setPage(1);
          }}
        />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading inquiries..." />
        ) : inquiries.length === 0 ? (
          <EmptyState icon="inbox" title="No inquiries yet." hint={missingTable ? undefined : 'Messages from the Contact Us page will appear here.'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No inquiries match your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Contact</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Topic</th>
                    <th className="py-3.5 px-4">Message</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Received</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((i) => {
                    const wa = whatsappLink(i.phone, `Hello ${i.name.split(' ')[0]}, thank you for contacting Sushi Jewels.`);
                    return (
                      <tr key={i.id} className={`hover:bg-[#F5EEE7]/50 transition-colors ${i.status === 'new' ? 'bg-sky-50/40' : ''}`}>
                        <td className="py-3.5 px-5">
                          <button onClick={() => openInquiry(i)} className="flex items-center gap-3 min-w-0 text-left group">
                            <div className="w-9 h-9 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(i.name)}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-[#2D2024] truncate max-w-[200px] group-hover:text-[#8A6F3C] ${i.status === 'new' ? 'font-semibold' : 'font-medium'}`}>
                                {i.name}
                              </div>
                              <div className="text-xs text-[#2D2024]/55 truncate max-w-[200px]">{i.email}</div>
                            </div>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/75 whitespace-nowrap">{i.phone || '—'}</td>
                        <td className="py-3.5 px-4">
                          {i.category ? (
                            <span className="text-xs text-[#2D2024]/75 bg-[#F5EEE7] border border-[#E8D5C5] px-2.5 py-1 rounded-md whitespace-nowrap">{i.category}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-[300px]">
                          <p className="text-xs text-[#2D2024]/70 line-clamp-2">{i.message}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={i.status}
                            disabled={busyId === i.id}
                            onChange={(e) => {
                              const next = e.target.value as InquiryStatus;
                              updateInquiry(i, { status: next }, `Marked as ${STATUS_OPTIONS.find((s) => s.value === next)?.label}`);
                            }}
                            aria-label={`Status for inquiry from ${i.name}`}
                            className={`rounded-full min-w-[125px] pl-3.5 pr-8 py-1.5 text-xs font-semibold border focus:outline-none cursor-pointer appearance-none disabled:opacity-60 ${STATUS_STYLES[i.status]}`}
                            style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDateTime(i.created_at)}</td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {wa && <IconButton icon="chat" title="WhatsApp" tone="whatsapp" href={wa} external />}
                            <IconButton icon="reply" title="Reply by email" href={`mailto:${i.email}?subject=${replySubject(i)}`} />
                            <IconButton icon="visibility" title="Open inquiry" onClick={() => openInquiry(i)} />
                            <IconButton icon="delete" title="Delete inquiry" tone="danger" onClick={() => setDeleteTarget(i)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} noun="inquiries" />
          </>
        )}
      </TableCard>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} widthClass="max-w-lg">
        {selected && (
          <div className="flex flex-col min-h-full">
            <DrawerHeader eyebrow="Inquiry" title={selected.name} onClose={() => setSelectedId(null)} />
            <div className="p-6 space-y-4 flex-1">
              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">mail</span>
                  <a href={`mailto:${selected.email}`} className="hover:text-[#8A6F3C] truncate">{selected.email}</a>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">call</span>
                  {selected.phone ? <a href={`tel:${selected.phone}`} className="hover:text-[#8A6F3C]">{selected.phone}</a> : <span>—</span>}
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">label</span>
                  <span>{selected.category || 'General'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">schedule</span>
                  <span>{formatDateTime(selected.created_at)}</span>
                </div>
              </section>

              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4">
                <p className="text-[11px] uppercase tracking-widest text-[#2D2024]/55 font-semibold mb-2">Message</p>
                <p className="text-sm text-[#2D2024]/85 whitespace-pre-line">{selected.message}</p>
              </section>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#2D2024]/60">Status</span>
                <select
                  value={selected.status}
                  disabled={busyId === selected.id}
                  onChange={(e) => updateInquiry(selected, { status: e.target.value as InquiryStatus }, 'Status updated')}
                  className={`rounded-full min-w-[140px] pl-3.5 pr-8 py-1.5 text-xs font-semibold border focus:outline-none cursor-pointer appearance-none ${STATUS_STYLES[selected.status]}`}
                  style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  aria-label="Inquiry status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ backgroundColor: '#FFFFFF', color: '#2D2024' }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="Internal notes" htmlFor="inq-notes" hint="Only visible to the admin team.">
                <textarea
                  id="inq-notes"
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="e.g. Called back on Tuesday, appointment booked for Saturday."
                />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`mailto:${selected.email}?subject=${replySubject(selected)}`}
                  className="flex items-center justify-center gap-2 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <span className="material-symbols-outlined text-base">reply</span>
                  Reply by Email
                </a>
                {whatsappLink(selected.phone) ? (
                  <a
                    href={whatsappLink(selected.phone, `Hello ${selected.name.split(' ')[0]}, thank you for contacting Sushi Jewels.`) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    WhatsApp
                  </a>
                ) : (
                  <span className="flex items-center justify-center bg-[#2D2024]/5 text-[#2D2024]/40 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                    No phone
                  </span>
                )}
              </div>
            </div>
            <DrawerFooter>
              {selected.status !== 'resolved' && (
                <SecondaryButton
                  icon="task_alt"
                  disabled={busyId === selected.id}
                  onClick={() => updateInquiry(selected, { status: 'resolved', admin_notes: notesDraft.trim() || null }, 'Marked as resolved')}
                >
                  Mark Resolved
                </SecondaryButton>
              )}
              <PrimaryButton
                icon="save"
                disabled={busyId === selected.id}
                onClick={() => updateInquiry(selected, { admin_notes: notesDraft.trim() || null }, 'Notes saved')}
              >
                Save Notes
              </PrimaryButton>
            </DrawerFooter>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete inquiry?"
        message={<>The message from <strong>{deleteTarget?.name}</strong> will be permanently removed.</>}
        confirmLabel="Yes, Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
