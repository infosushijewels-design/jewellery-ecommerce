import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ProductActions from '@/components/product/ProductActions';
import { getProductBySlug } from '@/lib/supabase/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 lg:px-16 pt-6 pb-20">
        <nav aria-label="Breadcrumb" className="py-2 mb-8 border-b border-outline-variant/30 pb-4">
          <ol className="flex items-center space-x-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="text-outline">/</span></li>
            <li><Link href="/new-arrivals" className="hover:text-primary transition-colors">Jewellery</Link></li>
            <li><span className="text-outline">/</span></li>
            <li aria-current="page" className="text-primary font-bold">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Image Gallery */}
          <div className="sticky top-24 bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden group">
            <div className="aspect-square relative w-full h-full">
              <img 
                src={product.image_url} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {product.badge && (
                <div className="absolute top-6 left-6">
                  <span className="bg-surface px-4 py-1.5 rounded-full text-label-sm font-label-sm border border-secondary text-primary uppercase shadow-sm">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Details & Actions */}
          <div className="flex flex-col pt-4 lg:pt-8">
            <div className="space-y-4 mb-8">
              <h1 className="text-headline-lg md:text-display-md text-primary font-normal leading-tight">
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
              <span className="text-display-sm text-primary">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="block text-label-md font-label-md text-on-surface-variant mt-1">Inclusive of all taxes</span>
            </div>

            <ProductActions product={{
              id: product.id,
              title: product.title,
              price: product.price,
              imageUrl: product.image_url
            }} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
