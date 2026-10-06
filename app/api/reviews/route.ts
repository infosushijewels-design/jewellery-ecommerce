import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { clientIp, clientIpHash, isBotSubmission, recentCount } from '@/lib/requestGuard';
import { decideRateLimit, tooManyRequests } from '@/lib/turnstile';
import { EMAIL_RE } from '@/lib/checkoutValidation';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REVIEWS_PER_IP_PER_HOUR = 3;
const COMMENT_MIN = 10;
const COMMENT_MAX = 2000;

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/**
 * POST { productId, rating, title?, comment, reviewerName, reviewerEmail?, website, startedAt }
 *
 * Saves a customer review as "pending" (it is shown only after an admin approves it). The browser can no longer
 * write reviews straight into the database; this route is the only way in, so it can:
 *   - silently drop bots (hidden "website" field filled, or the form submitted in under ~1.5 seconds),
 *   - check the rating (1–5) and the comment (10–2000 characters),
 *   - allow at most 3 reviews per visitor per hour (a person who solves the Turnstile check, when configured, may go past it),
 *   - take the signed-in customer's id from their session — never from the request.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (isBotSubmission({ honeypot: body.website, startedAt: body.startedAt }, Date.now(), 1500)) {
    return NextResponse.json({ success: true });
  }

  const productId = typeof body.productId === 'string' ? body.productId.trim().toLowerCase() : '';
  const rating = body.rating;
  const title = text(body.title, 120);
  const comment = text(body.comment, COMMENT_MAX + 1);
  const reviewerName = text(body.reviewerName, 100) || 'Verified customer';
  const reviewerEmail = text(body.reviewerEmail, 200);

  if (!UUID_RE.test(productId)) return NextResponse.json({ success: false, error: 'This product could not be found.' }, { status: 400 });
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: 'Please choose a rating from 1 to 5 stars.' }, { status: 400 });
  }
  if (comment.length < COMMENT_MIN) {
    return NextResponse.json({ success: false, error: `Please write at least ${COMMENT_MIN} characters about your experience.` }, { status: 400 });
  }
  if (comment.length > COMMENT_MAX) {
    return NextResponse.json({ success: false, error: `Your review is too long (max ${COMMENT_MAX} characters).` }, { status: 400 });
  }
  if (reviewerEmail && !EMAIL_RE.test(reviewerEmail)) {
    return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot save reviews.');
    return NextResponse.json({ success: false, error: 'Reviews are temporarily unavailable. Please try again later.' }, { status: 503 });
  }

  const ipHash = clientIpHash(request, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  if (ipHash) {
    const made = await recentCount(admin, 'product_reviews', { column: 'ip_hash', value: ipHash }, 60);
    const decision = await decideRateLimit({ count: made, limit: MAX_REVIEWS_PER_IP_PER_HOUR, token: body['cf-turnstile-response'], ip: clientIp(request) });
    if (decision !== 'ok') {
      return tooManyRequests(decision, 'You have submitted several reviews in a short time. Please try again in a little while.');
    }
  }

  const { data: product } = await admin.from('products').select('id').eq('id', productId).maybeSingle();
  if (!product) return NextResponse.json({ success: false, error: 'This product could not be found.' }, { status: 400 });

  // The signed-in customer (if any) comes from their session cookie, not from the request body
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  // The identical review from the same visitor for the same product (double click, retry): already have it
  if (ipHash) {
    const { data: duplicate } = await admin
      .from('product_reviews')
      .select('id')
      .eq('ip_hash', ipHash)
      .eq('product_id', productId)
      .eq('comment', comment)
      .limit(1);
    if (duplicate && duplicate.length > 0) return NextResponse.json({ success: true, duplicate: true });
  }

  const { error } = await admin.from('product_reviews').insert({
    product_id: productId,
    user_id: userId,
    reviewer_name: reviewerName,
    reviewer_email: reviewerEmail || null,
    rating,
    title: title || null,
    comment,
    status: 'pending',
    ip_hash: ipHash,
  });
  if (error) {
    console.error('Failed to save review:', error.message);
    return NextResponse.json({ success: false, error: 'Could not submit your review. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
