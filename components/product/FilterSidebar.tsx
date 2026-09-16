import React from 'react';

export default function FilterSidebar() {
  return (
    <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-6 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 max-h-[870px] overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
        <span className="font-headline-sm text-headline-sm text-primary">Filters</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">2 Active</span>
      </div>

      <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-secondary/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">videocam</span>
          <span className="font-label-md text-label-md font-semibold text-primary">Virtual Try-On</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" defaultChecked />
          <div className="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
        </label>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center font-label-lg text-label-lg text-primary">
          <span>Price Range</span>
          <span className="font-label-sm text-label-sm text-secondary font-semibold">₹15k – ₹5L+</span>
        </div>
        <input type="range" min="15000" max="500000" step="5000" defaultValue="250000" className="w-full accent-primary h-1 bg-surface-container-highest rounded-lg cursor-pointer" />
        <div className="flex justify-between text-label-sm font-label-sm text-on-surface-variant">
          <span>₹15,000</span>
          <span>₹5,00,000+</span>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between font-label-lg text-label-lg text-primary">
          <span>Metal & Purity</span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">keyboard_arrow_up</span>
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-0" defaultChecked />
              <span className="font-body-sm text-body-sm text-primary font-medium">18K Yellow Gold</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">64</span>
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-0" />
              <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary">18K Blush Rose</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">32</span>
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-0" />
              <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary">18K Luminous White</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">28</span>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between font-label-lg text-label-lg text-primary">
          <span>Diamond & Gemstone</span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">keyboard_arrow_up</span>
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-0" defaultChecked />
              <span className="font-body-sm text-body-sm text-primary font-medium">Solitaire Diamonds</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">38</span>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between font-label-lg text-label-lg text-primary">
          <span>Ring Size (Indian)</span>
          <a href="#size-guide" className="text-secondary font-label-sm text-label-sm hover:underline flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">straighten</span>
            Size Guide
          </a>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button className="py-1.5 border border-outline-variant rounded font-label-sm text-label-sm hover:border-primary">8</button>
          <button className="py-1.5 border border-outline-variant rounded font-label-sm text-label-sm hover:border-primary">10</button>
          <button className="py-1.5 border border-secondary bg-surface-container font-label-sm text-label-sm font-bold text-primary">12</button>
          <button className="py-1.5 border border-outline-variant rounded font-label-sm text-label-sm hover:border-primary">14</button>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 space-y-2">
        <span className="font-label-lg text-label-lg text-primary block mb-1">Delivery Timeline</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="timeline" className="text-primary focus:ring-0" />
          <span className="font-body-sm text-body-sm text-on-surface-variant">Express 48-Hour Dispatch</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="timeline" className="text-primary focus:ring-0" defaultChecked />
          <span className="font-body-sm text-body-sm text-primary">Made to Order (10-14 days)</span>
        </label>
      </div>

      <div className="pt-4 border-t border-outline-variant/40">
        <div className="bg-surface-container-low p-4 rounded-xl border border-secondary/40 text-center space-y-2">
          <span className="material-symbols-outlined text-secondary text-2xl">qr_code_2</span>
          <h4 className="font-headline-sm text-headline-sm text-primary text-base">Unsure of Your Fit?</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
            Book a 1-on-1 virtual consultation with our Master Gemologists.
          </p>
          <a href="#" className="inline-block pt-1 font-label-sm text-label-sm font-semibold uppercase text-secondary tracking-wider hover:text-primary">
            Schedule Video Call →
          </a>
        </div>
      </div>
    </aside>
  );
}
