import { addDays, compareIso, isoFromParts, isoPartsOf, isoWeekday } from '../date/iso-date.utils';
import type { CalendarDay, CalendarMode, SDateRange } from './s-calendar.types';

export interface GridInput {
  readonly year: number;
  readonly month: number;
  readonly firstDay: number;
  readonly mode: CalendarMode;
  readonly value: string | null;
  readonly range: SDateRange | null;
  readonly today: string;
  readonly focused: string;
  readonly min?: string;
  readonly max?: string;
  /** Spoken label of a day (`Intl` full date). */
  readonly label: (iso: string) => string;
  /** Day number in the locale's digits. */
  readonly number: (day: number) => string;
}

/** Six weeks, always: the grid never changes height when the month changes. */
export function monthGrid(input: GridInput): readonly (readonly CalendarDay[])[] {
  const first = isoFromParts(input.year, input.month, 1);
  const leading = (isoWeekday(first) - input.firstDay + 7) % 7;
  const start = addDays(first, -leading);
  const range = normalizeRange(input.range);

  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const iso = addDays(start, week * 7 + weekday);
      const parts = isoPartsOf(iso);
      const rangeStart = input.mode === 'range' && iso === range.start;
      const rangeEnd = input.mode === 'range' && iso === range.end;
      return {
        iso,
        text: input.number(parts.day),
        label: input.label(iso),
        inMonth: parts.month === input.month,
        today: iso === input.today,
        selected: input.mode === 'single' ? iso === input.value : rangeStart || rangeEnd,
        rangeStart,
        rangeEnd,
        inRange:
          input.mode === 'range' &&
          !!range.start &&
          !!range.end &&
          iso > range.start &&
          iso < range.end,
        disabled: isOutside(iso, input.min, input.max),
        focusable: iso === input.focused,
      };
    }),
  );
}

export function isOutside(iso: string, min?: string, max?: string): boolean {
  return (!!min && compareIso(iso, min) < 0) || (!!max && compareIso(iso, max) > 0);
}

/**
 * A click in range mode: the first click starts a range, the second ends it (in either order), the next one
 * starts again.
 */
export function pickRange(range: SDateRange | null, iso: string): SDateRange {
  if (!range?.start || range.end) return { start: iso, end: null };
  return compareIso(iso, range.start) < 0
    ? { start: iso, end: range.start }
    : { start: range.start, end: iso };
}

function normalizeRange(range: SDateRange | null): SDateRange {
  if (!range?.start || !range.end) return { start: range?.start ?? null, end: null };
  return compareIso(range.start, range.end) <= 0 ? range : { start: range.end, end: range.start };
}
