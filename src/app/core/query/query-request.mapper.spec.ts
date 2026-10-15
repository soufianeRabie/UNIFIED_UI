import { createQuery, setColumnFilter, setSearch, toggleSort } from '@s/ui';
import type { SFilterGroup } from '@s/ui';
import { toQueryRequestDto } from './query-request.mapper';

describe('toQueryRequestDto', () => {
  it('sends only paging for an empty query', () => {
    expect(toQueryRequestDto(createQuery())).toEqual({ page: 1, size: 20 });
  });

  it('trims search and maps sort and column filters to the wire shape', () => {
    let query = setSearch(createQuery(), '  ada  ');
    query = toggleSort(query, 'createdAt');
    query = setColumnFilter(query, 'isActive', {
      kind: 'condition',
      field: 'isActive',
      op: 'eq',
      value: true,
    });
    query = setColumnFilter(query, 'email', { kind: 'condition', field: 'email', op: 'isNull' });

    expect(toQueryRequestDto(query)).toEqual({
      page: 1,
      size: 20,
      search: 'ada',
      sort: [{ field: 'createdAt', dir: 'asc' }],
      filter: {
        logic: 'and',
        conditions: [
          { field: 'isActive', op: 'eq', value: true },
          { field: 'email', op: 'isNull' },
        ],
      },
    });
  });

  it('drops empty nested groups instead of sending them', () => {
    const empty: SFilterGroup = { kind: 'group', logic: 'or', conditions: [] };
    const query = createQuery({ filter: { kind: 'group', logic: 'and', conditions: [empty] } });
    expect(toQueryRequestDto(query).filter).toBeUndefined();
  });
});
