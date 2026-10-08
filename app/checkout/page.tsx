"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { confirmOnlinePayment, createOrder, getUserOrders, orderTrackingPath, type PlacedOrder } from '@/lib/supabase/orderService';
import StateCitySelect from '@/components/ui/StateCitySelect';
import { canonicalState } from '@/lib/indianStatesCities';
import UseCurrentLocationButton, { type DetectedLocation } from '@/components/ui/UseCurrentLocationButton';
import AddressSuggestionsDropdown from '@/components/ui/AddressSuggestionsDropdown';
import { useAddressAutocomplete } from '@/lib/hooks/useAddressAutocomplete';
import { useStoreSettings } from '@/lib/hooks/useStoreSettings';
import { shippingFeeFor } from '@/lib/storeSettings';
import {
  CHECKOUT_FIELD_LABELS,
  CHECKOUT_FIELD_ORDER,
  normalizeIndianPhone,
  validateCheckout,
  type CheckoutField,
} from '@/lib/checkoutValidation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Razorpay's checkout.js adds this global once its script has loaded. */
type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => { on(event: string, handler: (response: { error: { description: string } }) => void): void; open(): void };
};

export default function CheckoutPage() {
  const { items, subtotal, tax, clearCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const [continueAsGuest, setContinueAsGuest] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const storeSettings = useStoreSettings();

  const [isProcessing, setIsProcessing] = useState(false);
  // Field-level validation: a field's error shows once it was visited (blur) or Place Order was pressed
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

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
  const { suggestions: addressSuggestions, isLoading: addressSuggestionsLoading } = useAddressAutocomplete(formData.address);

  // Shipping & payment rules come from Admin → Settings
  const shippingFee = shippingFeeFor(subtotal, storeSettings);
  const calculatedTotal = subtotal + tax + shippingFee;
  const { codEnabled, onlineEnabled, codMaxOrderValue, guestCodEnabled } = storeSettings.payments;
  // Admin → Settings → "Allow COD for Guest Users": when off, only signed-in customers may pay cash on delivery
  const guestCodBlocked = codEnabled && !user && !guestCodEnabled;
  const codAllowed = codEnabled && !guestCodBlocked && (codMaxOrderValue <= 0 || calculatedTotal <= codMaxOrderValue);
  const noPaymentMethod = !codAllowed && !onlineEnabled;
  const { minOrderValue } = storeSettings.orders;
  const belowMinimum = minOrderValue > 0 && subtotal < minOrderValue;
  // If the chosen method isn't available, fall back to the other one
  const paymentMethod: 'cod' | 'online' =
    formData.paymentMethod === 'cod' && !codAllowed ? 'online' : formData.paymentMethod === 'online' && !onlineEnabled ? 'cod' : formData.paymentMethod;

  // Signed-in customers: fill the email as soon as the session loads, and reuse the
  // name/phone/address from their most recent order so checkout is one tap.
  const prefilledFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || prefilledFor.current === user.id) return;
    prefilledFor.current = user.id;
    let active = true;

    getUserOrders(user.id, user.email)
      .then((orders) => {
        const last = orders[0]?.shipping_address;
        const metaName = (user.user_metadata?.full_name as string | undefined)?.trim();
        const metaPhone = (user.user_metadata?.phone as string | undefined)?.trim();
        if (!active) return;
        const [first = '', ...rest] = (last?.full_name || metaName || '').trim().split(' ');
        setFormData((prev) => ({
          ...prev,
          email: prev.email || user.email || '',
          firstName: prev.firstName || first,
          lastName: prev.lastName || rest.join(' '),
          phone: prev.phone || last?.phone || metaPhone || '',
          address: prev.address || last?.address || '',
          city: prev.city || last?.city || '',
          state: prev.state || canonicalState(last?.state) || last?.state || '',
          pincode: prev.pincode || last?.pincode || '',
        }));
      })
      .catch(() => {
        if (active) setFormData((prev) => ({ ...prev, email: prev.email || user.email || '' }));
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // PIN: digits only (max 6). Phone: only characters people actually type in a number.
    const next = name === 'pincode' ? value.replace(/\D/g, '').slice(0, 6) : name === 'phone' ? value.replace(/[^\d+\s()-]/g, '') : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  const errors = useMemo(() => validateCheckout(formData), [formData]);
  const visibleError = (field: CheckoutField) => (touched[field] || submitAttempted ? errors[field] : undefined);

  const FIELD_EXTRAS: Partial<Record<CheckoutField, React.InputHTMLAttributes<HTMLInputElement>>> = {
    email: { inputMode: 'email', autoComplete: 'email' },
    phone: { inputMode: 'tel', autoComplete: 'tel', maxLength: 18 },
    firstName: { autoComplete: 'given-name', maxLength: 50 },
    lastName: { autoComplete: 'family-name', maxLength: 50 },
    address: { autoComplete: 'street-address', maxLength: 200 },
    city: { autoComplete: 'address-level2', maxLength: 60 },
    state: { autoComplete: 'address-level1', maxLength: 60 },
    pincode: { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 },
  };

  /** Everything an input needs: id, value, handlers, error styling and accessibility attributes. */
  const fieldProps = (name: CheckoutField): React.InputHTMLAttributes<HTMLInputElement> => {
    const err = visibleError(name);
    return {
      id: `checkout-${name}`,
      name,
      value: formData[name],
      onChange: handleChange,
      onBlur: () => setTouched((prev) => ({ ...prev, [name]: true })),
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? `checkout-${name}-error` : undefined,
      className: `w-full bg-surface border rounded-lg px-4 py-2.5 text-on-surface focus:outline-none transition-colors text-sm ${
        err ? 'border-error focus:border-error bg-error-container/10' : 'border-outline-variant focus:border-primary'
      }`,
      ...FIELD_EXTRAS[name],
    };
  };

  const renderError = (name: CheckoutField) => {
    const err = visibleError(name);
    if (!err) return null;
    return (
      <p id={`checkout-${name}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-xs text-error">
        <span className="material-symbols-outlined text-[14px] leading-4">error</span>
        <span>{err}</span>
      </p>
    );
  };

  /** Everything after an order is saved (and, for online orders, paid): email, empty the bag, show the order. */
  const finishOrder = (placed: PlacedOrder) => {
    const targetId = placed.orderNumber || placed.orderId || 'latest';
    const summary = placed.order;

    // Send order confirmation email (non-blocking). Items and totals are the server's, so the email matches the order.
    if (summary) {
      fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: targetId,
          orderNumber: placed.orderNumber,
          trackingToken: placed.trackingToken,
          email: formData.email,
          firstName: formData.firstName,
          items: summary.items.map((item) => ({ title: item.title, metal: item.metal, size: item.size, quantity: item.quantity, price: item.price })),
          subtotal: summary.subtotal,
          tax: summary.tax,
          shippingFee: summary.shippingFee,
          paymentMethod,
          total: summary.total,
        }),
      }).catch((err) => console.error('Failed to send order email', err));
    }

    clearCart();
    showToast('🎉 Order placed successfully! Confirmation sent to your email.', 'success');
    router.push(orderTrackingPath(targetId, placed.trackingToken));
  };

  /** Opens the Razorpay window for the order the server created and priced. */
  const startOnlinePayment = (placed: PlacedOrder) => {
    const gateway = placed.razorpay;
    if (!gateway) {
      showToast('Could not start the payment. Please try again.', 'error');
      setIsProcessing(false);
      return;
    }

    let paymentHandled = false;
    const options = {
      key: gateway.keyId,
      amount: gateway.amount,
      currency: gateway.currency,
      name: storeSettings.store.name,
      description: storeSettings.store.tagline,
      image: storeSettings.store.logoUrl || `${window.location.origin}/logo.jpeg`,
      order_id: gateway.id,
      handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
        paymentHandled = true;
        // The window reporting "success" is only client-side JavaScript. The server checks the signature AND asks
        // Razorpay for the payment (right order, right amount) before the order is ever marked paid.
        const confirmed = await confirmOnlinePayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (!confirmed.success) {
          showToast('❌ Payment could not be verified. If money was debited, contact support with your payment ID: ' + response.razorpay_payment_id, 'error');
          setIsProcessing(false);
          return;
        }
        finishOrder(placed);
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        // Razorpay reads the number as +91XXXXXXXXXX (no spaces); with spaces it ignores it and asks the customer again
        contact: (normalizeIndianPhone(formData.phone) ?? formData.phone).replace(/[^\d+]/g, ''),
      },
      theme: {
        color: '#B99A62',
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          if (!paymentHandled) showToast('Payment was not completed. You have not been charged.', 'info');
        },
      },
    };

    try {
      const RazorpayCheckout = (window as RazorpayWindow).Razorpay;
      if (!RazorpayCheckout) throw new Error('Razorpay SDK is not loaded');
      const rzp = new RazorpayCheckout(options);
      rzp.on('payment.failed', function (response: { error: { description: string } }) {
        showToast(`Payment failed: ${response.error.description}`, 'error');
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay init error:', err);
      showToast('Error setting up payment. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as RazorpayWindow).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitAttempted(true);
    const badFields = CHECKOUT_FIELD_ORDER.filter((field) => errors[field]);
    if (badFields.length > 0) {
      showToast(`Please fix: ${badFields.map((field) => CHECKOUT_FIELD_LABELS[field]).join(', ')}.`, 'warning');
      const first = document.getElementById(`checkout-${badFields[0]}`);
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first?.focus({ preventScroll: true });
      return;
    }
    if (belowMinimum) {
      showToast(`The minimum order value is ₹${minOrderValue.toLocaleString('en-IN')}.`, 'error');
      return;
    }
    if (noPaymentMethod) {
      showToast('No payment method is available for this order. Please contact us to complete your purchase.', 'error');
      return;
    }

    setIsProcessing(true);

    // Load the payment window first, so we never save an order we then can't take payment for.
    if (paymentMethod === 'online') {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        showToast('Razorpay SDK failed to load. Are you online?', 'error');
        setIsProcessing(false);
        return;
      }
    }

    try {
      // The server prices the bag from the catalogue and saves the order; we only say what and how many.
      const placed = await createOrder({
        userId: user?.id || null,
        shippingAddress: {
          fullName: `${formData.firstName} ${formData.lastName}`.trim() || 'Valued Patron',
          email: formData.email,
          phone: normalizeIndianPhone(formData.phone) ?? formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          metal: item.metal || null,
          size: item.size || null,
        })),
        paymentMethod,
        notes: formData.notes,
      });

      if (!placed.success) {
        showToast(placed.error || 'Could not place order. Please try again.', 'error');
        setIsProcessing(false);
        return;
      }

      if (paymentMethod === 'online') {
        startOnlinePayment(placed);
      } else {
        finishOrder(placed);
      }
    } catch (err) {
      console.error('Order creation error:', err);
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
        ) : !user && !authLoading && !continueAsGuest ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-title-lg font-title-lg text-primary">How would you like to check out?</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">Your bag is saved — you can pick either way.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 flex flex-col">
                <span className="material-symbols-outlined text-secondary text-[28px] mb-3">shopping_bag</span>
                <h3 className="text-title-md font-title-lg text-primary mb-1">Continue as Guest</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed mb-6 flex-1">
                  No account needed. Enter your details, pay securely, and track your order later with a one-time code sent to your email.
                </p>
                <button
                  type="button"
                  onClick={() => setContinueAsGuest(true)}
                  className="w-full bg-primary text-surface py-3 rounded-full font-label-lg uppercase tracking-wider hover:bg-tertiary transition-colors"
                >
                  Continue as Guest
                </button>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 flex flex-col">
                <span className="material-symbols-outlined text-secondary text-[28px] mb-3">person</span>
                <h3 className="text-title-md font-title-lg text-primary mb-1">Login / Create Account</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed mb-6 flex-1">
                  Faster checkout with your saved details, your wishlist, and every order in one place.
                </p>
                <Link
                  href="/login"
                  className="w-full text-center border border-primary text-primary py-3 rounded-full font-label-lg uppercase tracking-wider hover:bg-surface-container-low transition-colors"
                >
                  Login / Sign Up
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">

            {/* Left: Checkout Form */}
            <div className="lg:col-span-7">
              <form id="checkout-form" onSubmit={handlePlaceOrder} noValidate className="space-y-8">

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

                  {user && (
                    <div className="flex items-center gap-2 mb-4 bg-surface-container-low border border-outline-variant/40 rounded-lg px-3.5 py-2.5">
                      <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                      <span className="text-xs sm:text-sm text-primary">
                        Signed in as <span className="font-semibold">{user.email}</span>
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="checkout-email" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Email Address *</label>
                      <input
                        type="email"
                        required
                        {...fieldProps('email')}
                        placeholder="your.email@domain.com"
                      />
                      {renderError('email')}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="checkout-phone" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        {...fieldProps('phone')}
                        placeholder="+91 98765 43210"
                      />
                      {renderError('phone')}
                    </div>
                  </div>
                </section>

                {/* Shipping Address */}
                <section className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 sm:p-6">
                  <h2 className="text-title-md font-title-lg text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-surface text-xs flex items-center justify-center font-bold">2</span>
                    Insured Delivery Address
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap bg-surface-container-low/60 border border-outline-variant/30 rounded-xl px-4 py-3 mb-4">
                    <UseCurrentLocationButton
                      onLocationDetected={(location: DetectedLocation) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: location.address,
                          city: location.city,
                          state: location.state,
                          pincode: location.pincode || prev.pincode,
                        }))
                      }
                    />
                    <p className="text-xs text-on-surface-variant">Auto-fill address, city, state &amp; pincode from your location.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkout-firstName" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">First Name *</label>
                      <input
                        type="text"
                        required
                        {...fieldProps('firstName')}
                        placeholder="Aditi"
                      />
                      {renderError('firstName')}
                    </div>
                    <div>
                      <label htmlFor="checkout-lastName" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Last Name *</label>
                      <input
                        type="text"
                        required
                        {...fieldProps('lastName')}
                        placeholder="Sharma"
                      />
                      {renderError('lastName')}
                    </div>
                    <div className="sm:col-span-2 relative">
                      <label htmlFor="checkout-address" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">Street Address / Suite *</label>
                      <input
                        type="text"
                        required
                        {...fieldProps('address')}
                        onFocus={() => setShowAddressSuggestions(true)}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, address: true }));
                          setShowAddressSuggestions(false);
                        }}
                        placeholder="House / Flat No., Luxury Avenue, Landmark"
                      />
                      <AddressSuggestionsDropdown
                        suggestions={addressSuggestions}
                        isLoading={addressSuggestionsLoading}
                        visible={showAddressSuggestions}
                        onPick={(s) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: s.address,
                            city: s.city || prev.city,
                            state: s.state || prev.state,
                            pincode: s.pincode || prev.pincode,
                          }))
                        }
                      />
                      {renderError('address')}
                    </div>
                    <StateCitySelect
                      idPrefix="checkout"
                      state={formData.state}
                      city={formData.city}
                      onChange={({ state, city }) => setFormData((prev) => ({ ...prev, state, city }))}
                      onBlurField={(field) => setTouched((prev) => ({ ...prev, [field]: true }))}
                      stateError={visibleError('state')}
                      cityError={visibleError('city')}
                      controlClass={(err) =>
                        `w-full bg-surface border rounded-lg px-4 py-2.5 text-on-surface focus:outline-none transition-colors text-sm ${
                          err ? 'border-error focus:border-error bg-error-container/10' : 'border-outline-variant focus:border-primary'
                        }`
                      }
                      labelClass="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block"
                      renderError={(field) => renderError(field)}
                      labels={{ state: 'State *', city: 'City *' }}
                    />
                    <div className="sm:col-span-2">
                      <label htmlFor="checkout-pincode" className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant mb-1.5 block">PIN Code *</label>
                      <input
                        type="text"
                        required
                        {...fieldProps('pincode')}
                        placeholder="400001"
                      />
                      {renderError('pincode')}
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
                    {noPaymentMethod && (
                      <p className="text-sm text-error bg-error-container/40 rounded-lg px-4 py-3">
                        Online and cash-on-delivery payments are currently unavailable. Please contact our concierge to place this order.
                      </p>
                    )}
                    {guestCodBlocked && (
                      <div className="flex items-start gap-3.5 p-4 rounded-xl border border-outline-variant/50 bg-surface-container-low/60" aria-disabled="true">
                        <input type="radio" name="paymentMethod" value="cod" disabled checked={false} readOnly className="mt-1" aria-label="Cash on Delivery (not available for guests)" />
                        <div className="flex-1">
                          <span className="flex items-center gap-1.5 font-label-md text-on-surface-variant font-semibold">
                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">lock</span>
                            Cash on Delivery (COD)
                          </span>
                          <p role="note" className="text-xs text-on-surface-variant mt-1">
                            COD is not available for guest users. Please login or create an account to use Cash on Delivery.
                          </p>
                          <Link href="/login" className="inline-block mt-2 text-xs font-semibold text-primary underline underline-offset-2 hover:text-secondary">
                            Login / Create Account
                          </Link>
                        </div>
                      </div>
                    )}
                    {codEnabled && !guestCodBlocked && !codAllowed && (
                      <p className="text-xs text-on-surface-variant">
                        Cash on Delivery is available for orders up to ₹{codMaxOrderValue.toLocaleString('en-IN')}.
                      </p>
                    )}
                    {/* Option 1: COD */}
                    {codAllowed && (
                      <label className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod'
                          ? 'border-primary bg-surface-container-low shadow-sm'
                          : 'border-outline-variant/50 hover:border-outline-variant'
                        }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
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
                    )}

                    {/* Option 2: Online / Card */}
                    {onlineEnabled && (
                      <label className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'online'
                          ? 'border-primary bg-surface-container-low shadow-sm'
                          : 'border-outline-variant/50 hover:border-outline-variant'
                        }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === 'online'}
                          onChange={handleChange}
                          className="mt-1 accent-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-label-md text-primary font-semibold">Credit / Debit Card / UPI</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Instant Confirmation</span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">Pay securely via Razorpay (Credit/Debit Card, UPI, NetBanking).</p>


                        </div>
                      </label>
                    )}
                  </div>
                </section>
              </form>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5">
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
                    <span>GST ({storeSettings.commerce.gstRate}% jewellery tax)</span>
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

                {belowMinimum && (
                  <p className="mt-4 text-xs text-error bg-error-container/40 rounded-lg px-3 py-2">
                    Add ₹{(minOrderValue - subtotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })} more to reach the minimum order value of ₹{minOrderValue.toLocaleString('en-IN')}.
                  </p>
                )}

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing || noPaymentMethod || belowMinimum}
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
