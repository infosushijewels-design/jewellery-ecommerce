import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/adminAuth';
import { createClient } from '@/lib/supabase/server';
import { MEDIA_BUCKET } from '@/lib/storage';
import { extractDriveFileId, fetchDriveImage, driveImageUrlsFor, extensionForContentType } from '@/lib/googleDriveImage';

// Image downloads + storage uploads can take a while for a full batch.
export const maxDuration = 60;

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** One spreadsheet row, matching the template's column headers exactly — this is also the shape
 *  BulkProductImportModal.tsx parses each Excel/CSV row into client-side before posting it here. */
export interface BulkProductRow {
  Title?: string;
  Category?: string;
  Price?: number | string;
  MRP?: number | string;
  Material?: string;
  Stock?: number | string;
  Main_Image_Drive_Url?: string;
  Gallery_Images?: string;
  Description?: string;
  Available_Sizes?: string;
  Certification?: string;
  Badge?: string;
  SKU?: string;
  Is_Featured?: string | boolean;
  Is_New_Arrival?: string | boolean;
}

interface RowError {
  row: number;
  title: string;
  message: string;
}

const MAX_ROWS_PER_REQUEST = 200;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function splitList(value: unknown): string[] {
  return String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 6);
}

/** `slugify(base) + randomSuffix`, regenerating the suffix in the rare case of a collision. */
async function uniqueSlug(supabase: ServerSupabaseClient, table: 'products' | 'categories', base: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    const { data } = await supabase.from(table).select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Resolves one Google Drive (or plain) image URL to a permanent Supabase Storage public URL,
 *  falling back to the raw Drive CDN link if the download/upload can't complete. */
async function ingestImage(supabase: ServerSupabaseClient, rawUrl: string, slug: string, index: number): Promise<string | null> {
  const url = rawUrl.trim();
  if (!url) return null;

  const fileId = extractDriveFileId(url);
  if (!fileId) {
    // Not a recognizable Drive link — if it's already a usable image URL, pass it through.
    return /^https?:\/\//i.test(url) ? url : null;
  }

  const fetched = await fetchDriveImage(fileId);
  if (fetched) {
    const ext = extensionForContentType(fetched.contentType);
    const path = `catalog/products/${slug}-${Date.now()}-${index}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, Buffer.from(fetched.bytes), {
      contentType: fetched.contentType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (!uploadError) {
      return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    }
  }

  // Resilience fallback: a slow/blocked download must not fail the whole product row.
  return driveImageUrlsFor(fileId)[0];
}

async function resolveCategoryId(
  supabase: ServerSupabaseClient,
  categoryCache: Map<string, string>,
  categoryName: string
): Promise<string> {
  const key = categoryName.toLowerCase();
  const cached = categoryCache.get(key);
  if (cached) return cached;

  const { data: existing } = await supabase.from('categories').select('id, name').ilike('name', categoryName).maybeSingle();
  if (existing) {
    categoryCache.set(key, existing.id);
    return existing.id;
  }

  const slug = await uniqueSlug(supabase, 'categories', slugify(categoryName));
  const { data: created, error } = await supabase.from('categories').insert({ name: categoryName, slug }).select('id').single();
  if (error || !created) throw new Error(`Could not create category "${categoryName}": ${error?.message || 'unknown error'}`);

  categoryCache.set(key, created.id);
  return created.id;
}

async function processRow(
  supabase: ServerSupabaseClient,
  categoryCache: Map<string, string>,
  row: BulkProductRow
): Promise<{ title: string }> {
  const title = String(row.Title || '').trim();
  if (!title) throw new Error('Title is required.');

  const categoryName = String(row.Category || '').trim();
  if (!categoryName) throw new Error('Category is required.');

  const price = parseNumber(row.Price);
  if (price === null || price <= 0) throw new Error('Price must be a positive number.');

  const material = String(row.Material || '').trim();
  if (!material) throw new Error('Material is required.');

  const mainImageUrlInput = String(row.Main_Image_Drive_Url || '').trim();
  if (!mainImageUrlInput) throw new Error('Main_Image_Drive_Url is required.');

  const mrp = parseNumber(row.MRP);
  const stock = parseNumber(row.Stock) ?? 0;

  const categoryId = await resolveCategoryId(supabase, categoryCache, categoryName);
  const slug = await uniqueSlug(supabase, 'products', slugify(title));

  const imageUrl = await ingestImage(supabase, mainImageUrlInput, slug, 0);
  if (!imageUrl) throw new Error('Could not resolve the main product image — check Main_Image_Drive_Url.');

  const galleryInputs = splitList(row.Gallery_Images);
  const galleryImages: string[] = [];
  for (let g = 0; g < galleryInputs.length; g++) {
    const url = await ingestImage(supabase, galleryInputs[g], slug, g + 1);
    if (url) galleryImages.push(url);
  }

  const sku = String(row.SKU || '').trim() || `SJ-${randomSuffix()}${randomSuffix()}`.toUpperCase();

  const { error: insertError } = await supabase.from('products').insert({
    title,
    slug,
    sku,
    price,
    mrp: mrp !== null && mrp > price ? mrp : null,
    stock,
    material,
    certification: String(row.Certification || '').trim() || null,
    badge: String(row.Badge || '').trim() || null,
    description: String(row.Description || '').trim() || null,
    category_id: categoryId,
    image_url: imageUrl,
    gallery_images: galleryImages,
    available_sizes: splitList(row.Available_Sizes),
    is_featured: parseBool(row.Is_Featured),
    is_new_arrival: parseBool(row.Is_New_Arrival),
  });
  if (insertError) throw new Error(insertError.message);

  return { title };
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  const { supabase } = auth;

  let body: { rows?: unknown; products?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  // BulkProductImportModal.tsx posts `{ products }`; `{ rows }` is also accepted for direct API testing.
  const rawRows = body.products ?? body.rows;
  const rows = Array.isArray(rawRows) ? (rawRows as BulkProductRow[]) : null;
  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: false, error: 'No product rows were provided.' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS_PER_REQUEST) {
    return NextResponse.json(
      { success: false, error: `Please import at most ${MAX_ROWS_PER_REQUEST} products per request.` },
      { status: 400 }
    );
  }

  const { data: existingCategories } = await supabase.from('categories').select('id, name');
  const categoryCache = new Map<string, string>((existingCategories || []).map((c) => [c.name.trim().toLowerCase(), c.id]));

  const errors: RowError[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // row 1 is the header in the spreadsheet
    const titleForError = String(row.Title || '').trim() || `Row ${rowNumber}`;
    try {
      await processRow(supabase, categoryCache, row);
      imported++;
    } catch (err) {
      errors.push({ row: rowNumber, title: titleForError, message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return NextResponse.json({ success: true, imported, failed: errors.length, errors });
}
