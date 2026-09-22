"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import { BUILT_IN_LEGAL_PAGES, isBuiltInLegalSlug, legalPagePath, parseLegalContent } from '@/lib/legal';
import {
  ConfirmDialog,
  Drawer,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  MigrationNotice,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  TableCard,
  Toggle,
  formatDateTime,
  friendlyDbError,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

type LegalPage = Database['public']['Tables']['legal_pages']['Row'];

/** A row in the list: either a saved DB page or a built-in page still on its default copy. */
type Row =
  | { kind: 'saved'; page: LegalPage; builtIn: boolean }
  | { kind: 'default'; slug: string; title: string };

const MIGRATION = '009_engagement_and_content.sql';

const CONTENT_TEMPLATE = `Short introduction shown above the first section.

## First Section Heading
Write a paragraph here. Use **double asterisks** for bold text.

- Bullet point one
- Bullet point two

## Second Section Heading
Another paragraph.`;

type FormState = { title: string; slug: string; summary: string; content: string; isActive: boolean };
const emptyForm: FormState = { title: '', slug: '', summary: '', content: CONTENT_TEMPLATE, isActive: true };

function generateSlug(title: string) {
  return title.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export default function AdminLegalPagesPage() {
  const { showToast } = useToast();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegalPage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient().from('legal_pages').select('*').order('title');
      if (error) throw error;
      setPages(data || []);
      setMissingTable(false);
      if (isRefresh) showToast('Legal pages refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const rows: Row[] = useMemo(() => {
    const saved: Row[] = pages.map((page) => ({ kind: 'saved', page, builtIn: isBuiltInLegalSlug(page.slug) }));
    const defaults: Row[] = BUILT_IN_LEGAL_PAGES.filter((b) => !pages.some((p) => p.slug === b.slug)).map((b) => ({
      kind: 'default',
      slug: b.slug,
      title: b.title,
    }));
    const q = searchQuery.trim().toLowerCase();
    return [...saved, ...defaults]
      .filter((r) => {
        if (!q) return true;
        const title = r.kind === 'saved' ? r.page.title : r.title;
        const slug = r.kind === 'saved' ? r.page.slug : r.slug;
        return title.toLowerCase().includes(q) || slug.includes(q);
      })
      .sort((a, b) => (a.kind === 'saved' ? a.page.title : a.title).localeCompare(b.kind === 'saved' ? b.page.title : b.title));
  }, [pages, searchQuery]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openCustomise(slug: string, title: string) {
    setEditingId(null);
    setForm({ ...emptyForm, title, slug });
    setFormOpen(true);
  }

  function openEdit(page: LegalPage) {
    setEditingId(page.id);
    setForm({ title: page.title, slug: page.slug, summary: page.summary || '', content: page.content, isActive: page.is_active });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  const slugLocked = isBuiltInLegalSlug(form.slug) && (!!editingId || BUILT_IN_LEGAL_PAGES.some((b) => b.slug === form.slug));

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const title = form.title.trim();
    const slug = generateSlug(form.slug || title);
    if (!title || !slug) return;
    if (!form.content.trim()) {
      showToast('Page content cannot be empty', 'error');
      return;
    }
    const clash = pages.find((p) => p.slug === slug && p.id !== editingId);
    if (clash) {
      showToast(`"/${slug}" is already used by "${clash.title}"`, 'error');
      return;
    }

    const payload = { title, slug, summary: form.summary.trim() || null, content: form.content.trim(), is_active: form.isActive };
    setSaving(true);
    const supabase = createClient();
    try {
      if (editingId) {
        const { data, error } = await supabase.from('legal_pages').update(payload).eq('id', editingId).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('permission denied');
        showToast('Page updated', 'success');
      } else {
        const { error } = await supabase.from('legal_pages').insert(payload);
        if (error) throw error;
        showToast('Page published', 'success');
      }
      closeForm();
      loadPages();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(page: LegalPage, next: boolean) {
    setTogglingId(page.id);
    try {
      const { data, error } = await createClient().from('legal_pages').update({ is_active: next }).eq('id', page.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, is_active: next } : p)));
      const builtIn = isBuiltInLegalSlug(page.slug);
      showToast(
        next ? `"${page.title}" is live` : builtIn ? `"${page.title}" reverted to default content` : `"${page.title}" hidden from the store`,
        'success'
      );
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await createClient().from('legal_pages').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast(isBuiltInLegalSlug(deleteTarget.slug) ? 'Custom content removed — default restored' : 'Page deleted', 'success');
      setDeleteTarget(null);
      loadPages();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const sectionCount = parseLegalContent(form.content).filter((b) => b.type === 'section').length;
  const deleteIsBuiltIn = deleteTarget ? isBuiltInLegalSlug(deleteTarget.slug) : false;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="System"
        title="Legal Pages"
        subtitle="Create and edit legal policies and customer information pages."
        actions={
          <>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadPages(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            <PrimaryButton icon="add" onClick={openCreate} disabled={missingTable}>
              Add Legal Page
            </PrimaryButton>
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search pages..." />
        <span className="text-sm text-[#2D2024]/60">Total: {rows.length} pages</span>
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading pages..." />
        ) : rows.length === 0 ? (
          <EmptyState icon="gavel" title="No pages match your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-5">Page Title</th>
                  <th className="py-3.5 px-4">URL</th>
                  <th className="py-3.5 px-4">Content</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D5C5]/70">
                {rows.map((row) => {
                  const slug = row.kind === 'saved' ? row.page.slug : row.slug;
                  const title = row.kind === 'saved' ? row.page.title : row.title;
                  const path = legalPagePath(slug);
                  return (
                    <tr key={row.kind === 'saved' ? row.page.id : `default-${slug}`} className="hover:bg-[#F5EEE7]/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#B99A62]/12 text-[#8A6F3C] flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-xl">description</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#2D2024] font-medium truncate max-w-[260px]">{title}</p>
                            {row.kind === 'saved' && row.page.summary && (
                              <p className="text-xs text-[#2D2024]/55 truncate max-w-[260px]">{row.page.summary}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono text-[#8A6F3C] bg-[#B99A62]/10 px-2.5 py-1 rounded-md border border-[#B99A62]/25">{path}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {row.kind === 'default' ? (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-[#2D2024]/5 border-[#E8D5C5] text-[#2D2024]/60">Default copy</span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-[#B99A62]/12 border-[#B99A62]/30 text-[#8A6F3C]">
                            {row.builtIn ? 'Customised' : 'Custom page'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {row.kind === 'saved' ? (
                          <div className="flex items-center gap-2.5">
                            <Toggle
                              checked={row.page.is_active}
                              disabled={togglingId === row.page.id}
                              onChange={(next) => handleToggle(row.page, next)}
                              label={row.page.is_active ? `Deactivate ${title}` : `Activate ${title}`}
                            />
                            <span className={`text-xs font-medium ${row.page.is_active ? 'text-emerald-700' : 'text-[#2D2024]/50'}`}>
                              {row.page.is_active ? 'Active' : row.builtIn ? 'Using default' : 'Hidden'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700">Live</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">
                        {row.kind === 'saved' ? formatDateTime(row.page.updated_at) : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5">
                          <IconButton icon="visibility" title="View on store" href={path} external />
                          {row.kind === 'saved' ? (
                            <>
                              <IconButton icon="edit" title="Edit page" onClick={() => openEdit(row.page)} />
                              <IconButton
                                icon={row.builtIn ? 'restart_alt' : 'delete'}
                                title={row.builtIn ? 'Reset to default content' : 'Delete page'}
                                tone="danger"
                                onClick={() => setDeleteTarget(row.page)}
                              />
                            </>
                          ) : (
                            <IconButton icon="edit" title="Customise content" onClick={() => !missingTable && openCustomise(row.slug, row.title)} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <Drawer open={formOpen} onClose={closeForm} widthClass="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
          <DrawerHeader eyebrow="Legal Page" title={editingId ? 'Edit Page' : form.slug && slugLocked ? `Customise ${form.title}` : 'New Page'} onClose={closeForm} />
          <div className="p-6 space-y-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Page Title *" htmlFor="lp-title">
                <input
                  id="lp-title"
                  required
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({ ...f, title, slug: editingId || slugLocked ? f.slug : generateSlug(title) }));
                  }}
                  className={inputClass}
                  placeholder="e.g. Cancellation & Refund Policy"
                />
              </Field>
              <Field label="URL Slug *" htmlFor="lp-slug" hint={slugLocked ? 'Built-in page — URL is fixed.' : `Published at /legal/${form.slug || '…'}`}>
                <input
                  id="lp-slug"
                  required
                  disabled={slugLocked}
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  onBlur={(e) => setForm((f) => ({ ...f, slug: generateSlug(e.target.value) }))}
                  className={`${inputClass} font-mono disabled:bg-[#F5EEE7] disabled:text-[#2D2024]/50`}
                  placeholder="cancellation-and-refund-policy"
                />
              </Field>
            </div>

            <Field label="Summary" htmlFor="lp-summary" hint="Shown under the page title.">
              <input
                id="lp-summary"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                className={inputClass}
                placeholder="One line describing what this page covers"
              />
            </Field>

            <Field label={`Content * · ${sectionCount} ${sectionCount === 1 ? 'section' : 'sections'}`} htmlFor="lp-content">
              <textarea
                id="lp-content"
                rows={16}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className={`${inputClass} font-mono text-[13px] leading-relaxed`}
              />
            </Field>

            <div className="rounded-xl bg-[#F5EEE7]/70 border border-[#E8D5C5] px-4 py-3 text-xs text-[#2D2024]/70 space-y-1">
              <p className="font-semibold text-[#2D2024]">Formatting</p>
              <p><code className="font-mono">## Heading</code> starts a new section · <code className="font-mono">- item</code> makes a bullet · <code className="font-mono">**text**</code> is bold · a blank line starts a new paragraph.</p>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white border border-[#E8D5C5] rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2D2024]">Active</p>
                <p className="text-xs text-[#2D2024]/55">
                  {slugLocked ? 'When off, the store shows the default copy for this page.' : 'When off, the page returns “not found”.'}
                </p>
              </div>
              <Toggle checked={form.isActive} onChange={(next) => setForm((f) => ({ ...f, isActive: next }))} label="Active" />
            </div>
          </div>
          <DrawerFooter>
            <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" icon={saving ? undefined : 'save'} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Page' : 'Publish Page'}
            </PrimaryButton>
          </DrawerFooter>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteIsBuiltIn ? 'Reset to default content?' : 'Delete page?'}
        message={
          deleteIsBuiltIn ? (
            <>Your custom content for <strong>{deleteTarget?.title}</strong> will be removed and the original copy will be shown again.</>
          ) : (
            <><strong>{deleteTarget?.title}</strong> will be removed and its URL will stop working. This cannot be undone.</>
          )
        }
        confirmLabel={deleteIsBuiltIn ? 'Reset' : 'Yes, Delete'}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
