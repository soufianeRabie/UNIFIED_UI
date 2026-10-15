import { formatDay } from '../calendar/s-calendar-intl.utils';
import { addDays, isoOfInstant } from '../date/iso-date.utils';
import { arityOf } from '../query/s-filter-operators';
import type { SFilterCondition, SFilterScalar, SQueryField } from '../query/s-query.types';

export interface ChipFormat {
  readonly locale: string;
  readonly yes: string;
  readonly no: string;
}

const MAX_LISTED = 3;

/**
 * Readable value of a column filter in the user's locale: `18 – 65`, `1 Oct 2026 – 15 Oct 2026`, `Active, Locked
 * +2`. Day ranges show the last included day (the contract's end is exclusive). Empty for null checks.
 */
export function chipValueText(
  field: SQueryField,
  condition: SFilterCondition,
  format: ChipFormat,
): string {
  const arity = arityOf(condition.op);
  if (arity === 'none' || condition.value === undefined) return '';
  const values = Array.isArray(condition.value)
    ? (condition.value as readonly SFilterScalar[])
    : [condition.value as SFilterScalar];

  if (arity === 'pair' && isDay(field)) {
    const from = dayOf(field, values[0]);
    const to = dayOf(field, values[1]);
    return `${showDay(format, from)} – ${showDay(format, to ? addDays(to, -1) : null)}`;
  }
  if (arity === 'pair')
    return `${one(field, values[0], format)} – ${one(field, values[1], format)}`;

  const shown = values.slice(0, MAX_LISTED).map((value) => one(field, value, format));
  const more = values.length - shown.length;
  return more > 0 ? `${shown.join(', ')} +${more}` : shown.join(', ');
}

function one(field: SQueryField, value: SFilterScalar, format: ChipFormat): string {
  switch (field.type) {
    case 'boolean':
      return value ? format.yes : format.no;
    case 'number':
      return typeof value === 'number'
        ? new Intl.NumberFormat(format.locale).format(value)
        : String(value);
    case 'date':
    case 'datetime':
      return showDay(format, dayOf(field, value));
    default:
      return String(value);
  }
}

function isDay(field: SQueryField): boolean {
  return field.type === 'date' || field.type === 'datetime';
}

/** The calendar day a value stands for: the day itself, or the user-zone day an instant falls on. */
function dayOf(field: SQueryField, value: SFilterScalar | undefined): string | null {
  if (value === undefined) return null;
  return field.type === 'datetime' ? isoOfInstant(String(value)) : String(value);
}

function showDay(format: ChipFormat, day: string | null): string {
  return day ? formatDay(format.locale, day) : '…';
}
