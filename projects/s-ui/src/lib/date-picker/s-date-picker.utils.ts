import { formatDay } from '../calendar/s-calendar-intl.utils';
import type { CalendarMode, SDateRange } from '../calendar/s-calendar.types';

/** What the closed picker shows, in the locale's date format, or `null` when empty (placeholder). */
export function pickerText(
  locale: string,
  mode: CalendarMode,
  value: string | null,
  range: SDateRange | null,
): string | null {
  if (mode === 'single') return value ? formatDay(locale, value) : null;
  if (!range?.start) return null;
  const start = formatDay(locale, range.start);
  return range.end ? `${start} – ${formatDay(locale, range.end)}` : `${start} – …`;
}

/** Form value of the picker: an ISO day, a range, or null. */
export type DatePickerValue = string | SDateRange | null;

export function isEmptyPick(
  mode: CalendarMode,
  value: string | null,
  range: SDateRange | null,
): boolean {
  return mode === 'single' ? !value : !range?.start;
}
