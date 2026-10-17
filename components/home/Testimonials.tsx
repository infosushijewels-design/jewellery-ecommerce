import ReviewsMarquee, { type CompactReview } from './ReviewsMarquee';
import { getPublicTestimonials } from '@/lib/supabase/public';

export default async function Testimonials() {
  const reviews = await getPublicTestimonials(12);

  const realReviews: CompactReview[] = reviews
    .map((r) => ({
      id: r.id,
      rating: r.rating || 5,
      text: r.comment || r.title || '',
    }))
    .filter((r) => r.text.trim().length > 0);

  return <ReviewsMarquee reviews={realReviews} />;
}
