import TestimonialsCarousel, { type Testimonial } from './TestimonialsCarousel';
import { getPublicTestimonials } from '@/lib/supabase/public';

export default async function Testimonials() {
  const reviews = await getPublicTestimonials(12);
  const fromReviews: Testimonial[] = reviews.map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    subtitle: 'Verified Buyer',
    rating: r.rating,
    date: r.created_at,
    text: r.comment || r.title || '',
  }));
  // Only real, approved customer reviews from the database (Admin → Reviews decides what is shown).
  const items = fromReviews.filter((t) => t.text.trim()).slice(0, 12);
  // No approved reviews yet: leave the section out rather than show an empty block
  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 bg-surface-container-low" id="testimonials">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary">Hear From Our Customers</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Loved by customers across every purchase.</p>
        </div>
        <TestimonialsCarousel items={items} />
      </div>
    </section>
  );
}
