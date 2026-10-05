import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { clientIpHash, recentCount } from '@/lib/requestGuard';
import {
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
  classifyGeminiError,
  resolveTrustedImageUrl,
  sniffImageType,
  trustedImageHosts,
  type GeminiFailure,
} from '@/lib/tryOnSecurity';

// Two model attempts of up to 25s each plus the image download must fit inside the function limit.
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB (selfie and product photo)

interface TryOnAnalysis {
  faceDetected: boolean;
  handDetected: boolean;
  tiltDegrees: number;
  neck: { x: number; y: number } | null;
  leftEarlobe: { x: number; y: number } | null;
  rightEarlobe: { x: number; y: number } | null;
  finger: { x: number; y: number } | null;
  notes?: string;
}

const ANALYSIS_PROMPT = `You are a computer vision expert helping with a virtual jewellery try-on.

The first image is a user's photo (could be a selfie or a hand). The second image is a piece of jewellery (necklace, earrings, ring, or bracelet).

Analyze the photo and locate:
If it's a face/upper body:
1. The base of the neck (where a necklace pendant would rest, just below the throat).
2. The left earlobe (from the viewer's perspective).
3. The right earlobe (from the viewer's perspective).
4. Whether the face/head is tilted, and by how many degrees (positive = tilted to the viewer's right, negative = tilted to the viewer's left, 0 = straight).

If it's a hand:
5. The base of the ring finger or middle finger (where a ring would sit). Set handDetected to true.

Return ONLY JSON matching this exact shape, with no markdown formatting or extra text:
{
  "faceDetected": boolean,
  "handDetected": boolean,
  "tiltDegrees": number,
  "neck": { "x": number, "y": number } | null,
  "leftEarlobe": { "x": number, "y": number } | null,
  "rightEarlobe": { "x": number, "y": number } | null,
  "finger": { "x": number, "y": number } | null,
  "notes": string
}

Coordinates must be normalized fractions of the image width/height (0.0 to 1.0), where x=0 is the left edge, x=1 is the right edge, y=0 is the top edge, and y=1 is the bottom edge of the USER image.

If no face or hand is clearly visible, set "faceDetected" and "handDetected" to false and set all points to null, and explain briefly in "notes".`;

function isValidAnalysis(input: unknown): input is TryOnAnalysis {
  // Untrusted model output — checked field by field below
  const value = input as Record<string, unknown> | null;
  if (!value || typeof value !== 'object') return false;
  if (typeof value.faceDetected !== 'boolean') return false;
  if (typeof value.handDetected !== 'boolean') return false;
  if (typeof value.tiltDegrees !== 'number') return false;
  const isPoint = (p: unknown) => {
    if (p === null) return true;
    const point = p as { x?: unknown; y?: unknown } | undefined;
    return typeof p === 'object' && typeof point?.x === 'number' && typeof point?.y === 'number';
  };
  return isPoint(value.neck) && isPoint(value.leftEarlobe) && isPoint(value.rightEarlobe) && isPoint(value.finger);
}

const GEMINI_TIMEOUT_MS = 25_000; // per attempt
const IMAGE_FETCH_TIMEOUT_MS = 8_000;
const RATE_LIMITS = { perIpPerHour: 10, globalPerHour: 300 };

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Downloads a product photo from a trusted host only: no redirects, a time limit, a size cap, and it must really be an image. */
async function urlToInlinePart(url: URL) {
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Could not fetch product image (${res.status})`);
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_IMAGE_BYTES) throw new Error('Product image is too large');
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('Product image is too large');
  const sniffed = sniffImageType(bytes);
  if (!sniffed) throw new Error('Product image is not a supported image type');
  return { inlineData: { mimeType: sniffed.mimeType, data: Buffer.from(bytes).toString('base64') } };
}

/** Asks one model for the analysis, giving up after GEMINI_TIMEOUT_MS. */
async function analyzeWith(apiKey: string, modelName: string, parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>) {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(parts, { signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS) });
  return result.response.text(); // throws if Gemini blocked the content
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set.');
      return jsonError('Virtual try-on is not configured yet.', 500);
    }

    const formData = await req.formData();
    const selfie = formData.get('selfie');
    const productImageUrl = formData.get('productImageUrl');

    if (!(selfie instanceof File)) return jsonError('A selfie image is required.', 400);
    if (typeof productImageUrl !== 'string' || !productImageUrl) return jsonError('A product image URL is required.', 400);
    if (selfie.size > MAX_IMAGE_BYTES) return jsonError('Selfie image is too large. Please use a photo under 8MB.', 413);

    // The selfie must really be a photo (checked from its bytes, not the label the browser sent).
    const selfieBytes = new Uint8Array(await selfie.arrayBuffer());
    const selfieType = sniffImageType(selfieBytes);
    if (!selfieType) return jsonError('Please upload a JPG, PNG, WebP or HEIC photo.', 415);

    // The product photo may only come from our own storage / trusted hosts — the server never fetches arbitrary URLs.
    const imageUrl = resolveTrustedImageUrl(productImageUrl, new URL(req.url).origin, trustedImageHosts(process.env));
    if (!imageUrl) return jsonError('That product image cannot be used for the try-on.', 400);

    // Rate limit: each accepted request costs Gemini quota. Counted per visitor (hashed IP) and across the whole site.
    const admin = createServiceRoleClient();
    if (admin) {
      const ipHash = clientIpHash(req, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const [mine, everyone] = await Promise.all([
        ipHash ? recentCount(admin, 'try_on_requests', { column: 'ip_hash', value: ipHash }, 60) : Promise.resolve(0),
        recentCount(admin, 'try_on_requests', null, 60),
      ]);
      if (mine >= RATE_LIMITS.perIpPerHour || everyone >= RATE_LIMITS.globalPerHour) {
        return NextResponse.json(
          { error: 'You have tried on a lot of pieces just now. Please wait a little while and try again.' },
          { status: 429, headers: { 'Retry-After': '600' } }
        );
      }
      const { error: logError } = await admin.from('try_on_requests').insert({ ip_hash: ipHash });
      if (logError) console.error('Try-on rate-limit log failed:', logError.message);
      if (Math.random() < 0.05) {
        await admin.from('try_on_requests').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — try-on is running without rate limiting.');
    }

    let productPart;
    try {
      productPart = await urlToInlinePart(imageUrl);
    } catch (err) {
      console.error('Try-on: product image unavailable:', err);
      return jsonError('We could not load this product photo for the try-on. Please try again.', 502);
    }
    const parts = [
      { text: ANALYSIS_PROMPT },
      { inlineData: { mimeType: selfieType.mimeType, data: Buffer.from(selfieBytes).toString('base64') } },
      productPart,
    ];

    // Primary model, then ONE retry on the backup if it is overloaded, rate limited, retired or too slow.
    const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
    const models = fallback && fallback !== primary ? [primary, fallback] : [primary];

    let rawText: string | null = null;
    const failures: GeminiFailure[] = [];
    for (const modelName of models) {
      try {
        rawText = await analyzeWith(apiKey, modelName, parts);
        break;
      } catch (err) {
        const failure = classifyGeminiError(err);
        failures.push(failure);
        console.error(`Try-on: model "${modelName}" failed (${failure.kind}):`, err instanceof Error ? err.message : err);
        if (!failure.retryable) break;
      }
    }

    if (rawText === null) {
      // Report the most useful reason: an overloaded primary matters more than a backup that is misconfigured.
      const has = (kind: GeminiFailure['kind']) => failures.some((f) => f.kind === kind);
      const lastFailure: { kind: GeminiFailure['kind'] } = { kind: has('blocked') ? 'blocked' : has('busy') ? 'busy' : has('timeout') ? 'timeout' : 'other' };
      if (lastFailure.kind === 'blocked') return jsonError('That photo could not be analyzed. Please try a different one.', 422);
      if (lastFailure.kind === 'timeout') return jsonError('The try-on took too long. Please try again.', 504);
      if (lastFailure.kind === 'busy') return jsonError('The try-on is very busy right now. Please try again in a minute.', 503);
      return jsonError('Something went wrong analyzing your photo. Please try again.', 500);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error('Gemini returned non-JSON response:', rawText);
      return jsonError('Could not analyze the photo. Please try a different selfie.', 502);
    }

    if (!isValidAnalysis(parsed)) {
      console.error('Gemini response failed shape validation:', parsed);
      return jsonError('Could not analyze the photo. Please try a different selfie.', 502);
    }

    if (!parsed.faceDetected && !parsed.handDetected) {
      return jsonError(parsed.notes || 'No face or hand was detected in that photo. Please try a clearer photo.', 422);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Try-on analysis error:', err);
    return jsonError('Something went wrong analyzing your photo. Please try again.', 500);
  }
}
