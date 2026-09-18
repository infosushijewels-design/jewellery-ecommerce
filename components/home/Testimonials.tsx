export default function Testimonials() {
  return (
    <section className="py-12 sm:py-20 bg-surface-container-low" id="testimonials">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary">Words from Our Patrons</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Over 10,000 families trust us with their most precious moments.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {/* Review 1 */}
          <div className="bg-surface p-5 sm:p-8 rounded-2xl border border-outline-variant/40 relative">
            <div className="text-secondary mb-3 sm:mb-4 flex gap-1">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="material-symbols-outlined text-[16px] sm:text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <p className="font-body-md text-[14px] sm:text-body-md text-on-surface-variant italic mb-4 sm:mb-6 leading-relaxed">
              &quot;The solitaire I purchased for my 10th anniversary exceeded all expectations. The GIA certification and the sheer brilliance of the cut is unmatched. The packaging itself was an experience.&quot;
            </p>
            <div>
              <p className="font-headline-sm text-[14px] sm:text-[15px] text-primary">Ananya Sharma</p>
              <p className="font-label-sm text-[10px] sm:text-[11px] text-outline mt-0.5">Verified Buyer • Mumbai</p>
            </div>
          </div>

          {/* Review 2 */}
          <div className="bg-surface p-5 sm:p-8 rounded-2xl border border-outline-variant/40 relative">
            <div className="text-secondary mb-3 sm:mb-4 flex gap-1">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="material-symbols-outlined text-[16px] sm:text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <p className="font-body-md text-[14px] sm:text-body-md text-on-surface-variant italic mb-4 sm:mb-6 leading-relaxed">
              &quot;We bought our daughter&apos;s bridal set from Sushi Jewels. The craftsmanship on the Jadau choker is so intricate, it looks like a museum piece. The concierge team was incredibly patient.&quot;
            </p>
            <div>
              <p className="font-headline-sm text-[14px] sm:text-[15px] text-primary">Dr. Rakesh Mehta</p>
              <p className="font-label-sm text-[10px] sm:text-[11px] text-outline mt-0.5">Verified Buyer • Delhi</p>
            </div>
          </div>

          {/* Review 3 */}
          <div className="bg-surface p-5 sm:p-8 rounded-2xl border border-outline-variant/40 relative">
            <div className="text-secondary mb-3 sm:mb-4 flex gap-1">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="material-symbols-outlined text-[16px] sm:text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            <p className="font-body-md text-[14px] sm:text-body-md text-on-surface-variant italic mb-4 sm:mb-6 leading-relaxed">
              &quot;I love their everyday luxury edit. The rose gold huggies I bought are so comfortable I never take them off. It&apos;s rare to find high jewelry that feels so effortless and modern.&quot;
            </p>
            <div>
              <p className="font-headline-sm text-[14px] sm:text-[15px] text-primary">Priya Patel</p>
              <p className="font-label-sm text-[10px] sm:text-[11px] text-outline mt-0.5">Verified Buyer • Bangalore</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
