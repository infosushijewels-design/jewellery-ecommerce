/**
 * Small helpers that keep bots and floods away from public form endpoints (contact form, newsletter).
 * Server-only (uses node:crypto). None of these identify a person: an IP address is only ever stored as a
 * keyed one-way hash, and is used solely to count "how many from this visitor in the last hour".
 */
import { createHmac } from 'crypto';

/** One-way hash of the caller's IP (Vercel puts the real address first in x-forwarded-for), or null if unknown. */
export function clientIpHash(request: Request, secret: string): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') ?? '').trim();
  if (!ip) return null;
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32);
}

/**
 * Cheap bot checks on the two hidden fields our forms add:
 *  - `website` is a field real visitors never see; bots that fill every input fill it too;
 *  - `startedAt` is when the form was opened; nobody can read and fill a form in under a couple of seconds.
 * A missing or invalid `startedAt` also counts as a bot (our forms always send it).
 */
export function isBotSubmission(input: { honeypot?: unknown; startedAt?: unknown }, now = Date.now(), minMs = 2500): boolean {
  if (typeof input.honeypot === 'string' && input.honeypot.trim() !== '') return true;
  if (typeof input.startedAt !== 'number' || !Number.isFinite(input.startedAt)) return true;
  const elapsed = now - input.startedAt;
  return elapsed < minMs; // also catches a start time in the future
}

/** How many rows of `table` match `column = value` and were created within the last `windowMinutes`. */
export async function recentCount(
  admin: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  table: string,
  filter: { column: string; value: string } | null,
  windowMinutes: number,
  now = Date.now()
): Promise<number> {
  const since = new Date(now - windowMinutes * 60 * 1000).toISOString();
  let query = admin.from(table).select('id', { count: 'exact', head: true }).gte('created_at', since);
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) {
    // Failing open here would let a flood through, but failing closed would block real customers when the
    // database hiccups — the form still validates and the database enforces its own limits, so allow the request.
    console.error(`Rate-limit lookup on ${table} failed:`, error);
    return 0;
  }
  return count ?? 0;
}
