import { DEFAULT_STORE_SETTINGS, type StoreSettings } from '@/lib/storeSettings';

/**
 * Shared helpers for Video Appointments (Google Meet consultations).
 *
 * Slots are fixed windows in Indian Standard Time whose hours, length, booking
 * window and closed days come from Admin → Settings → Video Appointments
 * (`store_settings.appointments`). The exact instant of a booking is stored as a
 * UTC timestamp in `video_appointments.scheduled_at`.
 */

export const TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';

/** Slot lengths (minutes) the store owner can choose in Admin → Settings. */
export const SLOT_LENGTH_OPTIONS = [2, 3, 5, 15, 30, 45, 60] as const;

export const APPOINTMENT_TOPICS = ['Shopping consultation', 'Product demo', 'Custom / bespoke inquiry'] as const;

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface AppointmentConfig {
  enabled: boolean;
  /** Minutes after midnight IST that the first call may start. */
  startMinutes: number;
  /** Minutes after midnight IST by which the last call must finish. */
  endMinutes: number;
  slotMinutes: number;
  daysAhead: number;
  minLeadHours: number;
  /** 0 = Sunday … 6 = Saturday */
  closedDays: number[];
  /** Customers may type their own time instead of picking a grid slot. */
  allowCustomTime: boolean;
}

function parseTime(value: string, fallback: number) {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return fallback;
  const total = Number(m[1]) * 60 + Number(m[2]);
  return total >= 0 && total < 24 * 60 ? total : fallback;
}

/** Turns the (already type-merged) settings JSON into a sane config, clamping anything out of range. */
export function appointmentConfigFrom(s: StoreSettings['appointments']): AppointmentConfig {
  const slotMinutes = (SLOT_LENGTH_OPTIONS as readonly number[]).includes(s.slotMinutes) ? s.slotMinutes : 30;
  const startMinutes = parseTime(s.startTime, 11 * 60);
  let endMinutes = parseTime(s.endTime, 20 * 60);
  if (endMinutes - startMinutes < slotMinutes) endMinutes = Math.min(24 * 60, startMinutes + slotMinutes);
  return {
    enabled: s.enabled,
    startMinutes,
    endMinutes,
    slotMinutes,
    daysAhead: Math.min(60, Math.max(1, Math.round(s.daysAhead) || 14)),
    minLeadHours: Math.min(72, Math.max(0, s.minLeadHours || 0)),
    closedDays: s.closedDays.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
    allowCustomTime: s.allowCustomTime,
  };
}

export const DEFAULT_APPOINTMENT_CONFIG = appointmentConfigFrom(DEFAULT_STORE_SETTINGS.appointments);

/** "11:00", "11:30", … for every slot start in a day. */
export function slotTimes(cfg: AppointmentConfig): string[] {
  const out: string[] = [];
  for (let m = cfg.startMinutes; m + cfg.slotMinutes <= cfg.endMinutes; m += cfg.slotMinutes) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}

/** Today's calendar date in IST as YYYY-MM-DD. */
export function todayIST(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Calendar dates (IST, YYYY-MM-DD) customers can book: the next `daysAhead` days minus closed weekdays. */
export function bookableDates(cfg: AppointmentConfig, now = new Date()): string[] {
  const start = new Date(`${todayIST(now)}T00:00:00${IST_OFFSET}`).getTime();
  const dates: string[] = [];
  for (let i = 0; i < cfg.daysAhead; i++) {
    const date = todayIST(new Date(start + i * 24 * 60 * 60 * 1000));
    // Weekday of a calendar date doesn't depend on a time zone, so read it from UTC midnight.
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (!cfg.closedDays.includes(weekday)) dates.push(date);
  }
  return dates;
}

/** IST date + "HH:MM" → ISO string (UTC) for the database. */
export function slotToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00${IST_OFFSET}`).toISOString();
}

/** Date ("YYYY-MM-DD") and time ("HH:MM") of an instant, in IST. */
export function istParts(t: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(t);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}` };
}

/** True if a call starting at "HH:MM" would finish inside opening hours. */
export function isWithinHours(time: string, cfg: AppointmentConfig): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return false;
  const start = Number(m[1]) * 60 + Number(m[2]);
  return start >= cfg.startMinutes && start + cfg.slotMinutes <= cfg.endMinutes;
}

/**
 * True if `iso` is a time customers may book: on a bookable day, far enough in
 * the future, and either exactly on a slot or — when custom times are allowed —
 * any minute inside opening hours. (Clashes with other bookings are checked
 * separately, see `overlapsBooked`.)
 */
export function isBookableSlot(iso: string, cfg: AppointmentConfig, now = new Date()): boolean {
  if (!cfg.enabled) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  if (t.getTime() < now.getTime() + cfg.minLeadHours * 60 * 60 * 1000) return false;
  const { date, time } = istParts(t);
  if (!bookableDates(cfg, now).includes(date)) return false;
  if (slotTimes(cfg).includes(time)) return true;
  return cfg.allowCustomTime && isWithinHours(time, cfg);
}

/** True if a call at `iso` would overlap any already-booked start time. */
export function overlapsBooked(iso: string, booked: Iterable<string>, cfg: AppointmentConfig): boolean {
  const t = new Date(iso).getTime();
  const span = cfg.slotMinutes * 60 * 1000;
  for (const b of booked) {
    if (Math.abs(new Date(b).getTime() - t) < span) return true;
  }
  return false;
}

export function formatSlot(iso: string): string {
  return `${new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))} IST`;
}

export function formatSlotTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatDateChip(date: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${date}T12:00:00${IST_OFFSET}`);
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, ...opts }).format(d);
  return { weekday: fmt({ weekday: 'short' }), day: fmt({ day: 'numeric' }), month: fmt({ month: 'short' }) };
}

/** Only allow real http(s) links to be stored/emailed as a Meet link. */
export function isValidMeetLink(link: string): boolean {
  try {
    const u = new URL(link);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
