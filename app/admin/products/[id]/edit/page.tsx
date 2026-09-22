"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Product } from '@/lib/supabase/orderService';
import ProductForm from '@/components/admin/ProductForm';

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.from('products').select('*').eq('id', params.id).single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setProduct(data);
      }
      setLoading(false);
    }
    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#2D2024]/60">
        <span className="material-symbols-outlined text-3xl animate-spin text-[#B99A62] mb-2">progress_activity</span>
        <p className="text-xs">Loading jewellery piece...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="py-20 text-center text-[#2D2024]/60 space-y-4">
        <span className="material-symbols-outlined text-4xl text-[#2D2024]/30">diamond</span>
        <p className="text-sm">Jewellery piece not found.</p>
        <button
          onClick={() => router.push('/admin/products')}
          className="bg-[#2D2024] text-[#FAF7F2] hover:bg-[#4B2949] px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  return <ProductForm mode="edit" productId={product.id} initialProduct={product} />;
}
