import { startOfDayInstant } from '../date/iso-date.utils';
import { operatorsFor } from '../query/s-filter-operators';
import type { SFilterCondition, SFilterType, SQueryField } from '../query/s-query.types';
import {
  conditionFrom,
  draftFrom,
  editorKind,
  editorOperators,
  operatorLabelKey,
  parseNumber,
  splitList,
} from './s-column-filter.utils';

function field(type: SFilterType, options?: readonly string[]): SQueryField {
  return {
    name: 'f',
    type,
    filterable: true,
    sortable: true,
    searchable: false,
    nullable: true,
    operators: operatorsFor(type, true),
    options,
  };
}

const roundTrip = (f: SQueryField, condition: SFilterCondition) =>
  conditionFrom(f, draftFrom(f, condition));

describe('column filter utils', () => {
  it('offers calendar wording for days and instants', () => {
    expect(editorOperators(field('datetime'))).toEqual([
      'between',
      'gte',
      'lt',
      'isNull',
      'isNotNull',
    ]);
    expect(editorOperators(field('date'))).toContain('eq');
    expect(editorOperators(field('text'))).toContain('startsWith');
    expect(operatorLabelKey('lt', 'date')).toBe('S.FILTER.OP.BEFORE');
    expect(operatorLabelKey('lt', 'number')).toBe('S.FILTER.OP.LT');
    expect(operatorLabelKey('notContains', 'text')).toBe('S.FILTER.OP.NOT_CONTAINS');
    expect(operatorLabelKey('isNotNull', 'text')).toBe('S.FILTER.OP.IS_NOT_NULL');
  });

  it('picks the editor for each type and operator', () => {
    expect(editorKind(field('text'), 'contains')).toBe('text');
    expect(editorKind(field('text'), 'in')).toBe('list');
    expect(editorKind(field('number'), 'between')).toBe('numberRange');
    expect(editorKind(field('date'), 'between')).toBe('dayRange');
    expect(editorKind(field('datetime'), 'gte')).toBe('day');
    expect(editorKind(field('boolean'), 'eq')).toBe('boolean');
    expect(editorKind(field('enum'), 'notIn')).toBe('choices');
    expect(editorKind(field('guid'), 'isNull')).toBe('none');
  });

  it('starts empty editors on the type default operator and builds nothing', () => {
    const draft = draftFrom(field('text'));
    expect(draft.op).toBe('contains');
    expect(conditionFrom(field('text'), draft)).toBeNull();
    expect(draftFrom(field('datetime')).op).toBe('between');
  });

  it('turns an inclusive day range into the contract range [from, next day)', () => {
    const f = field('date');
    const condition = conditionFrom(f, {
      ...draftFrom(f),
      op: 'between',
      startDay: '2026-10-01',
      endDay: '2026-10-15',
    });
    expect(condition?.value).toEqual(['2026-10-01', '2026-10-16']);
    expect(draftFrom(f, condition!).endDay).toBe('2026-10-15');
  });

  it('sends instants for datetime days, starting at local midnight with an offset', () => {
    const f = field('datetime');
    const condition = conditionFrom(f, { ...draftFrom(f), op: 'gte', day: '2026-10-15' });
    expect(condition).toEqual({
      kind: 'condition',
      field: 'f',
      op: 'gte',
      value: startOfDayInstant('2026-10-15'),
    });
    expect(draftFrom(f, condition!).day).toBe('2026-10-15');
  });

  it('round-trips every other editor', () => {
    const cases: [SQueryField, SFilterCondition][] = [
      [field('text'), { kind: 'condition', field: 'f', op: 'contains', value: 'ada' }],
      [field('text'), { kind: 'condition', field: 'f', op: 'in', value: ['a', 'b'] }],
      [field('number'), { kind: 'condition', field: 'f', op: 'between', value: [18, 65] }],
      [field('number'), { kind: 'condition', field: 'f', op: 'notIn', value: [1, 2] }],
      [field('boolean'), { kind: 'condition', field: 'f', op: 'eq', value: false }],
      [field('enum', ['A', 'B']), { kind: 'condition', field: 'f', op: 'in', value: ['A', 'B'] }],
      [field('enum', ['A', 'B']), { kind: 'condition', field: 'f', op: 'neq', value: 'A' }],
      [field('guid'), { kind: 'condition', field: 'f', op: 'isNull' }],
    ];
    for (const [f, condition] of cases) expect(roundTrip(f, condition)).toEqual(condition);
  });

  it('reads numbers and lists the way people type them', () => {
    expect(parseNumber('1 234,5')).toBe(1234.5);
    expect(parseNumber('')).toBeNaN();
    expect(splitList('a\n b , a;;c')).toEqual(['a', 'b', 'c']);
  });
});
