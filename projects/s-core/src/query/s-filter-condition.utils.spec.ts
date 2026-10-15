import { conditionIssues, isConditionComplete } from './s-filter-condition.utils';
import { operatorsFor } from './s-filter-operators';
import type {
  SFilterCondition,
  SFilterType,
  SFilterValue,
  SQueryField,
  SQueryLimits,
} from './s-query.types';

const limits: SQueryLimits = {
  maxPageSize: 100,
  maxResultWindow: 10_000,
  maxSort: 3,
  maxConditions: 25,
  maxDepth: 3,
  maxInValues: 3,
  maxSearchLength: 200,
  maxTextValueLength: 5,
};

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

function codes(
  type: SFilterType,
  op: SFilterCondition['op'],
  value?: SFilterValue,
  options?: readonly string[],
) {
  const condition: SFilterCondition = { kind: 'condition', field: 'f', op, value };
  return conditionIssues(condition, field(type, options), limits).map((i) => i.code);
}

describe('condition issues (same codes as the server)', () => {
  it('accepts valid values of every type', () => {
    expect(codes('text', 'contains', 'ada')).toEqual([]);
    expect(codes('number', 'between', [1, 2])).toEqual([]);
    expect(codes('date', 'eq', '2026-10-15')).toEqual([]);
    expect(codes('datetime', 'gte', '2026-10-15T08:00:00+02:00')).toEqual([]);
    expect(codes('boolean', 'eq', false)).toEqual([]);
    expect(codes('enum', 'in', ['active'], ['Active', 'Locked'])).toEqual([]);
    expect(codes('guid', 'eq', '00000000-0000-0000-0000-000000000001')).toEqual([]);
    expect(codes('text', 'isNull')).toEqual([]);
  });

  it('rejects operators the type does not allow', () => {
    expect(codes('datetime', 'contains', 'x')).toEqual(['QUERY.OPERATOR_NOT_ALLOWED']);
  });

  it('checks the value shape of each operator', () => {
    expect(codes('number', 'eq')).toEqual(['QUERY.SINGLE_VALUE_REQUIRED']);
    expect(codes('number', 'eq', [1])).toEqual(['QUERY.SINGLE_VALUE_REQUIRED']);
    expect(codes('number', 'between', [1])).toEqual(['QUERY.RANGE_REQUIRED']);
    expect(codes('number', 'between', [2, 2])).toEqual(['QUERY.RANGE_INVERTED']);
    expect(codes('number', 'in', [])).toEqual(['QUERY.LIST_SIZE_OUT_OF_RANGE']);
    expect(codes('number', 'in', [1, 2, 3, 4])).toEqual(['QUERY.LIST_SIZE_OUT_OF_RANGE']);
  });

  it('compares instant ranges by time, not text', () => {
    // 10:00+02:00 is 08:00Z: before 09:00Z although its text sorts after.
    expect(
      codes('datetime', 'between', ['2026-10-15T10:00:00+02:00', '2026-10-15T09:00:00Z']),
    ).toEqual([]);
    expect(
      codes('datetime', 'between', ['2026-10-15T09:00:00Z', '2026-10-15T10:00:00+02:00']),
    ).toEqual(['QUERY.RANGE_INVERTED']);
  });

  it('rejects values of the wrong type or format', () => {
    expect(codes('number', 'eq', '3')).toEqual(['QUERY.INVALID_VALUE']);
    expect(codes('date', 'eq', '15/10/2026')).toEqual(['QUERY.INVALID_VALUE']);
    expect(codes('datetime', 'gt', '2026-10-15T08:00:00')).toEqual(['QUERY.INVALID_VALUE']);
    expect(codes('enum', 'eq', 'Sleeping', ['Active'])).toEqual(['QUERY.INVALID_VALUE']);
    expect(codes('guid', 'eq', 'nope')).toEqual(['QUERY.INVALID_VALUE']);
    expect(codes('number', 'in', [1, 'x'])).toEqual(['QUERY.INVALID_VALUE']);
  });

  it('limits text values and returns the server arguments', () => {
    const condition: SFilterCondition = {
      kind: 'condition',
      field: 'f',
      op: 'contains',
      value: 'toolong',
    };
    expect(conditionIssues(condition, field('text'), limits)).toEqual([
      { code: 'QUERY.TEXT_TOO_LONG', args: { max: 5 } },
    ]);
    expect(isConditionComplete(condition, field('text'), limits)).toBe(false);
  });
});
