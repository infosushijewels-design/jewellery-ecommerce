"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import { useAdminAccess } from '@/components/admin/AdminAccessContext';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { FALLBACK_COLLECTION_CARDS, sortCollectionCards, type CollectionCard } from '@/lib/homepageCollections';
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
  SecondaryButton,
  StatTile,
  TableCard,
  Toggle,
  friendlyDbError,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

const MIGRATION = '040_homepage_collection_cards.sql';

type FormState = {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  isActive: boolean;
  sortOrder: string;
};

const emptyForm: FormState = {
  title: '',
  subtitle: '',
  imageUrl: '',
  href: '',
  isActive: true,
  sortOrder: '0',
};

const toForm = (c: CollectionCard): FormState => ({
  title: c.title,
  subtitle: c.subtitle || '',
  imageUrl: c.image_url,
  href: c.href,
  isActive: c.is_active,
  sortOrder: String(c.sort_order ?? 0),
});

/** A link is either an internal route (starts with "/") or a full https:// URL — never
 *  javascript:, data:, or another unsafe scheme. */
function isValidHref(href: string) {
  const v = href.trim();
  if (!v) return false;
  if (v.startsWith('/')) return true;
  return /^https:\/\//i.test(v);
}

export default function AdminHomepageCollectionsPage() {
  const { showToast } = useToast();
  const access = useAdminAccess();
  const canCreate = access.can('homepage_collections', 'create');
  const canEdit = access.can('homepage_collections', 'edit');
  const canDelete = access.can('homepage_collections', 'delete');

  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionCard | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data, error } = await createClient().from('homepage_collection_cards').select('*').order('sort_order');
      if (error) throw error;
      setCards(sortCollectionCards((data as CollectionCard[]) || []));
      setMissingTable(false);
      if (isRefresh) showToast('Collections refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err)) {
        setMissingTable(true);
        // Show the same 5 cards still live on the homepage (via the fallback), read-only,
        // so the admin sees what's really on the site while the migration is pending.
        setCards(FALLBACK_COLLECTION_CARDS);
      } else {
        showToast(friendlyDbError(err, MIGRATION), 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const activeCount = cards.filter((c) => c.is_active).length;

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: String(cards.length + 1) });
    setFormOpen(true);
  }

  function openEdit(c: CollectionCard) {
    setEditingId(c.id);
    setForm(toForm(c));
    setFormOpen(true);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!form.imageUrl.trim()) {
      showToast('Please upload a card image', 'error');
      return;
    }
    if (!isValidHref(form.href)) {
      showToast('Link must start with "/" (internal page) or "https://" (external link)', 'error');
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image_url: form.imageUrl,
      href: form.href.trim(),
      is_active: form.isActive,
      sort_order: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    const supabase = createClient();
    try {
      if (editingId) {
        const { data, error } = await supabase.from('homepage_collection_cards').update(payload).eq('id', editingId).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('permission denied');
        showToast(`${payload.title} updated`, 'success');
      } else {
        const { error } = await supabase.from('homepage_collection_cards').insert(payload);
        if (error) throw error;
        showToast(`${payload.title} added`, 'success');
      }
      setFormOpen(false);
      loadCards();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: CollectionCard, next: boolean) {
    setTogglingId(c.id);
    try {
      const { data, error } = await createClient().from('homepage_collection_cards').update({ is_active: next }).eq('id', c.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setCards((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)));
      showToast(`${c.title} is now ${next ? 'shown' : 'hidden'} on the homepage`, 'success');
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
      const { data, error } = await createClient().from('homepage_collection_cards').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast(`${deleteTarget.title} deleted`, 'success');
      setDeleteTarget(null);
      loadCards();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const readOnly = missingTable || (editingId ? !canEdit : !canCreate);

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Management"
        title="Homepage Collections"
        subtitle={'Cards shown in the homepage "Explore Our Collections" carousel.'}
        actions={
          <>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadCards(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            {canCreate && (
              <PrimaryButton icon="add" onClick={openCreate} disabled={missingTable}>
                Add Card
              </PrimaryButton>
            )}
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
        <StatTile icon="view_carousel" value={cards.length} label="Total Cards" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="visibility" value={activeCount} label="Live on Homepage" tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="visibility_off" value={cards.length - activeCount} label="Hidden" tone="bg-[#2D2024]/10 text-[#2D2024]/70" />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading collection cards..." />
        ) : cards.length === 0 ? (
          <EmptyState icon="view_carousel" title="No collection cards yet." hint={missingTable ? undefined : 'Click "Add Card" to create your first one.'} />
        ) : (
          <div className="w-full overflow-x-auto custom-scroll">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-5">Card</th>
                  <th className="py-3.5 px-4">Link</th>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D5C5]/70">
                {cards.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-16 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {c.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[#B99A62]">image</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2D2024] truncate max-w-[220px]">{c.title}</p>
                          {c.subtitle && <p className="text-xs text-[#2D2024]/55 truncate max-w-[220px]">{c.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#2D2024]/70 font-mono max-w-[220px] truncate">{c.href}</td>
                    <td className="py-3.5 px-4 text-[#2D2024]/70">{c.sort_order}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Toggle
                          checked={c.is_active}
                          disabled={!canEdit || missingTable || togglingId === c.id}
                          loading={togglingId === c.id}
                          onChange={(next) => handleToggle(c, next)}
                          label={c.is_active ? `Hide ${c.title}` : `Show ${c.title}`}
                        />
                        <span className={`text-xs font-medium ${c.is_active ? 'text-emerald-700' : 'text-[#2D2024]/50'}`}>
                          {c.is_active ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        {canEdit && <IconButton icon="edit" title="Edit card" onClick={() => openEdit(c)} disabled={missingTable} />}
                        {canDelete && <IconButton icon="delete" title="Delete card" tone="danger" onClick={() => setDeleteTarget(c)} disabled={missingTable} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <Drawer open={formOpen} onClose={() => setFormOpen(false)} widthClass="max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
          <DrawerHeader eyebrow="Collection Card" title={editingId ? 'Edit Card' : 'Add Card'} onClose={() => setFormOpen(false)} />
          <fieldset disabled={readOnly} className="p-6 space-y-5 flex-1">
            <Field label="Title *" htmlFor="cc-title" hint="e.g. Necklaces, Bridal Sets">
              <input id="cc-title" value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Subtitle" htmlFor="cc-subtitle" hint="Short tagline shown on non-center cards">
              <input id="cc-subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} className={inputClass} placeholder="e.g. Layered & Chokers" />
            </Field>

            <div>
              <p className="block text-[11px] uppercase tracking-wider text-[#2D2024]/60 mb-1.5 font-semibold">Card Image *</p>
              <ImageUploader value={form.imageUrl} onChange={(url) => set('imageUrl', url)} folder="homepage-collections" label="Upload card image" aspectClass="aspect-[3/4]" disabled={readOnly} />
            </div>

            <Field label="Destination Link *" htmlFor="cc-href" hint={'Internal page (e.g. /category/rings) or a full https:// link'}>
              <input
                id="cc-href"
                value={form.href}
                onChange={(e) => set('href', e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="/category/rings"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <Field label="Display Order" htmlFor="cc-order" hint="Lower shows first">
                <input id="cc-order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className={inputClass} />
              </Field>
              <div className="flex items-center justify-between gap-3 bg-white border border-[#E8D5C5] rounded-lg px-4 py-2.5">
                <span className="text-sm text-[#2D2024]">Live</span>
                <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Show on homepage" disabled={readOnly} />
              </div>
            </div>
          </fieldset>
          <DrawerFooter>
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            {!readOnly && (
              <PrimaryButton type="submit" icon="save" loading={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Card' : 'Add Card'}
              </PrimaryButton>
            )}
          </DrawerFooter>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete collection card?"
        message={<><strong>{deleteTarget?.title}</strong> will be removed from the homepage carousel. You can hide it instead using the Live toggle.</>}
        confirmLabel="Yes, Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
