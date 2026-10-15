/**
 * UI model of the query contract (handbook 08). API-agnostic: the app's data-access maps it to the wire DTO.
 * Everything is immutable — update functions in `s-query.utils.ts` return new objects.
 */

/** Public type of a queryable field; decides the editor and the operators. */
export type SFilterType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'enum' | 'guid';

export type SFilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

/** How many values an operator takes. */
export type SOperatorArity = 'none' | 'one' | 'pair' | 'list';

/**
 * A single value. Dates travel as text: `date` → `YYYY-MM-DD`, `datetime` → ISO 8601 instant with offset
 * (the UI converts what the user picked in their zone; the server never guesses one).
 */
export type SFilterScalar = string | number | boolean;

export type SFilterValue = SFilterScalar | readonly SFilterScalar[];

export interface SFilterCondition {
  readonly kind: 'condition';
  readonly field: string;
  readonly op: SFilterOperator;
  /** Absent for `isNull` / `isNotNull`; `[from, to)` for `between`; a list for `in` / `notIn`. */
  readonly value?: SFilterValue;
}

export interface SFilterGroup {
  readonly kind: 'group';
  readonly logic: 'and' | 'or';
  readonly conditions: readonly SFilterNode[];
}

export type SFilterNode = SFilterGroup | SFilterCondition;

export interface SSortKey {
  readonly field: string;
  readonly dir: 'asc' | 'desc';
}

/**
 * The whole state of a list: page, size, free-text search, sort keys and the filter tree. The root filter is always
 * an `and` group; column filters are its direct conditions (one per field).
 */
export interface SQuery {
  readonly page: number;
  readonly size: number;
  readonly search: string;
  readonly sort: readonly SSortKey[];
  readonly filter: SFilterGroup;
}

/** A queryable field as described by the server schema. */
export interface SQueryField {
  readonly name: string;
  readonly type: SFilterType;
  readonly filterable: boolean;
  readonly sortable: boolean;
  readonly searchable: boolean;
  readonly nullable: boolean;
  readonly operators: readonly SFilterOperator[];
  readonly options?: readonly string[];
}

/** The server's limits; the UI disables controls instead of waiting for a 400. */
export interface SQueryLimits {
  readonly maxPageSize: number;
  readonly maxResultWindow: number;
  readonly maxSort: number;
  readonly maxConditions: number;
  readonly maxDepth: number;
  readonly maxInValues: number;
  readonly maxSearchLength: number;
  readonly maxTextValueLength: number;
}

/** A client-side check that failed, with the same code and arguments the server would send. */
export interface SQueryIssue {
  readonly code: string;
  readonly args: Readonly<Record<string, string | number>>;
}
