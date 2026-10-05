/**
 * Safety checks for the virtual try-on endpoint (app/api/try-on/route.ts). Pure functions, no I/O.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';
/**
 * Backup model. Google has retired gemini-1.5-flash and closed gemini-2.5-flash to new accounts (both answer 404 for
 * this project), so the backup is the lighter "latest" alias — a different model with its own capacity that Google
 * keeps pointing at a live version. Override with GEMINI_FALLBACK_MODEL.
 */
export const DEFAULT_GEMINI_FALLBACK_MODEL = 'gemini-flash-lite-latest';

/** Hosts product photos may be fetched from, besides this project's own Supabase storage and this site. */
const BUILT_IN_IMAGE_HOSTS = ['images.unsplash.com', 'lh3.googleusercontent.com'];

export type SniffedImage = { mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' };

/**
 * What the file REALLY is, from its first bytes. The browser-supplied `file.type` is just a label the sender
 * chooses, so it is never trusted. Returns null for anything that is not a JPEG, PNG, WebP or HEIC/HEIF image.
 */
export function sniffImageType(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: 'image/jpeg' };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { mimeType: 'image/png' };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mimeType: 'image/webp' };
  if (ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|mif1|msf1)/.test(ascii(8, 12))) return { mimeType: 'image/heic' };
  return null;
}

/** Hostnames the server may download product images from. */
export function trustedImageHosts(env: Record<string, string | undefined>): Set<string> {
  const hosts = new Set<string>(BUILT_IN_IMAGE_HOSTS);
  const fromUrl = (value: string | undefined) => {
    try {
      if (value) hosts.add(new URL(value).hostname.toLowerCase());
    } catch {
      /* not a URL — ignore */
    }
  };
  fromUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  fromUrl(env.NEXT_PUBLIC_SITE_URL);
  for (const host of (env.TRY_ON_IMAGE_HOSTS ?? '').split(',')) {
    const clean = host.trim().toLowerCase();
    if (clean) hosts.add(clean);
  }
  return hosts;
}

/**
 * Turns the `productImageUrl` a visitor sent into a URL we are willing to fetch, or null.
 * Accepts https URLs on a trusted host, or a path on this very site ("/images/x.jpg"). Anything else —
 * other hosts, http, credentials in the URL, odd ports, internal addresses — is refused.
 */
export function resolveTrustedImageUrl(raw: string, siteOrigin: string, hosts: Set<string>): URL | null {
  if (raw.length > 2048) return null;
  let url: URL;
  try {
    url = raw.startsWith('/') && !raw.startsWith('//') ? new URL(raw, siteOrigin) : new URL(raw);
  } catch {
    return null;
  }
  const isLocalSite = url.origin === new URL(siteOrigin).origin;
  if (url.protocol !== 'https:' && !(isLocalSite && url.protocol === 'http:')) return null;
  if (url.username || url.password) return null;
  if (url.port && !isLocalSite) return null;
  if (!isLocalSite && !hosts.has(url.hostname.toLowerCase())) return null;
  return url;
}

export type GeminiFailure = { retryable: boolean; kind: 'busy' | 'timeout' | 'blocked' | 'config' | 'other' };

/** Sorts a Gemini SDK / network error into "worth trying the backup model" or not. */
export function classifyGeminiError(err: unknown): GeminiFailure {
  const e = err as { status?: number; name?: string; message?: string } | null;
  const status = typeof e?.status === 'number' ? e.status : undefined;
  const message = String(e?.message ?? '');
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError' || /timed? ?out|aborted/i.test(message)) return { retryable: true, kind: 'timeout' };
  if (status === 429 || /quota|rate limit|resource.?exhausted/i.test(message)) return { retryable: true, kind: 'busy' };
  if (status !== undefined && status >= 500) return { retryable: true, kind: 'busy' };
  if (status === 404) return { retryable: true, kind: 'config' }; // model retired / name wrong — the backup may still work
  if (/SAFETY|blocked|PROHIBITED|prompt was blocked/i.test(message)) return { retryable: false, kind: 'blocked' };
  if (status === 400 || status === 401 || status === 403) return { retryable: false, kind: 'config' };
  // Network failures (fetch failed, connection reset) have no status — try again with the backup.
  if (status === undefined && /fetch failed|network|ECONN|ENOTFOUND|socket/i.test(message)) return { retryable: true, kind: 'busy' };
  return { retryable: false, kind: 'other' };
}
