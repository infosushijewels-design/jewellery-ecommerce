/**
 * Zoom helper (Server-to-Server OAuth). SERVER ONLY — import it from route handlers, never from a
 * Client Component. It reads ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET (plus the optional
 * ZOOM_HOST_EMAIL), which have no NEXT_PUBLIC_ prefix and so are never sent to the browser.
 *
 * Nothing here throws at import time or when the credentials are missing: functions return a
 * `{ ok: false, error }` result so callers can fall back (e.g. let the admin paste a link by hand).
 */

const TOKEN_URL = 'https://zoom.us/oauth/token';
const API_BASE = 'https://api.zoom.us/v2';
const TIME_ZONE = 'Asia/Kolkata';
const REQUEST_TIMEOUT_MS = 10_000;

export interface ZoomMeeting {
  /** Zoom's numeric meeting id, kept as a string (it can exceed safe integer range in future). */
  id: string;
  /** Link for the customer. */
  joinUrl: string;
  /** Host-only link that starts the meeting without logging in. Treat as a secret. */
  startUrl: string;
  /** Meeting passcode, if Zoom set one (it is also embedded in joinUrl). */
  password: string | null;
}

export type ZoomResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface CreateZoomMeetingInput {
  /** Shown in the Zoom app, e.g. "Anjali — Product demo". */
  topic: string;
  /** Meeting start as an ISO-8601 instant (the booking's `scheduled_at`). */
  startTime: string;
  /** Length in minutes (the booking's slot length). */
  durationMinutes: number;
  /** Optional notes shown to the host. */
  agenda?: string;
}

function getConfig() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) return null;
  return { accountId, clientId, clientSecret };
}

/** True when all three Zoom credentials are set. */
export function isZoomConfigured(): boolean {
  return getConfig() !== null;
}

// Access tokens last about an hour; keep one in memory and refresh it a minute early.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function readZoomError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; reason?: string };
    return body.message || body.reason || `Zoom returned HTTP ${res.status}.`;
  } catch {
    return `Zoom returned HTTP ${res.status}.`;
  }
}

async function getAccessToken(forceRefresh = false): Promise<ZoomResult<string>> {
  const config = getConfig();
  if (!config) return { ok: false, error: 'Zoom is not configured yet (missing ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET).' };

  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return { ok: true, value: cachedToken.value };
  }

  try {
    const url = `${TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(config.accountId)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) {
      cachedToken = null;
      console.error('Zoom token request failed:', res.status);
      return { ok: false, error: `Could not sign in to Zoom: ${await readZoomError(res)}` };
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return { ok: false, error: 'Zoom did not return an access token.' };
    const ttlMs = Math.max(0, (data.expires_in ?? 3600) - 60) * 1000;
    cachedToken = { value: data.access_token, expiresAt: Date.now() + ttlMs };
    return { ok: true, value: data.access_token };
  } catch (err) {
    console.error('Zoom token request error:', err instanceof Error ? err.message : err);
    return { ok: false, error: 'Could not reach Zoom. Please try again.' };
  }
}

type ZoomApiResponse = { status: number; data: unknown };

/**
 * Authenticated call to the Zoom REST API. A 401 (token revoked/expired early) is retried once with a
 * fresh token. Non-2xx answers become `{ ok: false, error }` carrying Zoom's own message.
 */
async function zoomApi(method: 'POST' | 'DELETE', path: string, body?: unknown): Promise<ZoomResult<ZoomApiResponse>> {
  for (const forceRefresh of [false, true]) {
    const token = await getAccessToken(forceRefresh);
    if (!token.ok) return token;

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token.value}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      });

      if (res.status === 401 && !forceRefresh) {
        cachedToken = null;
        continue; // retry once with a brand-new token
      }
      if (!res.ok) {
        console.error(`Zoom ${method} ${path.replace(/\d{6,}/, ':id')} failed:`, res.status);
        return { ok: false, error: await readZoomError(res) };
      }

      let data: unknown = null;
      if (res.status !== 204) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }
      return { ok: true, value: { status: res.status, data } };
    } catch (err) {
      console.error('Zoom request error:', err instanceof Error ? err.message : err);
      return { ok: false, error: 'Could not reach Zoom. Please try again.' };
    }
  }

  return { ok: false, error: 'Zoom rejected the request. Check the app credentials and scopes.' };
}

/** Creates a scheduled Zoom meeting on the account's default user and returns its links. */
export async function createZoomMeeting(input: CreateZoomMeetingInput): Promise<ZoomResult<ZoomMeeting>> {
  const start = new Date(input.startTime);
  if (Number.isNaN(start.getTime())) return { ok: false, error: 'Invalid meeting start time.' };
  const duration = Math.max(1, Math.round(input.durationMinutes));

  // Meetings are created on behalf of a Zoom user. Server-to-Server OAuth apps are account-level, so Zoom
  // generally wants that user's email (or id) rather than the "me" shortcut — set ZOOM_HOST_EMAIL to the
  // licensed user who should host. "me" is only the fallback when it is not set.
  const host = encodeURIComponent(process.env.ZOOM_HOST_EMAIL?.trim() || 'me');
  const res = await zoomApi('POST', `/users/${host}/meetings`, {
    topic: input.topic.slice(0, 200),
    type: 2, // scheduled meeting
    // Zoom wants "yyyy-MM-ddTHH:mm:ssZ" for UTC — no milliseconds.
    start_time: start.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    duration,
    timezone: TIME_ZONE,
    agenda: input.agenda?.slice(0, 2000),
    settings: {
      host_video: true,
      participant_video: true,
      waiting_room: true, // customers wait until the host lets them in
      join_before_host: false, // required to be false when the waiting room is on
      mute_upon_entry: false,
    },
  });
  if (!res.ok) return res;

  const data = (res.value.data ?? {}) as { id?: number | string; join_url?: string; start_url?: string; password?: string };
  if (data.id === undefined || !data.join_url || !data.start_url) {
    return { ok: false, error: 'Zoom returned an incomplete meeting.' };
  }
  return {
    ok: true,
    value: { id: String(data.id), joinUrl: data.join_url, startUrl: data.start_url, password: data.password || null },
  };
}

/**
 * Deletes a Zoom meeting. A meeting that no longer exists (404 — already deleted by hand) counts as success,
 * so cancelling twice or cancelling after a manual delete never errors.
 */
export async function deleteZoomMeeting(meetingId: string): Promise<ZoomResult<true>> {
  if (!/^\d{6,}$/.test(meetingId)) return { ok: false, error: 'Invalid Zoom meeting id.' };
  const res = await zoomApi('DELETE', `/meetings/${meetingId}`);
  if (res.ok) return { ok: true, value: true };
  if (/does not exist|not found|invalid meeting/i.test(res.error)) return { ok: true, value: true };
  return res;
}
