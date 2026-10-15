import type { SFilterCondition, SQuery, SQueryField } from '../query/s-query.types';
import { columnFilterOf, sortStateOf } from '../query/s-query.utils';
import type { SColumn, SSort } from './s-data-table.types';

/** Everything a header cell renders, precomputed (no logic in the template). */
export interface HeaderView {
  readonly column: SColumn;
  readonly sortable: boolean;
  readonly ariaSort: 'ascending' | 'descending' | null;
  readonly sortIcon: string;
  /** Position among several sort keys; `null` with zero or one key. */
  readonly order: number | null;
  /** The queryable field behind the column, when it can be filtered. */
  readonly filterField: SQueryField | null;
  readonly condition: SFilterCondition | undefined;
}

export interface HeaderState {
  readonly sort: SSort | null;
  /** Query mode: sort and filters come from the query and the server's fields. */
  readonly query: SQuery | null;
  readonly fields: readonly SQueryField[];
}

export function headerViews(
  columns: readonly SColumn[],
  state: HeaderState,
): readonly HeaderView[] {
  const fields = new Map(state.fields.map((f) => [f.name, f]));
  return columns.map((column) => {
    const field = fields.get(column.key) ?? null;
    const sortable = !!column.sortable && (!state.query || !field || field.sortable);
    const sort = state.query
      ? sortStateOf(state.query, column.key)
      : state.sort?.key === column.key
        ? { dir: state.sort.dir, order: 1 }
        : null;
    const keys = state.query?.sort.length ?? 0;
    return {
      column,
      sortable,
      ariaSort: sortable && sort ? (sort.dir === 'asc' ? 'ascending' : 'descending') : null,
      sortIcon: !sort ? 'sort-alt' : sort.dir === 'asc' ? 'sort-amount-up-alt' : 'sort-amount-down',
      order: sort && keys > 1 ? sort.order : null,
      filterField: state.query && field?.filterable ? field : null,
      condition: state.query ? columnFilterOf(state.query, column.key) : undefined,
    };
  });
}

/** The total the pager may reach: the server refuses pages past the result window. */
export function reachableTotal(total: number, maxResultWindow: number | null): number {
  return maxResultWindow === null ? total : Math.min(total, maxResultWindow);
}
