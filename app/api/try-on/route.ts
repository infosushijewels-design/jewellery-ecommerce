import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_SELFIE_BYTES = 8 * 1024 * 1024; // 8MB

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

function isValidAnalysis(value: any): value is TryOnAnalysis {
  if (!value || typeof value !== 'object') return false;
  if (typeof value.faceDetected !== 'boolean') return false;
  if (typeof value.handDetected !== 'boolean') return false;
  if (typeof value.tiltDegrees !== 'number') return false;
  const isPoint = (p: any) =>
    p === null || (typeof p === 'object' && typeof p.x === 'number' && typeof p.y === 'number');
  return isPoint(value.neck) && isPoint(value.leftEarlobe) && isPoint(value.rightEarlobe) && isPoint(value.finger);
}

async function fileToInlinePart(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { inlineData: { mimeType: file.type || 'image/jpeg', data: base64 } };
}

async function urlToInlinePart(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch product image (${res.status})`);
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { inlineData: { mimeType, data: base64 } };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set.');
      return NextResponse.json({ error: 'Virtual try-on is not configured yet.' }, { status: 500 });
    }

    const formData = await req.formData();
    const selfie = formData.get('selfie');
    const productImageUrl = formData.get('productImageUrl');

    if (!(selfie instanceof File)) {
      return NextResponse.json({ error: 'A selfie image is required.' }, { status: 400 });
    }
    if (typeof productImageUrl !== 'string' || !productImageUrl) {
      return NextResponse.json({ error: 'A product image URL is required.' }, { status: 400 });
    }
    if (selfie.size > MAX_SELFIE_BYTES) {
      return NextResponse.json({ error: 'Selfie image is too large. Please use a photo under 8MB.' }, { status: 413 });
    }

    const [selfiePart, productPart] = await Promise.all([
      fileToInlinePart(selfie),
      urlToInlinePart(productImageUrl),
    ]);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      // "gemini-flash-latest" is a Google-maintained alias that always points
      // at the current flash model, so this doesn't need updating every time
      // a specific version is retired.
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent([
      { text: ANALYSIS_PROMPT },
      selfiePart,
      productPart,
    ]);

    const rawText = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error('Gemini returned non-JSON response:', rawText);
      return NextResponse.json({ error: 'Could not analyze the photo. Please try a different selfie.' }, { status: 502 });
    }

    if (!isValidAnalysis(parsed)) {
      console.error('Gemini response failed shape validation:', parsed);
      return NextResponse.json({ error: 'Could not analyze the photo. Please try a different selfie.' }, { status: 502 });
    }

    if (!parsed.faceDetected && !parsed.handDetected) {
      return NextResponse.json(
        { error: parsed.notes || 'No face or hand was detected in that photo. Please try a clearer photo.' },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Try-on analysis error:', err);
    return NextResponse.json({ error: 'Something went wrong analyzing your photo. Please try again.' }, { status: 500 });
  }
}
