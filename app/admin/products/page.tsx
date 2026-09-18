"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adminCreateProduct, adminUpdateProduct, adminDeleteProduct, Product } from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    price: '',
    mrp: '',
    stock: '10',
    material: '18K Yellow Gold & Solitaire Diamonds',
    certification: 'BIS 916 & SGL Certified',
    badge: 'Signature',
    imageUrl: '',
    galleryImages: '',
    availableSizes: '',
    categoryId: '',
    description: '',
    isFeatured: false,
    isNewArrival: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error loading products/categories:', err);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setForm({
      title: '',
      slug: '',
      price: '',
      mrp: '',
      stock: '10',
      material: '18K Yellow Gold & Solitaire Diamonds',
      certification: 'BIS 916 & SGL Certified',
      badge: 'Signature',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
      galleryImages: '',
      availableSizes: '',
      categoryId: categories[0]?.id || '',
      description: 'Meticulously set in hallmarked gold and accompanied by international authenticity certification.',
      isFeatured: false,
      isNewArrival: true,
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      slug: product.slug,
      price: String(product.price),
      mrp: product.mrp != null ? String(product.mrp) : '',
      stock: String(product.stock ?? 10),
      material: product.material,
      certification: product.certification || 'BIS 916 Certified',
      badge: product.badge || '',
      imageUrl: product.image_url,
      galleryImages: (product.gallery_images || []).join(', '),
      availableSizes: (product.available_sizes || []).join(', '),
      categoryId: product.category_id || '',
      description: product.description || '',
      isFeatured: product.is_featured || false,
      isNewArrival: product.is_new_arrival || false,
    });
    setIsAddModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setForm((prev) => ({
      ...prev,
      title,
      slug: editingProduct ? prev.slug : slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const productPayload = {
      title: form.title,
      slug: form.slug || `jewel-${Date.now()}`,
      price: Number(form.price) || 0,
      mrp: form.mrp.trim() ? Number(form.mrp) : null,
      stock: Number(form.stock) || 0,
      material: form.material,
      certification: form.certification,
      badge: form.badge || null,
      image_url: form.imageUrl,
      gallery_images: form.galleryImages
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
      available_sizes: form.availableSizes
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean),
      category_id: form.categoryId || null,
      description: form.description,
      is_featured: form.isFeatured,
      is_new_arrival: form.isNewArrival,
    };

    try {
      if (editingProduct) {
        const res = await adminUpdateProduct(editingProduct.id, productPayload);
        if (res.success) {
          showToast('Product successfully updated in the atelier collection!', 'success');
          setIsAddModalOpen(false);
          loadData();
        } else {
          showToast(res.error || 'Failed to update product', 'error');
        }
      } else {
        const res = await adminCreateProduct(productPayload);
        if (res.success) {
          showToast('New jewellery piece added to catalog!', 'success');
          setIsAddModalOpen(false);
          loadData();
        } else {
          showToast(res.error || 'Failed to add product', 'error');
        }
      }
    } catch {
      showToast('Error saving product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.material.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Inventory Management</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">Jewellery Catalog</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage luxury pieces, pricing, metals, hallmarking badges, and new arrivals.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-amber-400 text-black hover:bg-amber-300 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Add New Piece</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-[#17171A] p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search jewellery by name, gold carat, diamond..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline">
          Showing {filteredProducts.length} of {products.length} pieces
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-[#17171A] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <span className="material-symbols-outlined text-3xl animate-spin text-amber-400 mb-2">progress_activity</span>
            <p className="text-xs">Loading catalogue records...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-500">diamond</span>
            <p className="text-sm">No jewellery pieces found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[11px] bg-white/[0.02]">
                  <th className="py-3.5 px-4">Piece</th>
                  <th className="py-3.5 px-4">Material & Hallmarking</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status & Tags</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-[#121214] border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white font-serif">{product.title}</h4>
                          <span className="text-[11px] text-gray-400 font-mono">/product/{product.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-300 font-medium">{product.material}</div>
                      <div className="text-xs text-amber-400">{product.certification || 'BIS 916'}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                      {product.mrp != null && product.mrp > product.price && (
                        <div className="text-[11px] text-gray-500 line-through font-normal">
                          ₹{Number(product.mrp).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase ${
                          product.stock !== undefined && product.stock !== null && product.stock <= 0
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : product.stock !== undefined && product.stock !== null && product.stock <= 3
                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {product.stock !== undefined && product.stock !== null
                          ? product.stock <= 0
                            ? 'Sold Out'
                            : `${product.stock} in stock`
                          : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {product.is_new_arrival && (
                          <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                            New Arrival
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="bg-purple-400/15 text-purple-300 border border-purple-400/30 text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                            Featured
                          </span>
                        )}
                        {product.badge && (
                          <span className="bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded font-medium">
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(product)}
                        className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors border border-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#17171A] border border-white/15 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-serif font-bold text-white">
                {editingProduct ? 'Edit Jewellery Piece' : 'Add New High Jewellery Piece'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Royal Nizam Emerald Necklace"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="125000"
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">MRP (₹ INR, for strikethrough)</label>
                  <input
                    type="number"
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    placeholder="150000"
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="10"
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Material & Craft</label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="18K Yellow Gold & Solitaire"
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Certification Badge</label>
                  <input
                    type="text"
                    value={form.certification}
                    onChange={(e) => setForm({ ...form, certification: e.target.value })}
                    placeholder="BIS 916 & SGL Certified"
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {form.imageUrl && (
                <div className="flex items-center gap-3 p-3 bg-[#121214] rounded-xl border border-white/10">
                  <img src={form.imageUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                  <span className="text-xs text-gray-400">Image Preview</span>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">
                  Gallery Image URLs <span className="normal-case text-gray-500">(comma-separated)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.galleryImages}
                  onChange={(e) => setForm({ ...form, galleryImages: e.target.value })}
                  placeholder="https://.../angle-2.jpg, https://.../angle-3.jpg"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">
                  Available Sizes <span className="normal-case text-gray-500">(comma-separated, e.g. 10, 12, 14)</span>
                </label>
                <input
                  type="text"
                  value={form.availableSizes}
                  onChange={(e) => setForm({ ...form, availableSizes: e.target.value })}
                  placeholder="10, 12, 14, 16, 18"
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                    className="accent-amber-400 rounded"
                  />
                  <span>Mark as New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="accent-amber-400 rounded"
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-400 text-black hover:bg-amber-300 px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Piece' : 'Add to Boutique'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#17171A] border border-red-500/30 rounded-2xl max-w-md w-full p-6 space-y-4">
            <span className="material-symbols-outlined text-3xl text-red-400">warning</span>
            <h3 className="text-lg font-serif font-bold text-white">Delete Jewellery Piece</h3>
            <p className="text-xs sm:text-sm text-gray-300">
              Are you sure you wish to remove <span className="font-semibold text-white">&quot;{deletingProduct.title}&quot;</span> from the atelier catalog? This action is permanent.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setDeletingProduct(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
