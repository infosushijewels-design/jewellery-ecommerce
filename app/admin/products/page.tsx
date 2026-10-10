"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { adminCreateProduct, adminDeleteProduct, Product } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { downloadCsv } from '@/lib/utils/csv';
import BulkProductImportModal from '@/components/admin/BulkProductImportModal';
import {
  ConfirmDialog,
  EmptyState,
  IconButton,
  LoadingState,
  PageHeader,
  Pagination,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SelectFilter,
  StatTile,
  TableCard,
  Toggle,
  formatDate,
} from '@/components/admin/AdminUI';

type FlagField = 'is_featured' | 'is_new_arrival';

const PAGE_SIZE = 10;

function exportProductsCsv(products: Product[], categoryName: (id: string | null) => string) {
  const header = ['Title', 'SKU', 'Slug', 'Category', 'Material', 'Price', 'MRP', 'Stock', 'Featured', 'New Arrival', 'Created'];
  const rows = products.map((p) => [
    p.title,
    p.sku || '',
    p.slug,
    categoryName(p.category_id),
    p.material,
    String(p.price),
    p.mrp != null ? String(p.mrp) : '',
    String(p.stock ?? 0),
    p.is_featured ? 'Yes' : 'No',
    p.is_new_arrival ? 'Yes' : 'No',
    new Date(p.created_at).toISOString(),
  ]);
  downloadCsv('products', header, rows);
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const supabase = createClient();
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      if (isRefresh) showToast('Products refreshed', 'success');
    } catch (err) {
      console.error('Error loading products:', err);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const categoryName = (id: string | null) => (id && categoryNameById.get(id)) || 'Uncategorised';

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
      { value: 'none', label: 'Uncategorised' },
    ],
    [categories]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.material || '').toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === 'all' || (categoryFilter === 'none' ? !p.category_id : p.category_id === categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  async function handleToggleFlag(product: Product, field: FlagField, next: boolean) {
    const key = `${product.id}:${field}`;
    setTogglingKey(key);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('products').update({ [field]: next }).eq('id', product.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Permission denied — sign in with an admin account.');
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [field]: next } : p)));
      const label = field === 'is_featured' ? 'Featured' : 'New Arrival';
      showToast(`${label} ${next ? 'enabled' : 'removed'} for "${product.title}"`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setTogglingKey(null);
    }
  }

  async function handleDuplicate(product: Product) {
    setDuplicatingId(product.id);
    try {
      const rest: Partial<Product> = { ...product };
      delete rest.id;
      delete rest.created_at;
      delete rest.updated_at;
      const suffix = Math.random().toString(36).slice(2, 6);
      const res = await adminCreateProduct({
        ...rest,
        title: `${product.title} (Copy)`,
        slug: `${product.slug}-copy-${suffix}`,
        sku: null,
        stock: 0,
        is_featured: false,
      });
      if (!res.success || !res.id) throw new Error(res.error || 'Failed to duplicate product');
      showToast('Product duplicated — opening the copy for editing', 'success');
      router.push(`/admin/products/${res.id}/edit`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to duplicate product', 'error');
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const res = await adminDeleteProduct(deletingProduct.id);
      if (res.success) {
        showToast('Product removed from catalog', 'success');
        setDeletingProduct(null);
        loadData();
      } else {
        showToast(res.error || 'Failed to delete product', 'error');
      }
    } catch {
      showToast('Error removing product', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="Inventory Management"
        title="Products"
        subtitle="Manage your jewellery catalogue, pricing and stock."
        actions={
          <>
            <SecondaryButton
              icon="upload_file"
              onClick={() => setIsImportModalOpen(true)}
            >
              Bulk Import (Excel)
            </SecondaryButton>
            <SecondaryButton
              icon="download"
              onClick={() => exportProductsCsv(filtered, categoryName)}
              disabled={loading || filtered.length === 0}
            >
              Export CSV
            </SecondaryButton>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadData(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            <PrimaryButton icon="add" onClick={() => router.push('/admin/products/new')}>
              Add Product
            </PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        <StatTile icon="diamond" value={products.length} label="Total Products" tone="bg-[#B99A62]/15 text-[#8A6F3C]" />
        <StatTile icon="category" value={categories.length} label="Categories" tone="bg-[#4B2949]/10 text-[#4B2949]" />
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search by name, SKU or material..."
          />
          <SelectFilter
            value={categoryFilter}
            onChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
            options={categoryOptions}
            ariaLabel="Filter by category"
          />
        </div>
      </div>

      <TableCard>
        {loading ? (
          <LoadingState label="Loading products..." />
        ) : products.length === 0 ? (
          <EmptyState icon="diamond" title="No products yet." hint='Click "Add Product" to create your first piece.' />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search_off" title="No products match your search or filters." />
        ) : (
          <>
            <div className="w-full overflow-x-auto custom-scroll">
              <table className="w-full text-left text-sm min-w-[1100px]">
                <thead>
                  <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3.5 px-5">Product</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4 text-center">Featured</th>
                    <th className="py-3.5 px-4 text-center">New</th>
                    <th className="py-3.5 px-4">Created</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/70">
                  {pageRows.map((product) => {
                    const stock = product.stock ?? 0;
                    const discount =
                      product.mrp != null && product.price > 0 && product.mrp > product.price
                        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                        : 0;
                    return (
                      <tr key={product.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-[#F5EEE7] border border-[#E8D5C5] overflow-hidden flex-shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#B99A62]">
                                  <span className="material-symbols-outlined">diamond</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                className="block text-left font-medium text-[#2D2024] hover:text-[#8A6F3C] truncate max-w-[260px]"
                              >
                                {product.title}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#2D2024]/55">
                                {product.sku && <span className="font-mono">{product.sku}</span>}
                                {product.sku && product.material && <span>·</span>}
                                <span className="truncate max-w-[160px]">{product.material}</span>
                                {product.badge && (
                                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#4B2949]/10 text-[#4B2949] border border-[#4B2949]/20">
                                    {product.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-md border whitespace-nowrap ${product.category_id
                                ? 'bg-[#F5EEE7] border-[#E8D5C5] text-[#2D2024]/80'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                          >
                            {categoryName(product.category_id)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {product.price > 0 ? (
                            <>
                              <div className="font-semibold text-[#2D2024] tabular-nums">₹{product.price.toLocaleString('en-IN')}</div>
                              {discount > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] text-[#2D2024]/45 line-through">₹{(product.mrp as number).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] font-semibold text-emerald-700">{discount}% off</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap bg-[#FAF7F2] text-[#8A6F3C] border-[#E8D5C5] font-medium">
                              Price on Request
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border font-medium bg-stone-50 text-stone-600 border-stone-200">
                            {stock > 0 ? 'Atelier Catalogue' : 'Made to Order'}
                          </span>
                          <span className="block text-[10px] text-[#2D2024]/40 mt-1">{stock} {stock === 1 ? 'unit' : 'units'} (internal)</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Toggle
                            checked={!!product.is_featured}
                            disabled={togglingKey === `${product.id}:is_featured`}
                            loading={togglingKey === `${product.id}:is_featured`}
                            onChange={(next) => handleToggleFlag(product, 'is_featured', next)}
                            label={`Featured: ${product.title}`}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Toggle
                            checked={!!product.is_new_arrival}
                            disabled={togglingKey === `${product.id}:is_new_arrival`}
                            loading={togglingKey === `${product.id}:is_new_arrival`}
                            onChange={(next) => handleToggleFlag(product, 'is_new_arrival', next)}
                            label={`New arrival: ${product.title}`}
                          />
                        </td>
                        <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDate(product.created_at)}</td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-0.5">
                            <IconButton icon="open_in_new" title="View on store" href={`/product/${product.slug}`} external />
                            <IconButton icon="edit" title="Edit product" onClick={() => router.push(`/admin/products/${product.id}/edit`)} />
                            <IconButton
                              icon="content_copy"
                              title="Duplicate product"
                              loading={duplicatingId === product.id}
                              disabled={!!duplicatingId && duplicatingId !== product.id}
                              onClick={() => handleDuplicate(product)}
                            />
                            <IconButton icon="delete" title="Delete product" tone="danger" onClick={() => setDeletingProduct(product)} />
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
              noun="products"
            />
          </>
        )}
      </TableCard>

      <ConfirmDialog
        open={!!deletingProduct}
        title="Delete product?"
        message={
          <>
            Are you sure you want to remove <strong>“{deletingProduct?.title}”</strong> from the catalogue? This action is permanent.
          </>
        }
        confirmLabel="Confirm Delete"
        busy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProduct(null)}
      />

      <BulkProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
}
