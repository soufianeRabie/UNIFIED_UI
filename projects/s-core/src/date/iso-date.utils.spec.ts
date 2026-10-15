import {
  addDays,
  addMonths,
  compareIso,
  isoOfInstant,
  isoWeekday,
  parseIsoDate,
  startOfDayInstant,
  todayIso,
} from './iso-date.utils';

describe('iso date utils', () => {
  it('parses only real calendar days', () => {
    expect(parseIsoDate('2026-02-28')).toEqual({ year: 2026, month: 2, day: 28 });
    expect(parseIsoDate('2026-02-29')).toBeNull();
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('15/10/2026')).toBeNull();
  });

  it('moves by days and months, clamping month ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29');
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15');
  });

  it('compares and knows weekdays', () => {
    expect(compareIso('2026-01-09', '2026-01-10')).toBe(-1);
    expect(isoWeekday('2026-10-12')).toBe(1);
    expect(isoWeekday('2026-10-18')).toBe(7);
  });

  it('builds local-midnight instants with an explicit offset and reads them back', () => {
    const instant = startOfDayInstant('2026-10-15');
    expect(instant).toMatch(/^2026-10-15T00:00:00[+-]\d{2}:\d{2}$/);
    expect(new Date(instant).getHours()).toBe(0);
    expect(isoOfInstant(instant)).toBe('2026-10-15');
  });

  it('takes today from the local clock', () => {
    expect(todayIso(new Date(2026, 9, 15, 23, 30))).toBe('2026-10-15');
  });
});
