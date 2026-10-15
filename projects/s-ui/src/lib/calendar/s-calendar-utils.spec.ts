import { monthGrid, pickRange, type GridInput } from './s-calendar-grid.utils';
import {
  dayNumber,
  firstDayOfWeek,
  formatDay,
  monthTitle,
  weekdayNames,
} from './s-calendar-intl.utils';
import { nextFocusedDay } from './s-calendar-keys.utils';

const base: GridInput = {
  year: 2026,
  month: 10,
  firstDay: 1,
  mode: 'single',
  value: '2026-10-15',
  range: null,
  today: '2026-10-14',
  focused: '2026-10-15',
  label: (iso) => iso,
  number: String,
};

describe('calendar grid', () => {
  it('always shows six weeks starting on the locale first day', () => {
    const weeks = monthGrid(base);
    expect(weeks).toHaveLength(6);
    // October 2026 starts on a Thursday: Monday-first grids start on 28 September.
    expect(weeks[0][0].iso).toBe('2026-09-28');
    expect(weeks[0][0].inMonth).toBe(false);
    expect(monthGrid({ ...base, firstDay: 7 })[0][0].iso).toBe('2026-09-27');
  });

  it('marks today, the selection, the focus and the limits', () => {
    const days = monthGrid({ ...base, min: '2026-10-05', max: '2026-10-25' }).flat();
    const day = (iso: string) => days.find((d) => d.iso === iso)!;
    expect(day('2026-10-14').today).toBe(true);
    expect(day('2026-10-15').selected).toBe(true);
    expect(days.filter((d) => d.focusable).map((d) => d.iso)).toEqual(['2026-10-15']);
    expect(day('2026-10-04').disabled).toBe(true);
    expect(day('2026-10-26').disabled).toBe(true);
  });

  it('shades a range, whichever end was picked first', () => {
    const days = monthGrid({
      ...base,
      mode: 'range',
      range: { start: '2026-10-20', end: '2026-10-10' },
    }).flat();
    const day = (iso: string) => days.find((d) => d.iso === iso)!;
    expect(day('2026-10-10').rangeStart).toBe(true);
    expect(day('2026-10-20').rangeEnd).toBe(true);
    expect(day('2026-10-15').inRange).toBe(true);
    expect(day('2026-10-21').inRange).toBe(false);
  });

  it('picks ranges click by click', () => {
    const first = pickRange(null, '2026-10-10');
    expect(first).toEqual({ start: '2026-10-10', end: null });
    expect(pickRange(first, '2026-10-12')).toEqual({ start: '2026-10-10', end: '2026-10-12' });
    expect(pickRange(first, '2026-10-01')).toEqual({ start: '2026-10-01', end: '2026-10-10' });
    expect(pickRange({ start: '2026-10-01', end: '2026-10-05' }, '2026-10-20')).toEqual({
      start: '2026-10-20',
      end: null,
    });
  });
});

describe('calendar keyboard', () => {
  const ltr = { rtl: false, firstDay: 1 };
  it('moves by day, week, week edges and months', () => {
    expect(nextFocusedDay('2026-10-15', 'ArrowRight', ltr)).toBe('2026-10-16');
    expect(nextFocusedDay('2026-10-15', 'ArrowUp', ltr)).toBe('2026-10-08');
    expect(nextFocusedDay('2026-10-15', 'Home', ltr)).toBe('2026-10-12');
    expect(nextFocusedDay('2026-10-15', 'End', ltr)).toBe('2026-10-18');
    expect(nextFocusedDay('2026-01-31', 'PageDown', ltr)).toBe('2026-02-28');
    expect(nextFocusedDay('2026-10-15', 'PageUp', { ...ltr, shift: true })).toBe('2025-10-15');
    expect(nextFocusedDay('2026-10-15', 'a', ltr)).toBeNull();
  });

  it('follows the reading direction in RTL', () => {
    expect(nextFocusedDay('2026-10-15', 'ArrowLeft', { rtl: true, firstDay: 1 })).toBe(
      '2026-10-16',
    );
  });
});

describe('calendar Intl', () => {
  it('knows where weeks start', () => {
    expect(firstDayOfWeek('fr-FR')).toBe(1);
    expect(firstDayOfWeek('en-US')).toBe(7);
  });

  it('names weekdays and months in the locale', () => {
    const names = weekdayNames('fr-FR', 1);
    expect(names).toHaveLength(7);
    expect(names[0].long).toBe('lundi');
    expect(weekdayNames('en-US', 7)[0].long).toBe('Sunday');
    expect(monthTitle('fr-FR', 2026, 10)).toBe('octobre 2026');
    expect(formatDay('en-GB', '2026-10-15')).toBe('15 Oct 2026');
  });

  it('writes day numbers in the locale digits', () => {
    expect(dayNumber('en-GB', 15)).toBe('15');
    expect(dayNumber('ar-EG', 15)).toBe('١٥');
  });
});
