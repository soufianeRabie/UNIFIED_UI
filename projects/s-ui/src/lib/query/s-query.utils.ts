import type {
  SFilterCondition,
  SFilterGroup,
  SQuery,
  SQueryLimits,
  SSortKey,
} from './s-query.types';

/** Every change except paging returns to page 1: the old page number means nothing for a new result set. */

const EMPTY_FILTER: SFilterGroup = { kind: 'group', logic: 'and', conditions: [] };

export function createQuery(initial: Partial<SQuery> = {}): SQuery {
  return { page: 1, size: 20, search: '', sort: [], filter: EMPTY_FILTER, ...initial };
}

export function setPage(query: SQuery, page: number): SQuery {
  const next = Math.max(1, Math.trunc(page));
  return next === query.page ? query : { ...query, page: next };
}

export function setSize(query: SQuery, size: number): SQuery {
  return size === query.size ? query : { ...query, size, page: 1 };
}

export function setSearch(query: SQuery, search: string): SQuery {
  return search === query.search ? query : { ...query, search, page: 1 };
}

/**
 * Header click: asc → desc → off. Single mode replaces every key; multi mode (shift-click) keeps the others and
 * appends a new key unless `maxSort` keys are already set.
 */
export function toggleSort(
  query: SQuery,
  field: string,
  options: { multi?: boolean; maxSort?: number } = {},
): SQuery {
  const current = query.sort.find((s) => s.field === field);
  const nextKey: SSortKey | null = !current
    ? { field, dir: 'asc' }
    : current.dir === 'asc'
      ? { field, dir: 'desc' }
      : null;

  let sort: readonly SSortKey[];
  if (!options.multi) {
    sort = nextKey ? [nextKey] : [];
  } else if (current) {
    sort = nextKey
      ? query.sort.map((s) => (s.field === field ? nextKey : s))
      : query.sort.filter((s) => s.field !== field);
  } else if (query.sort.length < (options.maxSort ?? Number.POSITIVE_INFINITY)) {
    sort = [...query.sort, { field, dir: 'asc' }];
  } else {
    return query;
  }

  return { ...query, sort, page: 1 };
}

/** Position (1-based) and direction of a field in the sort, for header indicators. */
export function sortStateOf(
  query: SQuery,
  field: string,
): { readonly dir: 'asc' | 'desc'; readonly order: number } | null {
  const index = query.sort.findIndex((s) => s.field === field);
  return index < 0 ? null : { dir: query.sort[index].dir, order: index + 1 };
}

/** The column filter of a field: the root's direct condition on it. */
export function columnFilterOf(query: SQuery, field: string): SFilterCondition | undefined {
  return query.filter.conditions.find(
    (c): c is SFilterCondition => c.kind === 'condition' && c.field === field,
  );
}

/** Sets (or, with `null`, removes) the column filter of a field. Other fields and nested groups are untouched. */
export function setColumnFilter(
  query: SQuery,
  field: string,
  condition: SFilterCondition | null,
): SQuery {
  if (condition && condition.field !== field) {
    throw new Error(`Condition field "${condition.field}" does not match column "${field}".`);
  }

  const others = query.filter.conditions.filter((c) => c.kind !== 'condition' || c.field !== field);
  const conditions = condition ? [...others, condition] : others;
  if (!condition && others.length === query.filter.conditions.length) {
    return query;
  }

  return { ...query, filter: { ...query.filter, conditions }, page: 1 };
}

export function clearFilters(query: SQuery): SQuery {
  return query.filter.conditions.length === 0 ? query : { ...query, filter: EMPTY_FILTER, page: 1 };
}

/** Conditions counted the way the server counts them (every leaf of the tree). */
export function conditionCount(query: SQuery): number {
  const count = (group: SFilterGroup): number =>
    group.conditions.reduce((sum, node) => sum + (node.kind === 'group' ? count(node) : 1), 0);
  return count(query.filter);
}

/** The last page the server will serve: deeper paging is refused (result window). */
export function lastReachablePage(limits: SQueryLimits, size: number): number {
  return Math.max(1, Math.floor(limits.maxResultWindow / Math.max(1, size)));
}
