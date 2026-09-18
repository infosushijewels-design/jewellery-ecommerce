"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { createOrder } from '@/lib/supabase/orderService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, subtotal, tax, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod' as 'cod' | 'online',
    cardNumber: '4242 •••• •••• 4242',
    notes: '',
  });

  // Calculate Shipping: Free for orders >= ₹2000, else ₹99
  const shippingFee = subtotal >= 2000 || subtotal === 0 ? 0 : 99;
  const calculatedTotal = subtotal + tax + shippingFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsProcessing(true);

    try {
      const res = await createOrder({
        userId: user?.id || null,
        shippingAddress: {
          fullName: `${formData.firstName} ${formData.lastName}`.trim() || 'Valued Patron',
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: items.map((item) => ({
          productId: item.id.length === 36 ? item.id : null,
          title: item.title,
          imageUrl: item.imageUrl,
          price: item.price,
          quantity: item.quantity,
          metal: item.metal || null,
          size: item.size || null,
        })),
        subtotal,
        tax,
        shippingFee,
        total: calculatedTotal,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'online' ? 'paid' : 'pending',
        notes: formData.notes,
      });

      if (res.success) {
        clearCart();
        showToast('Your order has been placed with Sushi Jewels!', 'success');
        const targetId = res.orderNumber || res.orderId || 'latest';
        router.push(`/orders/${targetId}`);
      } else {
        showToast(res.error || 'Could not place order. Please try again.', 'error');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast('An unexpected error occurred while placing your order.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-6 sm:pt-8 pb-16 sm:pb-24">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-[22px] sm:text-headline-md font-headline-md text-primary">Checkout</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Complete your acquisition with complimentary insured shipping.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-label-sm text-primary bg-surface-container-low px-3.5 py-1.5 rounded-full border border-outline-variant/50">
            <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 max-w-lg mx-auto">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">shopping_bag</span>
            <h2 className="text-title-lg font-title-lg text-primary mb-2">Your Jewellery Bag is Empty</h2>
            <p className="text-body-md text-on-surface-variant mb-6">Explore our curated collections of diamond and gold high jewellery.</p>
            <Link 
              href="/new-arrivals" 
              className="inline-block bg-primary text-surface px-8 py-3 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors"
            >
              Discover High Jewellery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
            
            {/* Left: Checkout Form */}
            <div className="lg:col-span-7">
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
                
                {/* Contact Information */}
                <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-title-md font-title-lg text-primary uppercase tracking-wider flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-surface text-xs flex items-center justify-center font-bold">1</span>
                      Contact Information
                    </h2>
                    {!user && (
                      <Link href="/login" className="text-xs text-tertiary hover:underline font-medium">
                        Have an account? Sign In
                      </Link>
                    )}
                  </div>

                  {user ? (
                    <div className="flex items-center gap-2 mb-4 bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5">
                      <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                      <span className="text-xs sm:text-sm text-primary">
                        Signed in as <span className="font-semibold">{user.email}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 mb-4 bg-secondary-container/40 border border-secondary/30 rounded-lg px-3.5 py-2.5">
                      <span className="material-symbols-outlined text-secondary text-[18px] flex-shrink-0">devices</span>
                      <span className="text-xs sm:text-sm text-primary leading-relaxed">
                        Ordering as Guest • Order details will be saved to this device and emailed to you.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Email Address *</label>
                      <input 
                        type="email" 
                        name="email"
                        required 
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@domain.com"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Mobile Number *</label>
                      <input 
                        type="tel" 
                        name="phone"
                        required 
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                  </div>
                </section>

                {/* Shipping Address */}
                <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <h2 className="text-title-md font-title-lg text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-surface text-xs flex items-center justify-center font-bold">2</span>
                    Insured Delivery Address
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">First Name *</label>
                      <input 
                        type="text" 
                        name="firstName"
                        required 
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Aditi"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Last Name *</label>
                      <input 
                        type="text" 
                        name="lastName"
                        required 
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Sharma"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Street Address / Suite *</label>
                      <input 
                        type="text" 
                        name="address"
                        required 
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="House / Flat No., Luxury Avenue, Landmark"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">City *</label>
                      <input 
                        type="text" 
                        name="city"
                        required 
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">State *</label>
                      <input 
                        type="text" 
                        name="state"
                        required 
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Maharashtra"
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">PIN Code *</label>
                      <input 
                        type="text" 
                        name="pincode"
                        required 
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="400001"
                        maxLength={6}
                        className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm" 
                      />
                    </div>
                  </div>
                </section>

                {/* Payment Method */}
                <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <h2 className="text-title-md font-title-lg text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-surface text-xs flex items-center justify-center font-bold">3</span>
                    Payment Method
                  </h2>
                  
                  <div className="space-y-3 mb-4">
                    {/* Option 1: COD */}
                    <label className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'cod' 
                        ? 'border-primary bg-surface-container-low shadow-sm' 
                        : 'border-outline-variant/50 hover:border-outline-variant'
                    }`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cod"
                        checked={formData.paymentMethod === 'cod'} 
                        onChange={handleChange}
                        className="mt-1 accent-primary" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-primary font-semibold">Cash on Delivery (COD)</span>
                          <span className="text-xs bg-tertiary/10 text-tertiary px-2 py-0.5 rounded font-medium">Safe & Convenient</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">Pay with cash or UPI at your doorstep upon delivery verification.</p>
                      </div>
                    </label>

                    {/* Option 2: Online / Card */}
                    <label className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'online' 
                        ? 'border-primary bg-surface-container-low shadow-sm' 
                        : 'border-outline-variant/50 hover:border-outline-variant'
                    }`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="online"
                        checked={formData.paymentMethod === 'online'} 
                        onChange={handleChange}
                        className="mt-1 accent-primary" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-primary font-semibold">Credit / Debit Card / UPI</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Instant Confirmation</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">Simulated instant card checkout (Demo mode enabled).</p>
                        
                        {formData.paymentMethod === 'online' && (
                          <div className="mt-3 pt-3 border-t border-outline-variant/30 space-y-2">
                            <label className="text-[11px] uppercase tracking-wider text-on-surface-variant block">Simulated Card Number</label>
                            <input 
                              type="text" 
                              disabled 
                              value="4111 •••• •••• 1111 (Test Card)" 
                              className="w-full bg-surface border border-outline-variant/60 rounded px-3 py-1.5 text-xs text-on-surface"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </section>
              </form>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5 order-first lg:order-last">
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6 sticky top-24 shadow-sm">
                <h2 className="text-title-md font-title-lg text-primary mb-4 uppercase tracking-widest border-b border-outline-variant/30 pb-3">Order Bag ({items.length})</h2>
                
                <div className="space-y-3.5 mb-6 max-h-[35vh] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3.5 pb-3 border-b border-outline-variant/20 last:border-none">
                      <div className="w-16 h-16 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/30">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-label-sm text-primary truncate font-semibold">{item.title}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Qty: {item.quantity} {item.metal && `• ${item.metal}`} {item.size && `• Size ${item.size}`}
                        </p>
                        <p className="font-label-sm text-tertiary font-bold mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-outline-variant/30 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>GST (3% jewellery tax)</span>
                    <span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Insured Shipping</span>
                    <span className={shippingFee === 0 ? 'text-tertiary font-medium' : ''}>
                      {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                    </span>
                  </div>
                  {shippingFee === 0 && (
                    <p className="text-[11px] text-tertiary italic">✓ Qualified for complimentary insured transit</p>
                  )}
                  <div className="flex justify-between text-headline-sm text-primary border-t border-outline-variant/30 pt-3 font-semibold">
                    <span>Total</span>
                    <span>₹{calculatedTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className="w-full bg-primary text-surface py-3.5 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors mt-6 disabled:opacity-50 flex justify-center items-center gap-2 shadow-md cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Securing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Place Order</span>
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </>
                  )}
                </button>
                
                <p className="text-[11px] text-center text-on-surface-variant mt-3 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">workspace_premium</span>
                  100% BIS Hallmarked & Certified Authentic
                </p>
              </div>
            </div>

          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
