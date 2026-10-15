import { addDays, addMonths, isoWeekday } from '../date/iso-date.utils';

/**
 * Keyboard of the day grid (WAI-ARIA date grid pattern). Arrows follow the reading direction: in RTL the left
 * arrow moves to the next day. Returns the day to focus, or `null` when the key is not ours.
 */
export function nextFocusedDay(
  iso: string,
  key: string,
  options: { readonly rtl: boolean; readonly firstDay: number; readonly shift?: boolean },
): string | null {
  const forward = options.rtl ? -1 : 1;
  const column = (isoWeekday(iso) - options.firstDay + 7) % 7;
  switch (key) {
    case 'ArrowRight':
      return addDays(iso, forward);
    case 'ArrowLeft':
      return addDays(iso, -forward);
    case 'ArrowDown':
      return addDays(iso, 7);
    case 'ArrowUp':
      return addDays(iso, -7);
    case 'Home':
      return addDays(iso, -column);
    case 'End':
      return addDays(iso, 6 - column);
    case 'PageUp':
      return addMonths(iso, options.shift ? -12 : -1);
    case 'PageDown':
      return addMonths(iso, options.shift ? 12 : 1);
    default:
      return null;
  }
}
