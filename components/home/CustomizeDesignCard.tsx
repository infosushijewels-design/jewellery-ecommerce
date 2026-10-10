'use client';

import React, { useState, useRef, useTransition } from 'react';

const METALS = [
  { id: 'yellow-gold', label: 'Yellow Gold', color: '#D4AF37' },
  { id: 'white-gold', label: 'White Gold', color: '#E5E4E2' },
  { id: 'rose-gold', label: 'Rose Gold', color: '#B76E79' },
];

const DIAMONDS = [
  { id: 'natural', label: 'Natural Diamond' },
  { id: 'lab-grown', label: 'Lab-Grown Diamond' },
];

const BUDGETS = [
  'Flexible / Recommend For Me',
  'Under ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000 – ₹5,00,000',
  '₹5,00,000+',
];

export default function CustomizeDesignCard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metal, setMetal] = useState('Yellow Gold');
  const [diamond, setDiamond] = useState('Natural Diamond');
  const [budget, setBudget] = useState('Flexible / Recommend For Me');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit.');
      return;
    }
    setError(null);
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (dropped.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit.');
      return;
    }
    setError(null);
    setFile(dropped);
    if (dropped.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(dropped));
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('phone', cleanPhone);
        formData.append('metal', metal);
        formData.append('diamond', diamond);
        formData.append('budget', budget);
        formData.append('notes', notes);
        if (file) formData.append('sketch', file);

        const res = await fetch('/api/custom-design', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setSubmitted(true);
        } else {
          setError(data.error || 'Failed to submit. Please try again.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      }
    });
  };

  const waNumber = '919166967234';
  const waText = encodeURIComponent(
    `Hello Sushi Jewels, I submitted a custom design request!\nName: ${name || 'Customer'}\nMetal: ${metal}\nStone: ${diamond}\nBudget: ${budget}\nI would like to discuss my custom jewellery piece.`
  );

  return (
    <section className="py-12 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="customize-design">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-[0_12px_36px_-12px_rgba(45,32,36,0.08)] relative overflow-hidden">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">
            Bespoke Jewellery Atelier
          </span>
          <h2 className="font-headline-lg text-[26px] sm:text-[36px] text-primary mt-1 font-serif leading-tight">
            Customize Your Design
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl mx-auto">
            Have a dream piece in mind? Upload your hand sketch, rough idea, or photo reference — our master craftsmen will bring it to life.
          </p>
        </div>

        {submitted ? (
          <div className="max-w-xl mx-auto text-center py-10 px-4">
            <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-2">
              Design Received with Care
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
              Our master craftsmen will contact you shortly on <strong className="text-primary">+91 {phone.replace(/\D/g, '').slice(-10)}</strong> to discuss your sketch and share precise 3D estimates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/${waNumber}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1A4D2E] text-white font-label-md uppercase tracking-wider hover:bg-[#143B23] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Share Sketch on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFile(null);
                  setPreviewUrl(null);
                  setName('');
                  setPhone('');
                  setNotes('');
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-outline-variant/60 text-primary font-label-md uppercase tracking-wider hover:bg-surface-container transition-colors"
              >
                Submit Another Design
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Drag & Drop Upload Zone */}
            <div className="lg:col-span-5 flex flex-col">
              <label className="font-label-md text-label-md text-primary uppercase tracking-wider mb-2 block">
                Your Design Reference / Sketch
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[340px] sm:min-h-[380px] bg-surface-container-low/50 hover:bg-surface-container-low ${
                  previewUrl
                    ? 'border-secondary/80'
                    : 'border-outline-variant hover:border-secondary/60'
                }`}
              >
                {previewUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded sketch preview"
                      className="max-h-[260px] w-auto object-contain rounded-lg shadow-sm border border-outline-variant/30"
                    />
                    <div className="mt-3 flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-xs">
                      <span className="material-symbols-outlined text-[16px] text-secondary">image</span>
                      <span className="text-[12px] font-medium text-primary truncate max-w-[180px]">
                        {file?.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="ml-1 text-on-surface-variant hover:text-error transition-colors"
                        title="Remove file"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-[280px]">
                    <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
                      <span className="material-symbols-outlined text-[32px]">draw</span>
                    </div>
                    <div>
                      <p className="font-headline-sm text-[16px] text-primary font-medium">
                        Upload your raw sketch, photo or reference drawing
                      </p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant mt-1.5 leading-relaxed">
                        Hand-drawn paper sketches, Pinterest screenshots, or CAD files welcome.
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="inline-block px-5 py-2 rounded-full bg-surface border border-outline-variant/60 font-label-sm text-[11px] text-primary uppercase tracking-wider shadow-2xs hover:border-primary transition-colors">
                        Drag &amp; Drop or Browse
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant/70">
                      Supported: JPG, PNG, WEBP, PDF (Max 25MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Customization Preferences & Details */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Metal Selection */}
              <div>
                <label className="font-label-md text-label-md text-primary uppercase tracking-wider block mb-2.5">
                  Select Your Metal
                </label>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {METALS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetal(m.label)}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-[13px] font-medium transition-all ${
                        metal === m.label
                          ? 'border-secondary bg-secondary/10 text-primary ring-1 ring-secondary font-semibold'
                          : 'border-outline-variant/60 bg-surface text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diamond Type Selection */}
              <div>
                <label className="font-label-md text-label-md text-primary uppercase tracking-wider block mb-2.5">
                  Choose Your Diamond / Stone
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {DIAMONDS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiamond(d.label)}
                      className={`py-3 px-4 rounded-xl border text-[13px] font-medium transition-all text-center ${
                        diamond === d.label
                          ? 'border-secondary bg-secondary/10 text-primary ring-1 ring-secondary font-semibold'
                          : 'border-outline-variant/60 bg-surface text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desired Budget */}
              <div>
                <label className="font-label-md text-label-md text-primary uppercase tracking-wider block mb-2">
                  Desired Budget Range
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded-xl px-4 py-3 text-body-md text-primary focus:outline-none focus:border-secondary transition-colors"
                >
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-md text-label-md text-primary uppercase tracking-wider block mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-surface border border-outline-variant/60 rounded-xl px-4 py-2.5 text-body-md text-primary focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-primary uppercase tracking-wider block mb-1.5">
                    Your Contact Number *
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-outline-variant/60 bg-surface-container-low text-on-surface-variant text-[13px] font-medium">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full bg-surface border border-outline-variant/60 rounded-r-xl px-4 py-2.5 text-body-md text-primary focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Special Instructions (Optional) */}
              <div>
                <label className="font-label-md text-label-md text-primary uppercase tracking-wider block mb-1.5">
                  Notes / Design Details <span className="text-on-surface-variant font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ring size, engraving, specific carat weight, or occasion..."
                  className="w-full bg-surface border border-outline-variant/60 rounded-xl px-4 py-2.5 text-body-md text-primary focus:outline-none focus:border-secondary transition-colors resize-none"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-[13px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button & Microcopy */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 rounded-xl bg-primary text-surface hover:bg-tertiary transition-colors font-label-md uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Submitting Design...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Design for Atelier Review</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
                <p className="font-body-sm text-[12px] text-center text-on-surface-variant mt-2.5 italic">
                  Our master craftsmen will contact you shortly to discuss your unique creation.
                </p>
              </div>

            </div>

          </form>
        )}

      </div>
    </section>
  );
}
