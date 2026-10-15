import { S_OPERATORS_BY_TYPE, arityOf, defaultOperator, operatorsFor } from './s-filter-operators';
import type { SFilterType } from './s-query.types';

describe('filter operators', () => {
  it('mirrors the server matrix (handbook 08 §3)', () => {
    expect(S_OPERATORS_BY_TYPE.datetime).toEqual([
      'gt',
      'gte',
      'lt',
      'lte',
      'between',
      'isNull',
      'isNotNull',
    ]);
    expect(S_OPERATORS_BY_TYPE.boolean).toEqual(['eq', 'isNull', 'isNotNull']);
    expect(S_OPERATORS_BY_TYPE.text).toContain('startsWith');
    expect(S_OPERATORS_BY_TYPE.date).not.toContain('in');
  });

  it('offers null checks only on nullable fields', () => {
    expect(operatorsFor('number', false)).not.toContain('isNull');
    expect(operatorsFor('number', true)).toContain('isNotNull');
  });

  it('knows how many values each operator takes', () => {
    expect(arityOf('isNull')).toBe('none');
    expect(arityOf('contains')).toBe('one');
    expect(arityOf('between')).toBe('pair');
    expect(arityOf('notIn')).toBe('list');
  });

  it('starts every type with an operator it allows', () => {
    for (const type of Object.keys(S_OPERATORS_BY_TYPE) as SFilterType[]) {
      expect(S_OPERATORS_BY_TYPE[type]).toContain(defaultOperator(type));
    }
  });
});
