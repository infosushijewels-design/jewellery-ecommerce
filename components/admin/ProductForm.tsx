"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminGetProductVariants,
  adminSaveProductVariants,
  Product,
} from '@/lib/supabase/orderService';
import { useToast } from '@/lib/context/ToastContext';
import { ImageUploader, MultiImageUploader } from '@/components/admin/ImageUploader';

const splitList = (value: string) => value.split(',').map((v) => v.trim()).filter(Boolean);

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialProduct?: Product | null;
}

interface FormState {
  title: string;
  sku: string;
  price: string;
  mrp: string;
  stock: string;
  material: string;
  certification: string;
  badge: string;
  imageUrl: string;
  galleryImages: string;
  availableSizes: string;
  categoryId: string;
  collectionId: string;
  description: string;
  isFeatured: boolean;
  isNewArrival: boolean;
}

interface VariantRow {
  id?: string;
  sku: string;
  skuManual: boolean;
  karat: string;
  metalColor: string;
  weight: string;
  price: string;
  stock: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  sku: '',
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
  collectionId: '',
  description: 'Meticulously set in hallmarked gold and accompanied by international authenticity certification.',
  isFeatured: false,
  isNewArrival: true,
};

function productToForm(product: Product): FormState {
  return {
    title: product.title,
    sku: product.sku || '',
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
    collectionId: product.collection_id || '',
    description: product.description || '',
    isFeatured: product.is_featured || false,
    isNewArrival: product.is_new_arrival || false,
  };
}

// Auto-generate a URL-safe slug from the product title — the admin form no
// longer exposes a manual slug field, so this is the single source of truth.
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Suggests a variant SKU from the base product SKU + karat/metal color, e.g.
// base "R-101" + karat "18K" + metal color "Yellow Gold" -> "R-101-18KYG".
// Purely a starting point — the admin can always overwrite it by hand.
function generateVariantSku(baseSku: string, karat: string, metalColor: string): string {
  const karatPart = karat.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const colorPart = metalColor
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
  const suffix = `${karatPart}${colorPart}`;
  const base = baseSku.trim();
  if (!suffix) return base;
  return base ? `${base}-${suffix}` : suffix;
}

export default function ProductForm({ mode, productId, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialProduct ? productToForm(initialProduct) : EMPTY_FORM);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  useEffect(() => {
    if (initialProduct) {
      setForm(productToForm(initialProduct));
    }
  }, [initialProduct]);

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const [cats, cols] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('collections').select('id, name').order('name'),
      ]);
      setCategories(cats.data || []);
      setCollections(cols.data || []);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !productId) return;
    async function loadVariants() {
      const rows = await adminGetProductVariants(productId!);
      setVariants(
        rows.map((v) => ({
          id: v.id,
          sku: v.sku || '',
          // Existing saved variants keep their stored SKU as-is; only fresh rows auto-fill.
          skuManual: true,
          karat: v.karat || '',
          metalColor: v.metal_color || '',
          weight: v.weight != null ? String(v.weight) : '',
          price: v.price != null ? String(v.price) : '',
          stock: String(v.stock ?? 0),
        }))
      );
    }
    loadVariants();
  }, [mode, productId]);

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: generateVariantSku(form.sku, '', ''),
        skuManual: false,
        karat: '',
        metalColor: '',
        weight: '',
        price: '',
        stock: '',
      },
    ]);
  };

  const updateVariantRow = (index: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === 'sku') {
          return { ...row, sku: value, skuManual: value.trim().length > 0 };
        }
        const updated: VariantRow = { ...row, [field]: value };
        if (!row.skuManual && (field === 'karat' || field === 'metalColor')) {
          updated.sku = generateVariantSku(form.sku, updated.karat, updated.metalColor);
        }
        return updated;
      })
    );
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      showToast('Please upload a main product image', 'error');
      return;
    }
    setIsSubmitting(true);

    const slug = slugify(form.title) || `jewel-${Date.now()}`;

    const productPayload = {
      title: form.title,
      slug,
      sku: form.sku.trim() || null,
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
      collection_id: form.collectionId || null,
      description: form.description,
      is_featured: form.isFeatured,
      is_new_arrival: form.isNewArrival,
    };

    const variantsPayload = variants
      .filter((v) => v.sku.trim() || v.karat.trim() || v.metalColor.trim() || v.weight.trim() || v.price.trim() || v.stock.trim())
      .map((v) => ({
        sku: v.sku.trim() || null,
        karat: v.karat.trim() || null,
        metal_color: v.metalColor.trim() || null,
        weight: v.weight.trim() ? Number(v.weight) : null,
        price: v.price.trim() ? Number(v.price) : null,
        stock: Number(v.stock) || 0,
      }));

    try {
      if (mode === 'edit' && productId) {
        const res = await adminUpdateProduct(productId, productPayload);
        if (res.success) {
          await adminSaveProductVariants(productId, variantsPayload);
          showToast('Product successfully updated in the atelier collection!', 'success');
          router.push('/admin/products');
        } else {
          showToast(res.error || 'Failed to update product', 'error');
        }
      } else {
        const res = await adminCreateProduct(productPayload);
        if (res.success) {
          if (res.id) {
            await adminSaveProductVariants(res.id, variantsPayload);
          }
          showToast('New jewellery piece added to catalog!', 'success');
          router.push('/admin/products');
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

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex items-center gap-4 border-b border-[#E8D5C5] pb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="p-2 rounded-xl bg-[#F5EEE7] hover:bg-[#E8D5C5]/50 text-[#2D2024]/65 hover:text-[#2D2024] border border-[#E8D5C5] transition-colors flex-shrink-0"
          aria-label="Back to products"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8A6F3C] font-semibold">Inventory Management</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2024] tracking-wide">
            {mode === 'edit' ? 'Edit Jewellery Piece' : 'Add New High Jewellery Piece'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (60%) */}
        <div className="lg:col-span-3 bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-6 space-y-4 h-fit">
          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Royal Nizam Emerald Necklace"
              className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
            />
            {form.title.trim() && (
              <p className="text-[11px] text-[#2D2024]/50 mt-1 font-mono">/product/{slugify(form.title)}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Product SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="R-101"
                className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] font-mono focus:outline-none focus:border-[#B99A62]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Collection</label>
            <select
              value={form.collectionId}
              onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
              className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
            >
              <option value="">No collection</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#2D2024]/50 mt-1">Shown on /collections/… pages, e.g. Bridal or Best Sellers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Price (₹ INR) *</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="125000"
                className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">MRP (₹ INR, for strikethrough)</label>
              <input
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                placeholder="150000"
                className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Stock Count</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="10"
              className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Material & Craft</label>
              <input
                type="text"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="18K Yellow Gold & Solitaire"
                className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Certification Badge</label>
              <input
                type="text"
                value={form.certification}
                onChange={(e) => setForm({ ...form, certification: e.target.value })}
                placeholder="BIS 916 & SGL Certified"
                className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
            />
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-2 bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-6 space-y-4 h-fit">
          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Main Image *</label>
            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
              folder="products"
              label="Upload main image"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">
              Gallery Images <span className="normal-case text-[#2D2024]/50">(other angles)</span>
            </label>
            <MultiImageUploader
              values={splitList(form.galleryImages)}
              onChange={(urls) => setForm((prev) => ({ ...prev, galleryImages: urls.join(', ') }))}
              folder="products/gallery"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">
              Available Sizes <span className="normal-case text-[#2D2024]/50">(comma-separated, e.g. 10, 12, 14)</span>
            </label>
            <input
              type="text"
              value={form.availableSizes}
              onChange={(e) => setForm({ ...form, availableSizes: e.target.value })}
              placeholder="10, 12, 14, 16, 18"
              className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[#2D2024]/65 block mb-1">Badge Label</label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              placeholder="Signature"
              className="w-full bg-white border border-[#E8D5C5] rounded-xl px-4 py-2.5 text-sm text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-[#2D2024]/65">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                className="accent-[#B99A62] rounded"
              />
              <span>Mark as New Arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-[#2D2024]/65">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-[#B99A62] rounded"
              />
              <span>Feature on Homepage</span>
            </label>
          </div>
        </div>

        {/* Product Variants */}
        <div className="lg:col-span-5 bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#2D2024] uppercase tracking-wider">Product Variants</h3>
              <p className="text-xs text-[#2D2024]/50 mt-0.5">Optional — add karat, metal color, weight, or price/stock overrides for this piece.</p>
            </div>
            <button
              type="button"
              onClick={addVariantRow}
              className="bg-[#F5EEE7] hover:bg-[#E8D5C5]/50 text-[#8A6F3C] border border-[#B99A62]/40 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-[#2D2024]/50 py-4 text-center border border-dashed border-[#E8D5C5] rounded-xl">
              No variants added. This piece will use the base price and stock above.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id || index} className="bg-white border border-[#E8D5C5] rounded-xl p-3 space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                    <div className="sm:col-span-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#2D2024]/50 block mb-1">Karat</label>
                      <input
                        type="text"
                        value={variant.karat}
                        onChange={(e) => updateVariantRow(index, 'karat', e.target.value)}
                        placeholder="18K"
                        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-lg px-2.5 py-2 text-xs text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase tracking-wider text-[#2D2024]/50 block mb-1">Metal Color</label>
                      <input
                        type="text"
                        value={variant.metalColor}
                        onChange={(e) => updateVariantRow(index, 'metalColor', e.target.value)}
                        placeholder="Rose Gold"
                        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-lg px-2.5 py-2 text-xs text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#2D2024]/50 block mb-1">Weight (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.weight}
                        onChange={(e) => updateVariantRow(index, 'weight', e.target.value)}
                        placeholder="5.2"
                        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-lg px-2.5 py-2 text-xs text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#2D2024]/50 block mb-1">Price Override</label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariantRow(index, 'price', e.target.value)}
                        placeholder="₹"
                        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-lg px-2.5 py-2 text-xs text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#2D2024]/50 block mb-1">Stock</label>
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(e) => updateVariantRow(index, 'stock', e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-lg px-2.5 py-2 text-xs text-[#2D2024] focus:outline-none focus:border-[#B99A62]"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#2D2024]/50 block mb-1">
                        Variant SKU {!variant.skuManual && variant.sku && <span className="text-[#8A6F3C]/70 normal-case">(auto)</span>}
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariantRow(index, 'sku', e.target.value)}
                        placeholder="R-101-18KYG"
                        className="w-full bg-[#FFFCF7] border border-[#E8D5C5] rounded-lg px-2.5 py-2 text-xs text-[#2D2024] font-mono focus:outline-none focus:border-[#B99A62]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariantRow(index)}
                      aria-label="Remove variant"
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="lg:col-span-5 flex justify-end gap-3 border-t border-[#E8D5C5] pt-6">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="bg-[#F5EEE7] hover:bg-[#E8D5C5]/50 text-[#2D2024]/65 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Piece' : 'Add to Boutique'}
          </button>
        </div>
      </form>
    </div>
  );
}
