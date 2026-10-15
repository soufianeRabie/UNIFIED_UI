import type { SFilterGroup, SFilterNode, SQuery } from '@s/ui';
import type { FilterNodeDto, QueryRequestDto } from './query-request.dto';

/**
 * UI query → wire body. Sends only what means something: a trimmed search, sort keys, and a filter tree without
 * empty groups (the server rejects empty groups; an empty filter is simply omitted).
 */
export function toQueryRequestDto(query: SQuery): QueryRequestDto {
  const search = query.search.trim();
  const filter = toFilterDto(query.filter);
  return {
    page: query.page,
    size: query.size,
    ...(search ? { search } : {}),
    ...(query.sort.length > 0
      ? { sort: query.sort.map((s) => ({ field: s.field, dir: s.dir })) }
      : {}),
    ...(filter ? { filter } : {}),
  };
}

function toFilterDto(node: SFilterNode): FilterNodeDto | null {
  if (node.kind === 'condition') {
    return node.value === undefined
      ? { field: node.field, op: node.op }
      : { field: node.field, op: node.op, value: node.value };
  }
  return toGroupDto(node);
}

function toGroupDto(group: SFilterGroup): FilterNodeDto | null {
  const conditions = group.conditions
    .map(toFilterDto)
    .filter((c): c is FilterNodeDto => c !== null);
  return conditions.length === 0 ? null : { logic: group.logic, conditions };
}
