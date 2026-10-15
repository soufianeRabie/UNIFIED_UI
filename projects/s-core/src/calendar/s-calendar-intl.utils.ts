import { isoFromParts, toUtcDate } from '../date/iso-date.utils';

/** Calendar text from `Intl` (ADR 0008 §2): every locale, every script, no translation files. */

interface WeekInfoLocale extends Intl.Locale {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

const SUNDAY_FIRST = /-(US|CA|MX|BR|JP|KR|IL|PH|IN|ZA)$/i;

/** First day of the week for a locale: 1 = Monday … 7 = Sunday (CLDR when the engine exposes it). */
export function firstDayOfWeek(locale: string): number {
  try {
    const info = new Intl.Locale(locale) as WeekInfoLocale;
    const week = info.getWeekInfo?.() ?? info.weekInfo;
    if (week?.firstDay) return week.firstDay;
  } catch {
    // Unknown locale: fall through to the region rule.
  }
  return SUNDAY_FIRST.test(locale) ? 7 : 1;
}

/** Seven weekday names starting at `firstDay`, short (`lun.`) and long (`lundi`) for `abbr` titles. */
export function weekdayNames(
  locale: string,
  firstDay: number,
): readonly { readonly short: string; readonly long: string }[] {
  const short = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  // 2024-01-01 is a Monday: day n of that week is ISO weekday n.
  return Array.from({ length: 7 }, (_, i) => {
    const date = toUtcDate(isoFromParts(2024, 1, ((firstDay - 1 + i) % 7) + 1));
    return { short: short.format(date), long: long.format(date) };
  });
}

/** `octobre 2026`, `أكتوبر 2026`. */
export function monthTitle(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtcDate(isoFromParts(year, month, 1)));
}

/** Full spoken date for screen readers: `jeudi 15 octobre 2026`. */
export function dayLabel(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(
    toUtcDate(iso),
  );
}

/** Display of a day in a field: `15 oct. 2026`. */
export function formatDay(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    toUtcDate(iso),
  );
}

/** Day number in the locale's digits. */
export function dayNumber(locale: string, day: number): string {
  return new Intl.NumberFormat(locale, { useGrouping: false }).format(day);
}
