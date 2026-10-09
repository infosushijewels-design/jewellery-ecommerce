/**
 * Resolves a Google Drive share link to its downloadable bytes, for the bulk product importer.
 * Supports the share-link formats Drive actually hands out, and degrades gracefully: if the
 * binary can't be fetched (rate limit, timeout, file not public), callers fall back to linking
 * the Drive CDN URL directly rather than failing the whole product row.
 */

const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:export=download&)?id=([a-zA-Z0-9_-]+)/,
  /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
];

/** Extracts the {FILE_ID} from any of the Drive URL shapes above, or null if it's not a Drive link. */
export function extractDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** Candidate CDN mirrors for a file id, tried in order — the first is Google's fast image CDN. */
export function driveImageUrlsFor(fileId: string): string[] {
  return [`https://lh3.googleusercontent.com/d/${fileId}`, `https://drive.google.com/uc?export=download&id=${fileId}`];
}

export interface FetchedDriveImage {
  bytes: ArrayBuffer;
  contentType: string;
}

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string): Promise<FetchedDriveImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0) return null;
    return { bytes, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Downloads a Drive image's bytes, trying each CDN mirror in turn. Null if every mirror fails. */
export async function fetchDriveImage(fileId: string): Promise<FetchedDriveImage | null> {
  for (const url of driveImageUrlsFor(fileId)) {
    const result = await fetchWithTimeout(url);
    if (result) return result;
  }
  return null;
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function extensionForContentType(contentType: string): string {
  return EXTENSION_BY_CONTENT_TYPE[contentType] || 'jpg';
}
