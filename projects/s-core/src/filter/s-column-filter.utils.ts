import { addDays, isoOfInstant, startOfDayInstant } from '../date/iso-date.utils';
import type { SUiLabelKey } from '../i18n/s-labels';
import { arityOf, defaultOperator } from '../query/s-filter-operators';
import type {
  SFilterCondition,
  SFilterOperator,
  SFilterScalar,
  SQueryField,
} from '../query/s-query.types';
import type { FilterDraft, FilterEditorKind } from './s-column-filter.types';

const DAY_OPERATORS: readonly SFilterOperator[] = [
  'eq',
  'neq',
  'between',
  'gte',
  'lt',
  'isNull',
  'isNotNull',
];
const INSTANT_OPERATORS: readonly SFilterOperator[] = [
  'between',
  'gte',
  'lt',
  'isNull',
  'isNotNull',
];

/**
 * Operators offered in the editor. Days and instants get the calendar wording users think in (on, before,
 * on or after, between); every other type gets the server's list for the field.
 */
export function editorOperators(field: SQueryField): readonly SFilterOperator[] {
  const preferred =
    field.type === 'date' ? DAY_OPERATORS : field.type === 'datetime' ? INSTANT_OPERATORS : null;
  return preferred ? preferred.filter((op) => field.operators.includes(op)) : field.operators;
}

export function editorKind(field: SQueryField, op: SFilterOperator): FilterEditorKind {
  const arity = arityOf(op);
  if (arity === 'none') return 'none';
  switch (field.type) {
    case 'boolean':
      return 'boolean';
    case 'enum':
      return arity === 'list' ? 'choices' : 'choice';
    case 'date':
    case 'datetime':
      return arity === 'pair' ? 'dayRange' : 'day';
    case 'number':
      return arity === 'pair' ? 'numberRange' : arity === 'list' ? 'list' : 'number';
    default:
      return arity === 'list' ? 'list' : 'text';
  }
}

/** Label of an operator for a field type. */
export function operatorLabelKey(op: SFilterOperator, type: SQueryField['type']): SUiLabelKey {
  if (type === 'date' || type === 'datetime') {
    if (op === 'eq') return 'S.FILTER.OP.ON';
    if (op === 'lt') return 'S.FILTER.OP.BEFORE';
    if (op === 'gte') return 'S.FILTER.OP.ON_OR_AFTER';
  }
  return `S.FILTER.OP.${op.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}` as SUiLabelKey;
}

const EMPTY: Omit<FilterDraft, 'op'> = {
  text: '',
  from: '',
  to: '',
  day: null,
  startDay: null,
  endDay: null,
  flag: null,
  choices: [],
};

/** Editor values for an existing condition (or the type's default operator when there is none). */
export function draftFrom(field: SQueryField, condition?: SFilterCondition): FilterDraft {
  const operators = editorOperators(field);
  if (!condition || !operators.includes(condition.op)) {
    const op = operators.includes(defaultOperator(field.type))
      ? defaultOperator(field.type)
      : operators[0];
    return { ...EMPTY, op };
  }
  const values = Array.isArray(condition.value)
    ? (condition.value as readonly SFilterScalar[])
    : [];
  const single = Array.isArray(condition.value)
    ? undefined
    : (condition.value as SFilterScalar | undefined);
  // Day editors exist only for days and instants; other types never get day values.
  const isDay = field.type === 'date' || field.type === 'datetime';
  const day = (value: SFilterScalar | undefined) =>
    value === undefined || !isDay
      ? null
      : field.type === 'datetime'
        ? isoOfInstant(String(value))
        : String(value);
  const end = values[1] === undefined ? null : day(values[1]);
  return {
    ...EMPTY,
    op: condition.op,
    text: single === undefined || typeof single === 'boolean' ? values.join('\n') : String(single),
    from: values[0] === undefined ? '' : String(values[0]),
    to: values[1] === undefined ? '' : String(values[1]),
    day: day(single),
    startDay: day(values[0]),
    // The contract's range is [from, to): the editor shows the last included day.
    endDay: end && condition.op === 'between' ? addDays(end, -1) : end,
    flag: typeof single === 'boolean' ? single : null,
    choices: single !== undefined ? [String(single)] : values.map(String),
  };
}

/**
 * The condition the editor means, or `null` when nothing was entered (Apply then removes the filter). Values are
 * typed for the contract; validity is checked separately with `conditionIssues`.
 */
export function conditionFrom(field: SQueryField, draft: FilterDraft): SFilterCondition | null {
  const make = (value?: SFilterCondition['value']): SFilterCondition =>
    value === undefined
      ? { kind: 'condition', field: field.name, op: draft.op }
      : { kind: 'condition', field: field.name, op: draft.op, value };
  const instant = (iso: string) => (field.type === 'datetime' ? startOfDayInstant(iso) : iso);

  switch (editorKind(field, draft.op)) {
    case 'none':
      return make();
    case 'text':
      return draft.text.trim() ? make(draft.text.trim()) : null;
    case 'number':
      return draft.text.trim() ? make(parseNumber(draft.text)) : null;
    case 'numberRange':
      return draft.from.trim() || draft.to.trim()
        ? make([parseNumber(draft.from), parseNumber(draft.to)])
        : null;
    case 'day':
      return draft.day ? make(instant(draft.day)) : null;
    case 'dayRange':
      return draft.startDay && draft.endDay
        ? make([instant(draft.startDay), instant(addDays(draft.endDay, 1))])
        : null;
    case 'boolean':
      return draft.flag === null ? null : make(draft.flag);
    case 'choice':
      return draft.choices[0] ? make(draft.choices[0]) : null;
    case 'choices':
      return draft.choices.length > 0 ? make(draft.choices) : null;
    case 'list': {
      const items = splitList(draft.text);
      return items.length === 0
        ? null
        : make(field.type === 'number' ? items.map(parseNumber) : items);
    }
  }
}

/** One value per line (or comma), trimmed, without empties or duplicates. */
export function splitList(text: string): readonly string[] {
  return [
    ...new Set(
      text
        .split(/[\n,;]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

/** Lenient number entry: spaces as group separators, comma or dot as decimal separator. NaN when not a number. */
export function parseNumber(text: string): number {
  const normalized = text.replace(/[\s  ]/g, '').replace(',', '.');
  return normalized === '' ? Number.NaN : Number(normalized);
}
