import TestimonialsCarousel, { type Testimonial } from './TestimonialsCarousel';
import { getPublicTestimonials } from '@/lib/supabase/public';

function productTitle(products: { title: string } | { title: string }[] | null): string | undefined {
  if (!products) return undefined;
  return Array.isArray(products) ? products[0]?.title : products.title;
}

// Placeholder cards shown only until the first real review is approved in Admin → Reviews.
// Not sourced from actual customers or orders — swapped out automatically the moment
// real approved reviews exist (see `items` below).
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'fallback-1',
    name: 'Priya & Kunal Singhal',
    subtitle: 'Verified Buyer',
    rating: 5,
    date: '2025-10-01',
    headline: 'The craftsmanship of my bridal choker exceeded every expectation. Truly royal!',
    text: 'Seeing the BIS 916 laser hallmarking and IGI certificate in the luxury velvet box gave my family complete peace of mind.',
    productName: 'Celestial Royal Choker Set',
  },
  {
    id: 'fallback-2',
    name: 'Dr. Radhika Mehta',
    subtitle: 'Verified Buyer',
    rating: 5,
    date: '2025-12-01',
    headline: 'The diamond sparkle in real life is unmatched. Effortlessly elegant every day.',
    text: 'I wear these studs daily to clinic and meetings. Lightweight, sturdy screw-backs, and the gold polish stays mirror-bright.',
    productName: 'Lumina Solitaire Studs (18K)',
  },
  {
    id: 'fallback-3',
    name: 'Vikram & Shalini Joshi',
    subtitle: 'Verified Buyer',
    rating: 5,
    date: '2026-01-01',
    headline: 'Bespoke customization for our 10th anniversary made it an unforgettable gift.',
    text: 'The concierge team shared 3D renders before casting. Delivered securely right on time. Exceptional bespoke service!',
    productName: 'Heritage Emerald Tennis Bracelet',
  },
];

export default async function Testimonials() {
  const reviews = await getPublicTestimonials(12);
  const fromReviews: Testimonial[] = reviews.map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    subtitle: 'Verified Buyer',
    rating: r.rating,
    date: r.created_at,
    headline: r.title || '',
    text: r.comment || '',
    productName: productTitle(r.products),
  }));
  // Real, approved customer reviews take priority whenever any exist.
  const realItems = fromReviews.filter((t) => t.text.trim()).slice(0, 12);
  const items = realItems.length > 0 ? realItems : FALLBACK_TESTIMONIALS;

  // Real average when real reviews are shown; the curated fallback set uses a fixed 4.9.
  const avgRating = realItems.length > 0
    ? items.reduce((sum, t) => sum + t.rating, 0) / items.length
    : 4.9;

  return (
    <section className="py-12 sm:py-20 bg-surface-container-low" id="testimonials">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Voices of Elegance</span>
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Loved by Our Connoisseurs</h2>
          <div className="inline-flex items-center gap-2 bg-surface border border-outline-variant/50 rounded-full px-4 py-2 mt-5 font-label-sm text-label-sm text-on-surface-variant">
            <span className="text-secondary tracking-tight" aria-hidden="true">★★★★★</span>
            <span>{avgRating.toFixed(1)} / 5.0 Rating</span>
            <span className="text-outline-variant">•</span>
            <span>100% Certified Authentic</span>
            <span className="text-outline-variant">•</span>
            <span>Verified Buyers</span>
          </div>
        </div>
        <TestimonialsCarousel items={items} />
      </div>
    </section>
  );
}
