import { arityOf } from './s-filter-operators';
import type {
  SFilterCondition,
  SFilterScalar,
  SQueryField,
  SQueryIssue,
  SQueryLimits,
} from './s-query.types';

/**
 * Client-side mirror of the server's value rules, returning the **same codes and arguments** (`QUERY.*`), so the UI
 * shows the same translated message before sending as it would after a 400. The server stays the authority.
 */
export function conditionIssues(
  condition: SFilterCondition,
  field: SQueryField,
  limits: SQueryLimits,
): readonly SQueryIssue[] {
  if (!field.operators.includes(condition.op)) {
    return [
      {
        code: 'QUERY.OPERATOR_NOT_ALLOWED',
        args: { op: condition.op, field: field.name, type: field.type },
      },
    ];
  }

  const value = condition.value;
  switch (arityOf(condition.op)) {
    case 'none':
      return [];
    case 'one':
      return value === undefined || Array.isArray(value)
        ? [{ code: 'QUERY.SINGLE_VALUE_REQUIRED', args: { op: condition.op } }]
        : valueIssues(value as SFilterScalar, field, limits);
    case 'pair': {
      if (!Array.isArray(value) || value.length !== 2) {
        return [{ code: 'QUERY.RANGE_REQUIRED', args: {} }];
      }
      const [from, to] = value as readonly SFilterScalar[];
      const issues = [...valueIssues(from, field, limits), ...valueIssues(to, field, limits)];
      return issues.length > 0
        ? issues
        : isBefore(from, to, field)
          ? []
          : [{ code: 'QUERY.RANGE_INVERTED', args: {} }];
    }
    case 'list': {
      const list = Array.isArray(value) ? (value as readonly SFilterScalar[]) : [];
      if (list.length === 0 || list.length > limits.maxInValues) {
        return [
          {
            code: 'QUERY.LIST_SIZE_OUT_OF_RANGE',
            args: { op: condition.op, min: 1, max: limits.maxInValues },
          },
        ];
      }
      return list.flatMap((item) => valueIssues(item, field, limits));
    }
  }
}

/** A condition worth sending: right shape, valid values. Incomplete editors are simply not applied. */
export function isConditionComplete(
  condition: SFilterCondition,
  field: SQueryField,
  limits: SQueryLimits,
): boolean {
  return conditionIssues(condition, field, limits).length === 0;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const INSTANT_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Instants compare by time (offsets may differ); dates (`YYYY-MM-DD`) and numbers compare directly. */
function isBefore(from: SFilterScalar, to: SFilterScalar, field: SQueryField): boolean {
  return field.type === 'datetime' ? Date.parse(String(from)) < Date.parse(String(to)) : from < to;
}

function valueIssues(
  value: SFilterScalar,
  field: SQueryField,
  limits: SQueryLimits,
): readonly SQueryIssue[] {
  if (
    field.type === 'text' &&
    typeof value === 'string' &&
    value.length > limits.maxTextValueLength
  ) {
    return [{ code: 'QUERY.TEXT_TOO_LONG', args: { max: limits.maxTextValueLength } }];
  }
  return isValidValue(value, field)
    ? []
    : [
        {
          code: 'QUERY.INVALID_VALUE',
          args: { value: String(value), field: field.name, type: field.type },
        },
      ];
}

function isValidValue(value: SFilterScalar, field: SQueryField): boolean {
  switch (field.type) {
    case 'text':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'date':
      return typeof value === 'string' && DATE.test(value) && !Number.isNaN(Date.parse(value));
    case 'datetime':
      return (
        typeof value === 'string' &&
        INSTANT_WITH_OFFSET.test(value) &&
        !Number.isNaN(Date.parse(value))
      );
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
      return (
        typeof value === 'string' &&
        (field.options ?? []).some((o) => o.toLowerCase() === value.toLowerCase())
      );
    case 'guid':
      return typeof value === 'string' && GUID.test(value);
  }
}
