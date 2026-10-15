import type { SFilterOperator, SFilterType, SOperatorArity } from './s-query.types';

/** Which operators each type accepts — mirror of the server's `OperatorMatrix` (handbook 08 §3). */
export const S_OPERATORS_BY_TYPE: Readonly<Record<SFilterType, readonly SFilterOperator[]>> = {
  text: [
    'eq',
    'neq',
    'contains',
    'notContains',
    'startsWith',
    'endsWith',
    'in',
    'notIn',
    'isNull',
    'isNotNull',
  ],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  datetime: ['gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'isNotNull'],
  boolean: ['eq', 'isNull', 'isNotNull'],
  enum: ['eq', 'neq', 'in', 'notIn', 'isNull', 'isNotNull'],
  guid: ['eq', 'neq', 'in', 'notIn', 'isNull', 'isNotNull'],
};

const NULL_CHECKS: readonly SFilterOperator[] = ['isNull', 'isNotNull'];

/** Operators offered for a field: null checks only when the field can be empty. */
export function operatorsFor(type: SFilterType, nullable: boolean): readonly SFilterOperator[] {
  const all = S_OPERATORS_BY_TYPE[type];
  return nullable ? all : all.filter((op) => !NULL_CHECKS.includes(op));
}

export function arityOf(op: SFilterOperator): SOperatorArity {
  switch (op) {
    case 'isNull':
    case 'isNotNull':
      return 'none';
    case 'between':
      return 'pair';
    case 'in':
    case 'notIn':
      return 'list';
    default:
      return 'one';
  }
}

/** The operator a column filter starts with for a type (the most common intent). */
export function defaultOperator(type: SFilterType): SFilterOperator {
  switch (type) {
    case 'text':
      return 'contains';
    case 'enum':
      return 'in';
    case 'datetime':
      return 'between';
    default:
      return 'eq';
  }
}
