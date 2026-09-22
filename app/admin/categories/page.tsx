"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import {
  ConfirmDialog,
  Drawer,
  EmptyState,
  FilterPills,
  IconButton,
  LoadingState,
  PageHeader,
  Pagination,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  StatTile,
  TableCard,
  Toggle,
  formatDate,
} from '@/components/admin/AdminUI';
import { ImageUploader } from '@/components/admin/ImageUploader';

type Category = Database['public']['Tables']['categories']['Row'];
type ProductLite = { id: string; category_id: string | null; image_url: string };
type StatusTab = 'all' | 'active' | 'hidden';

type FormState = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

const PAGE_SIZE = 10;
const emptyForm: FormState = { name: '', slug: '', description: '', imageUrl: '', isActive: true };

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'hidden', label: 'Hidden' },
];

function generateSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

/** Categories created before migration 008 have no is_active column — treat them as active. */
const isActive = (c: Category) => c.is_active !== false;

function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Something went wrong';
  if (/image_url|is_active/.test(message)) {
    return 'Database is missing the new category columns — run migration 008_category_admin_enhancements.sql in Supabase.';
  }
  if (/row-level security|permission denied/i.test(message)) {
    return 'Permission denied — sign in with an admin account (and run migration 008 for category write access).';
  }
  return message;
}

export default function AdminCategoriesPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const supabase = createClient();
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, category_id, image_url'),
      ]);
      if (catRes.error) throw catRes.error;
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
      if (isRefresh) showToast('Categories refreshed', 'success');
    } catch (err) {
      console.error('Error loading categories:', err);
      showToast(friendlyError(err), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const productStats = useMemo(() => {
    const counts = new Map<string, number>();
    const coverFallback = new Map<string, string>();
    let uncategorised = 0;
    products.forEach((p) => {
      if (!p.category_id) {
        uncategorised += 1;
        return;
      }
      counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
      if (!coverFallback.has(p.category_id) && p.image_url) coverFallback.set(p.category_id, p.image_url);
    });
    return { counts, coverFallback, uncategorised };
  }, [products]);

  const activeCount = categories.filter(isActive).length;
  const tabCounts = { all: categories.length, active: activeCount, hidden: categories.length - activeCount };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive(c) : !isActive(c));
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function openCreate() {
    setEditingId(null);
    setFormData(emptyForm);
    setFormOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.image_url || '',
      isActive: isActive(cat),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    const name = formData.name.trim();
    const slug = generateSlug(formData.slug || name);
    if (!name || !slug) return;

    const duplicate = categories.find((c) => c.slug === slug && c.id !== editingId);
    if (duplicate) {
      showToast(`Slug "/${slug}" is already used by "${duplicate.name}"`, 'error');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const payload = {
      name,
      slug,
      description: formData.description.trim() || null,
      image_url: formData.imageUrl.trim() || null,
      is_active: formData.isActive,
    };
    try {
      if (editingId) {
        const { data, error } = await supabase.from('categories').update(payload).eq('id', editingId).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('permission denied');
        showToast('Category updated', 'success');
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        showToast('Category added', 'success');
      }
      closeForm();
      loadData();
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cat: Category, next: boolean) {
    setTogglingId(cat.id);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('categories').update({ is_active: next }).eq('id', cat.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, is_active: next } : c)));
      showToast(`"${cat.name}" is now ${next ? 'visible on the store' : 'hidden from the store'}`, 'success');
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('categories').delete().eq('id', deleteTarget.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast('Category deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast(friendlyError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const deleteTargetProducts = deleteTarget ? productStats.counts.get(deleteTarget.id) || 0 : 0;
  const inputClass =
    'w-full bg-white border border-[#E8D5C5] rounded-lg px-4 py-2.5 text-sm text-[#2D2024] placeholder:text-[#2D2024]/35 focus:outline-none focus:border-[#B99A62] focus:ring-2 focus:ring-[#B99A62]/20 transition';
  const labelClass = 'block text-[11px] uppercase tracking-wider text-[#2D2024]/60 mb-1.5 font-semibold';

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Collection Taxonomy"
        title="Categories"
        subtitle="Organise your jewellery into curated categories."
        actions={
          <>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadData(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            <PrimaryButton icon="add" onClick={openCreate}>
              Add Category
            </PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="category" value={categories.length} label="Total Categories" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="visibility" value={activeCount} label="Active on Store" tone="bg-emerald-100 text-emerald-700" />
        <StatTile icon="visibility_off" value={categories.length - activeCount} label="Hidden" tone="bg-[#2D2024]/10 text-[#2D2024]/70" />
        <StatTile icon="help" value={productStats.uncategorised} label="Uncategorised Products" tone="bg-amber-100 text-amber-700" />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(1);
          }}
          placeholder="Search categories..."
        />
        <FilterPills
          tabs={STATUS_TABS}
          active={statusFilter}
          counts={tabCounts}
          onChange={(key) => {
            setStatusFilter(key);
            setPage(1);
          }}
        />
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading categories..." />
        ) : categories.length === 0 ? (
          <EmptyState icon="category" title="No categories yet." hint='Click "Add Category" to create your first one.' />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No categories match your search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-4">URL Slug</th>
                    <th className="py-3.5 px-4">Products</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((cat) => {
                    const count = productStats.counts.get(cat.id) || 0;
                    const cover = cat.image_url || productStats.coverFallback.get(cat.id);
                    const active = isActive(cat);
                    return (
                      <tr key={cat.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0">
                              {cover ? (
                                <img src={cover} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#B99A62]">
                                  <span className="material-symbols-outlined">category</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#2D2024] truncate max-w-[260px]">{cat.name}</p>
                              {cat.description && (
                                <p className="text-xs text-[#2D2024]/55 truncate max-w-[260px]">{cat.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono text-[#8A6F3C] bg-[#B99A62]/10 px-2.5 py-1 rounded-full border border-[#B99A62]/25">
                            /{cat.slug}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/80 whitespace-nowrap">
                          {count} {count === 1 ? 'product' : 'products'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Toggle
                              checked={active}
                              disabled={togglingId === cat.id}
                              onChange={(next) => handleToggleActive(cat, next)}
                              label={active ? `Hide ${cat.name} from store` : `Show ${cat.name} on store`}
                            />
                            <span className={`text-xs font-medium ${active ? 'text-emerald-700' : 'text-[#2D2024]/50'}`}>
                              {active ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDate(cat.created_at)}</td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            <IconButton icon="open_in_new" title="View on store" href={`/category/${cat.slug}`} external />
                            <IconButton icon="edit" title="Edit category" onClick={() => openEdit(cat)} />
                            <IconButton icon="delete" title="Delete category" tone="danger" onClick={() => setDeleteTarget(cat)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              noun="categories"
            />
          </>
        )}
      </TableCard>

      {/* Add / Edit drawer */}
      <Drawer open={formOpen} onClose={closeForm} widthClass="max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
          <div className="sticky top-0 z-10 bg-[#FFFCF7]/95 backdrop-blur-sm border-b border-[#E8D5C5] px-6 py-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#8A6F3C] font-semibold">Category</span>
              <h3 className="font-headline-sm text-xl text-[#2D2024]">{editingId ? 'Edit Category' : 'New Category'}</h3>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="p-1.5 rounded-full text-[#2D2024]/60 hover:text-[#2D2024] hover:bg-[#E8D5C5]/50"
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 space-y-5 flex-1">
            <div>
              <label htmlFor="cat-name" className={labelClass}>Category Name *</label>
              <input
                id="cat-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({ ...prev, name, slug: editingId ? prev.slug : generateSlug(name) }));
                }}
                placeholder="e.g. Diamond Rings"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="cat-slug" className={labelClass}>
                URL Slug * <span className="normal-case tracking-normal text-[10px] text-[#8A6F3C]">(auto-generated)</span>
              </label>
              <div className="flex items-center rounded-lg border border-[#E8D5C5] bg-white focus-within:border-[#B99A62] focus-within:ring-2 focus-within:ring-[#B99A62]/20">
                <span className="pl-4 text-sm text-[#2D2024]/45 font-mono">/category/</span>
                <input
                  id="cat-slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  onBlur={(e) => setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  placeholder="diamond-rings"
                  className="flex-1 min-w-0 bg-transparent px-1 py-2.5 text-sm text-[#2D2024] font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cat-desc" className={labelClass}>Description</label>
              <textarea
                id="cat-desc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Brief description of this category..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <p className={labelClass}>Cover Image</p>
              <ImageUploader
                value={formData.imageUrl}
                onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                folder="categories"
                label="Upload cover image"
                aspectClass="aspect-[16/9]"
              />
              {!formData.imageUrl && (
                <p className="text-[11px] text-[#2D2024]/50 mt-1">Optional — without one, the first product in this category is used as the thumbnail.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 bg-white border border-[#E8D5C5] rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2D2024]">Show on store</p>
                <p className="text-xs text-[#2D2024]/55">Hidden categories return “not found” on the storefront.</p>
              </div>
              <Toggle
                checked={formData.isActive}
                onChange={(next) => setFormData((prev) => ({ ...prev, isActive: next }))}
                label="Show on store"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-[#FFFCF7]/95 backdrop-blur-sm border-t border-[#E8D5C5] px-6 py-4 flex justify-end gap-3">
            <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" icon={saving ? undefined : 'save'} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update Category' : 'Save Category'}
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category?"
        message={
          <>
            You are about to delete <strong>“{deleteTarget?.name}”</strong>.
            {deleteTargetProducts > 0 && (
              <> Its {deleteTargetProducts} {deleteTargetProducts === 1 ? 'product' : 'products'} will become uncategorised.</>
            )}{' '}
            This cannot be undone.
          </>
        }
        confirmLabel="Yes, Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
