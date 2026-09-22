import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductActions from '@/components/product/ProductActions';
import ProductGallery from '@/components/product/ProductGallery';
import { getProductBySlug } from '@/lib/supabase/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const galleryImages = Array.from(new Set([product.image_url, ...(product.gallery_images || [])]));
  const hasDiscount = !!product.mrp && product.mrp > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
  const discountAmount = hasDiscount ? product.mrp! - product.price : 0;

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-8 border-b border-outline-variant/30 pb-4">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li><Link href="/new-arrivals" className="hover:text-primary transition-colors">Jewellery</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-start">
          {/* Left: Image Gallery */}
          <ProductGallery images={galleryImages} alt={product.title} badge={product.badge} />

          {/* Right: Product Details & Actions */}
          <div className="flex flex-col pt-4 lg:pt-8">
            <div className="space-y-4 mb-8">
              {(product.is_new_arrival || product.is_featured) && (
                <div className="flex items-center gap-2">
                  {product.is_new_arrival && (
                    <span className="bg-green-700 text-green-50 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wide">
                      New
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="bg-purple-700 text-purple-50 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wide">
                      Featured
                    </span>
                  )}
                </div>
              )}
              <h1 className="text-[26px] sm:text-headline-lg md:text-display-md text-primary font-normal leading-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                  {product.material}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <div className="flex items-center gap-1.5 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                  {product.certification || 'Certified'}
                </div>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                {product.description || 'Masterfully crafted to reflect brilliance from every angle. This exquisite piece embodies timeless elegance, making it a perfect addition to any collection.'}
              </p>
            </div>

            <div className="py-6 border-y border-outline-variant/30">
              <div className="flex items-center flex-wrap gap-3">
                <span className="text-[28px] sm:text-[36px] font-headline-md text-primary">₹{product.price.toLocaleString('en-IN')}</span>
                {hasDiscount && (
                  <>
                    <span className="text-[18px] sm:text-headline-sm text-on-surface-variant line-through">
                      ₹{product.mrp!.toLocaleString('en-IN')}
                    </span>
                    <span className="bg-emerald-700 text-emerald-50 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wide">
                      Save {discountPercent}% · ₹{discountAmount.toLocaleString('en-IN')} OFF
                    </span>
                  </>
                )}
                {product.stock <= 0 ? (
                  <span className="bg-red-700 text-red-50 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wide">
                    Sold Out
                  </span>
                ) : product.stock <= 3 ? (
                  <span className="bg-amber-500 text-amber-950 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wide">
                    Only {product.stock} Left
                  </span>
                ) : null}
              </div>
              <span className="block text-label-md font-label-md text-on-surface-variant mt-1">Inclusive of all taxes</span>
            </div>

            <ProductActions product={{
              id: product.id,
              title: product.title,
              price: product.price,
              imageUrl: product.image_url,
              stock: product.stock,
              availableSizes: product.available_sizes,
            }} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
