import type { SFilterOperator } from '../query/s-query.types';

/** Which editor a column filter shows for a field type and operator. */
export type FilterEditorKind =
  | 'none'
  | 'text'
  | 'number'
  | 'numberRange'
  | 'day'
  | 'dayRange'
  | 'boolean'
  | 'choice'
  | 'choices'
  | 'list';

/**
 * What the user is typing, as editor values (strings, ISO days, flags). Converted to a condition only on Apply,
 * so half-typed values never reach the query.
 */
export interface FilterDraft {
  readonly op: SFilterOperator;
  readonly text: string;
  readonly from: string;
  readonly to: string;
  readonly day: string | null;
  readonly startDay: string | null;
  readonly endDay: string | null;
  readonly flag: boolean | null;
  readonly choices: readonly string[];
}
