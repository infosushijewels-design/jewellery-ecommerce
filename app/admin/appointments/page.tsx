"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import { formatSlot, isValidZoomLink } from '@/lib/appointments';
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
  StatTile,
  TableCard,
  formatDateTime,
  friendlyDbError,
  getInitials,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

type Appointment = Database['public']['Tables']['video_appointments']['Row'];
type ApptStatus = Appointment['status'];
type StatusTab = 'all' | ApptStatus;

const MIGRATION = '018_video_appointments.sql';
const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ApptStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_TABS: { key: StatusTab; label: string }[] = [{ key: 'all', label: 'All' }, ...STATUS_OPTIONS.map((o) => ({ key: o.value as StatusTab, label: o.label }))];

const STATUS_STYLES: Record<ApptStatus, string> = {
  pending: 'bg-amber-50 border-amber-200 text-amber-800',
  confirmed: 'bg-sky-50 border-sky-200 text-sky-800',
  completed: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  cancelled: 'bg-rose-50 border-rose-200 text-rose-700',
};

export default function AdminAppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomDraft, setZoomDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [followupDraft, setFollowupDraft] = useState('');
  const [busy, setBusy] = useState(false);
  // which button started the current action, so only that button shows the spinner
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const isRunning = (action: string) => busy && busyAction === action;
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient().from('video_appointments').select('*').order('scheduled_at', { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
      setMissingTable(false);
      if (isRefresh) showToast('Appointments refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: appointments.length };
    appointments.forEach((a) => {
      map[a.status] = (map[a.status] || 0) + 1;
    });
    return map;
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = appointments.filter((a) => {
      const matchesSearch =
        !q || a.customer_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.phone.includes(q) || a.topic.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    // Live bookings (pending/confirmed) first, soonest call on top; everything else newest first.
    const live = (a: Appointment) => a.status === 'pending' || a.status === 'confirmed';
    return rows.sort((a, b) => {
      if (live(a) !== live(b)) return live(a) ? -1 : 1;
      const diff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      return live(a) ? diff : -diff;
    });
  }, [appointments, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const selected = appointments.find((a) => a.id === selectedId) || null;

  function openAppointment(a: Appointment) {
    setSelectedId(a.id);
    // Only show a real Zoom link here; an old non-Zoom link is left blank so Confirm creates a fresh meeting.
    setZoomDraft(a.meet_link && isValidZoomLink(a.meet_link) ? a.meet_link : '');
    setNotesDraft(a.admin_notes || '');
    setFollowupDraft('');
  }

  function patchLocal(id: string, patch: Partial<Appointment>) {
    setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function updateDirect(a: Appointment, patch: Partial<Pick<Appointment, 'status' | 'admin_notes'>>, message: string) {
    setBusy(true);
    try {
      const { data, error } = await createClient().from('video_appointments').update(patch).eq('id', a.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      patchLocal(a.id, patch);
      showToast(message, 'success');
      return true;
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** Server actions that also send an email (confirm / cancel / follow-up). */
  async function callManage(a: Appointment, payload: Record<string, unknown>) {
    const res = await fetch('/api/appointments/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, ...payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Something went wrong.');
    return json as {
      success: true;
      emailSent?: boolean;
      emailError?: string;
      meetingLink?: string;
      zoomMeetingId?: string | null;
      zoomPasscode?: string | null;
      zoomCreated?: boolean;
      zoomDeleted?: boolean | null;
    };
  }

  async function handleConfirm(a: Appointment) {
    // Empty = create the Zoom meeting automatically; a pasted Zoom link is used as-is.
    const link = zoomDraft.trim();
    if (link && !isValidZoomLink(link)) {
      showToast('That is not a Zoom link (https://zoom.us/j/...). Clear the box to create one automatically.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await callManage(a, { action: 'confirm', meetingLink: link || undefined });
      patchLocal(a.id, {
        status: 'confirmed',
        meet_link: res.meetingLink ?? link,
        zoom_meeting_id: res.zoomMeetingId ?? null,
        zoom_passcode: res.zoomPasscode ?? null,
        confirmed_at: new Date().toISOString(),
      });
      if (res.meetingLink) setZoomDraft(res.meetingLink);
      const made = res.zoomCreated ? 'Zoom meeting created. ' : '';
      showToast(
        res.emailSent
          ? `${made}Confirmed — email sent to the customer`
          : `${made}Confirmed, but the email was not sent${res.emailError ? `: ${res.emailError}` : ''}. Copy the Zoom link and send it to the customer yourself.`,
        res.emailSent ? 'success' : 'error'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not confirm.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const res = await callManage(cancelTarget, { action: 'cancel' });
      patchLocal(cancelTarget.id, { status: 'cancelled', ...(res.zoomDeleted ? { zoom_meeting_id: null, zoom_passcode: null } : {}) });
      const zoomNote = res.zoomDeleted === false ? ' The Zoom meeting could not be deleted — remove it in Zoom.' : '';
      showToast(
        (res.emailSent ? 'Cancelled — customer notified.' : 'Cancelled (email was not sent).') + zoomNote,
        res.emailSent && !zoomNote ? 'success' : 'error'
      );
      setCancelTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleFollowup(a: Appointment) {
    setBusy(true);
    try {
      await callManage(a, { action: 'followup', message: followupDraft });
      patchLocal(a.id, { followup_sent_at: new Date().toISOString() });
      setFollowupDraft('');
      showToast('Follow-up email sent', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send the follow-up.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const { data, error } = await createClient().from('video_appointments').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setAppointments((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      showToast('Appointment deleted', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Video Appointments"
        subtitle="Personalised Zoom consultations booked from the website."
        actions={
          <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadAppointments(true)} disabled={refreshing || loading}>
            Refresh
          </SecondaryButton>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="videocam" value={appointments.length} label="Total Bookings" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="pending" value={counts.pending || 0} label="Pending" tone="bg-amber-100 text-amber-700" />
        <StatTile icon="event_available" value={counts.confirmed || 0} label="Confirmed" tone="bg-sky-100 text-sky-700" />
        <StatTile icon="task_alt" value={counts.completed || 0} label="Completed" tone="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(1);
          }}
          placeholder="Search name, email, phone or topic..."
        />
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
          <LoadingState label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState icon="videocam" title="No appointments yet." hint={missingTable ? undefined : 'Bookings from the website will appear here.'} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No appointments match your filters." />
        ) : (
          <>
            <div className="w-full overflow-x-auto custom-scroll">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-4">Scheduled (IST)</th>
                    <th className="py-3.5 px-4">Topic</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((a) => {
                    return (
                      <tr key={a.id} className={`hover:bg-[#F5EEE7]/50 transition-colors ${a.status === 'pending' ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-3.5 px-5">
                          <button onClick={() => openAppointment(a)} className="flex items-center gap-3 min-w-0 text-left group">
                            <div className="w-9 h-9 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {getInitials(a.customer_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[#2D2024] font-medium truncate max-w-[200px] group-hover:text-[#8A6F3C]">{a.customer_name}</div>
                              <div className="text-xs text-[#2D2024]/55 truncate max-w-[200px]">{a.email}</div>
                            </div>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/80 whitespace-nowrap">{formatSlot(a.scheduled_at)}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-[#2D2024]/75 bg-[#F5EEE7] border border-[#E8D5C5] px-2.5 py-1 rounded-md whitespace-nowrap">{a.topic}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold border ${STATUS_STYLES[a.status]}`}>
                            {STATUS_OPTIONS.find((s) => s.value === a.status)?.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            {a.meet_link && <IconButton icon="videocam" title="Open Zoom link" href={a.meet_link} external />}
                            <IconButton icon="visibility" title="Open appointment" onClick={() => openAppointment(a)} />
                            <IconButton icon="delete" title="Delete appointment" tone="danger" onClick={() => setDeleteTarget(a)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} noun="appointments" />
          </>
        )}
      </TableCard>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} widthClass="max-w-lg">
        {selected && (
          <div className="flex flex-col min-h-full">
            <DrawerHeader eyebrow="Video appointment" title={selected.customer_name} onClose={() => setSelectedId(null)} />
            <div className="p-6 space-y-4 flex-1">
              <section className="bg-white border border-[#E8D5C5] rounded-xl p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">event</span>
                  <strong>{formatSlot(selected.scheduled_at)}</strong>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">label</span>
                  <span>{selected.topic}</span>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">mail</span>
                  <a href={`mailto:${selected.email}`} className="hover:text-[#8A6F3C] truncate">{selected.email}</a>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">call</span>
                  <a href={`tel:${selected.phone}`} className="hover:text-[#8A6F3C]">{selected.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-[#2D2024]/80">
                  <span className="material-symbols-outlined text-base text-[#8A6F3C]">schedule</span>
                  <span>Requested {formatDateTime(selected.created_at)}</span>
                </div>
                <div className="pt-1">
                  <span className={`inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold border ${STATUS_STYLES[selected.status]}`}>
                    {STATUS_OPTIONS.find((s) => s.value === selected.status)?.label}
                  </span>
                </div>
              </section>

              {selected.message && (
                <section className="bg-white border border-[#E8D5C5] rounded-xl p-4">
                  <p className="text-[11px] uppercase tracking-widest text-[#2D2024]/55 font-semibold mb-2">Customer notes</p>
                  <p className="text-sm text-[#2D2024]/85 whitespace-pre-line">{selected.message}</p>
                </section>
              )}

              {(selected.status === 'pending' || selected.status === 'confirmed') && (
                <section className="bg-[#F5EEE7]/60 border border-[#E8D5C5] rounded-xl p-4 space-y-3">
                  <Field
                    label="Zoom meeting link (optional)"
                    htmlFor="appt-zoom"
                    hint={'Leave empty — a Zoom meeting is created automatically when you confirm. Or paste your own Zoom invite link.'}
                  >
                    <input
                      id="appt-zoom"
                      type="url"
                      value={zoomDraft}
                      onChange={(e) => setZoomDraft(e.target.value)}
                      className={inputClass}
                      placeholder="Auto-created on confirm, or paste https://zoom.us/j/..."
                    />
                  </Field>
                  <PrimaryButton icon={selected.status === 'confirmed' ? 'forward_to_inbox' : 'event_available'} loading={isRunning('confirm')} disabled={busy} onClick={() => { setBusyAction('confirm'); handleConfirm(selected); }}>
                    {selected.status === 'confirmed' ? 'Update Link & Resend Email' : zoomDraft.trim() ? 'Confirm & Email Customer' : 'Confirm & Create Zoom Meeting'}
                  </PrimaryButton>
                  {selected.zoom_passcode && (
                    <p className="text-xs text-[#2D2024]/60">
                      Zoom passcode: <strong>{selected.zoom_passcode}</strong>
                    </p>
                  )}
                  {selected.reminder_1d_sent_at || selected.reminder_30m_sent_at ? (
                    <p className="text-xs text-[#2D2024]/60">
                      Reminders sent:{selected.reminder_1d_sent_at ? ' 24h' : ''}
                      {selected.reminder_30m_sent_at ? ' · 30 min' : ''}
                    </p>
                  ) : null}
                </section>
              )}

              {selected.status === 'confirmed' && selected.meet_link && (
                <a
                  href={selected.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-[#E8D5C5] bg-white hover:bg-[#E8D5C5]/40 text-[#2D2024] py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <span className="material-symbols-outlined text-base">videocam</span>
                  Join Zoom Call
                </a>
              )}

              <Field label="Internal notes" htmlFor="appt-notes" hint="Only visible to the admin team. Add what was discussed after the call.">
                <textarea
                  id="appt-notes"
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="e.g. Liked the 18k solitaire ring, budget ₹1.5L, wants to visit store Saturday."
                />
              </Field>

              {selected.status === 'completed' && (
                <section className="bg-white border border-[#E8D5C5] rounded-xl p-4 space-y-3">
                  <Field
                    label="Follow-up email"
                    htmlFor="appt-followup"
                    hint="Send the customer a product link or an offer after the consultation."
                  >
                    <textarea
                      id="appt-followup"
                      rows={4}
                      value={followupDraft}
                      onChange={(e) => setFollowupDraft(e.target.value)}
                      className={`${inputClass} resize-none`}
                      placeholder="Thank you for your time! Here are the pieces we discussed: https://..."
                    />
                  </Field>
                  <SecondaryButton icon="send" loading={isRunning('followup')} disabled={busy || !followupDraft.trim()} onClick={() => { setBusyAction('followup'); handleFollowup(selected); }}>
                    {selected.followup_sent_at ? 'Send Another Follow-up' : 'Send Follow-up Email'}
                  </SecondaryButton>
                  {selected.followup_sent_at && <p className="text-xs text-[#2D2024]/60">Last follow-up sent {formatDateTime(selected.followup_sent_at)}</p>}
                </section>
              )}

            </div>
            <DrawerFooter>
              {(selected.status === 'pending' || selected.status === 'confirmed') && (
                <SecondaryButton icon="cancel" disabled={busy} onClick={() => setCancelTarget(selected)}>
                  Cancel
                </SecondaryButton>
              )}
              {selected.status === 'confirmed' && (
                <SecondaryButton
                  icon="task_alt"
                  loading={isRunning('complete')}
                  disabled={busy}
                  onClick={() => { setBusyAction('complete'); updateDirect(selected, { status: 'completed', admin_notes: notesDraft.trim() || null }, 'Marked as completed'); }}
                >
                  Mark Completed
                </SecondaryButton>
              )}
              <PrimaryButton icon="save" loading={isRunning('notes')} disabled={busy} onClick={() => { setBusyAction('notes'); updateDirect(selected, { admin_notes: notesDraft.trim() || null }, 'Notes saved'); }}>
                Save Notes
              </PrimaryButton>
            </DrawerFooter>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this appointment?"
        message={<>The slot for <strong>{cancelTarget?.customer_name}</strong> will be freed and they will be emailed that it was cancelled.</>}
        confirmLabel="Yes, Cancel"
        busy={busy}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete appointment?"
        message={<>The booking from <strong>{deleteTarget?.customer_name}</strong> will be permanently removed. No email is sent.</>}
        confirmLabel="Yes, Delete"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
