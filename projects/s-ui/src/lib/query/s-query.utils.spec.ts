import type { SFilterCondition, SFilterGroup, SQueryLimits } from './s-query.types';
import {
  clearFilters,
  columnFilterOf,
  conditionCount,
  createQuery,
  lastReachablePage,
  setColumnFilter,
  setPage,
  setSearch,
  setSize,
  sortStateOf,
  toggleSort,
} from './s-query.utils';

const active: SFilterCondition = { kind: 'condition', field: 'isActive', op: 'eq', value: true };
const named: SFilterCondition = {
  kind: 'condition',
  field: 'username',
  op: 'contains',
  value: 'ada',
};

describe('query utils', () => {
  it('creates a first page with defaults and overrides', () => {
    expect(createQuery()).toEqual({
      page: 1,
      size: 20,
      search: '',
      sort: [],
      filter: { kind: 'group', logic: 'and', conditions: [] },
    });
    expect(createQuery({ size: 50 }).size).toBe(50);
  });

  it('returns to page 1 on every change except paging, and keeps identity when nothing changes', () => {
    const onPage3 = setPage(createQuery(), 3);
    expect(onPage3.page).toBe(3);
    expect(setPage(onPage3, 3)).toBe(onPage3);
    expect(setPage(onPage3, 0).page).toBe(1);
    expect(setSize(onPage3, 50).page).toBe(1);
    expect(setSearch(onPage3, 'ada').page).toBe(1);
    expect(setSearch(onPage3, '')).toBe(onPage3);
    expect(toggleSort(onPage3, 'username').page).toBe(1);
    expect(setColumnFilter(onPage3, 'isActive', active).page).toBe(1);
  });

  it('cycles a single sort asc → desc → off', () => {
    const asc = toggleSort(createQuery(), 'username');
    const desc = toggleSort(asc, 'username');
    const off = toggleSort(desc, 'username');
    expect(asc.sort).toEqual([{ field: 'username', dir: 'asc' }]);
    expect(desc.sort).toEqual([{ field: 'username', dir: 'desc' }]);
    expect(off.sort).toEqual([]);
    expect(toggleSort(asc, 'email').sort).toEqual([{ field: 'email', dir: 'asc' }]);
  });

  it('adds keys in multi mode up to the limit and reports their order', () => {
    let query = toggleSort(createQuery(), 'username');
    query = toggleSort(query, 'createdAt', { multi: true, maxSort: 2 });
    expect(sortStateOf(query, 'createdAt')).toEqual({ dir: 'asc', order: 2 });

    const full = toggleSort(query, 'email', { multi: true, maxSort: 2 });
    expect(full).toBe(query);

    const flipped = toggleSort(query, 'username', { multi: true });
    expect(flipped.sort).toEqual([
      { field: 'username', dir: 'desc' },
      { field: 'createdAt', dir: 'asc' },
    ]);
    expect(toggleSort(flipped, 'username', { multi: true }).sort).toEqual([
      { field: 'createdAt', dir: 'asc' },
    ]);
    expect(sortStateOf(flipped, 'email')).toBeNull();
  });

  it('keeps one column filter per field and leaves other nodes untouched', () => {
    const nested: SFilterGroup = { kind: 'group', logic: 'or', conditions: [named] };
    let query = createQuery({ filter: { kind: 'group', logic: 'and', conditions: [nested] } });
    query = setColumnFilter(query, 'isActive', active);
    query = setColumnFilter(query, 'isActive', { ...active, value: false });

    expect(columnFilterOf(query, 'isActive')?.value).toBe(false);
    expect(query.filter.conditions).toHaveLength(2);
    expect(columnFilterOf(query, 'username')).toBeUndefined();
    expect(conditionCount(query)).toBe(2);

    const removed = setColumnFilter(query, 'isActive', null);
    expect(removed.filter.conditions).toEqual([nested]);
    expect(setColumnFilter(removed, 'isActive', null)).toBe(removed);
  });

  it('refuses a condition for another column', () => {
    expect(() => setColumnFilter(createQuery(), 'email', named)).toThrow();
  });

  it('clears every filter', () => {
    const query = setColumnFilter(createQuery(), 'isActive', active);
    expect(conditionCount(clearFilters(query))).toBe(0);
    const empty = createQuery();
    expect(clearFilters(empty)).toBe(empty);
  });

  it('computes the last page inside the result window', () => {
    const limits = { maxResultWindow: 10_000 } as SQueryLimits;
    expect(lastReachablePage(limits, 20)).toBe(500);
    expect(lastReachablePage(limits, 30)).toBe(333);
  });
});
