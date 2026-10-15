/**
 * Calendar days as ISO strings (`YYYY-MM-DD`), computed in UTC so no local time zone or daylight-saving change can
 * shift a day. The only place where the user's zone matters is `startOfDayInstant` (filters on instants).
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface IsoParts {
  readonly year: number;
  /** 1–12 */
  readonly month: number;
  readonly day: number;
}

export function parseIsoDate(iso: string): IsoParts | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? { year, month, day }
    : null;
}

/** Parts of a day known to be valid (values produced by these utilities); throws on anything else. */
export function isoPartsOf(iso: string): IsoParts {
  const parts = parseIsoDate(iso);
  if (!parts) throw new Error(`Invalid ISO date "${iso}".`);
  return parts;
}

export function isoFromParts(year: number, month: number, day: number): string {
  return isoFromUtc(new Date(Date.UTC(year, month - 1, day)));
}

export function isoFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today in the user's zone, as a calendar day. */
export function todayIso(now: Date = new Date()): string {
  return isoFromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function toUtcDate(iso: string): Date {
  const parts = parseIsoDate(iso);
  if (!parts) throw new Error(`Invalid ISO date "${iso}".`);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function addDays(iso: string, days: number): string {
  const date = toUtcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromUtc(date);
}

/** Same day of another month, clamped to that month's length (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const { year, month, day } = parseIsoDate(iso) ?? { year: 1970, month: 1, day: 1 };
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const length = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return isoFromParts(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(day, length));
}

/** ISO days compare as text. */
export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: string): number {
  const day = toUtcDate(iso).getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * The instant a calendar day starts in the user's zone, with its offset (`2026-10-15T00:00:00+02:00`): what a
 * `datetime` filter must send — the server never guesses a zone (handbook 08 §3).
 */
export function startOfDayInstant(iso: string): string {
  const { year, month, day } = parseIsoDate(iso) ?? { year: 1970, month: 1, day: 1 };
  const local = new Date(year, month - 1, day);
  const offset = -local.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${iso}T00:00:00${sign}${hours}:${minutes}`;
}

/** The calendar day (user's zone) of an instant with offset — the inverse of `startOfDayInstant`. */
export function isoOfInstant(instant: string): string | null {
  const time = Date.parse(instant);
  return Number.isNaN(time) ? null : todayIso(new Date(time));
}
