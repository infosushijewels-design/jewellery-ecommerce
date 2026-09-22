import TestimonialsCarousel, { type Testimonial } from './TestimonialsCarousel';
import { getPublicTestimonials } from '@/lib/supabase/public';

// Curated patron stories shown alongside (and until there are enough) approved reviews
const CURATED: Testimonial[] = [
  {
    id: 'curated-1',
    name: 'Ananya Sharma',
    subtitle: 'Verified Buyer · Mumbai',
    rating: 5,
    date: '2026-05-12',
    text: 'The solitaire I purchased for my 10th anniversary exceeded all expectations. The certification and the sheer brilliance of the cut is unmatched. The packaging itself was an experience.',
  },
  {
    id: 'curated-2',
    name: 'Dr. Rakesh Mehta',
    subtitle: 'Verified Buyer · Delhi',
    rating: 5,
    date: '2026-04-28',
    text: "We bought our daughter's bridal set from Sushi Jewels. The craftsmanship on the Jadau choker is so intricate, it looks like a museum piece. The concierge team was incredibly patient.",
  },
  {
    id: 'curated-3',
    name: 'Priya Patel',
    subtitle: 'Verified Buyer · Bangalore',
    rating: 5,
    date: '2026-04-03',
    text: "I love their everyday luxury edit. The rose gold huggies I bought are so comfortable I never take them off. It's rare to find fine jewellery that feels so effortless and modern.",
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
    text: r.comment || r.title || '',
  }));
  const items = [...fromReviews, ...CURATED].filter((t) => t.text.trim()).slice(0, 12);

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
