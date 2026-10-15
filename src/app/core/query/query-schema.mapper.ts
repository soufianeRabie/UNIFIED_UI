import { S_OPERATORS_BY_TYPE } from '@s/ui';
import type { SFilterOperator, SFilterType, SQueryField, SQueryLimits, SSortKey } from '@s/ui';
import type { QuerySchemaDto, QuerySchemaFieldDto } from './query-schema.dto';

export interface QuerySchema {
  readonly fields: readonly SQueryField[];
  readonly defaultSort: readonly SSortKey[];
  readonly limits: SQueryLimits;
}

const TYPES = new Set<string>(Object.keys(S_OPERATORS_BY_TYPE));

/**
 * Wire schema → UI model. Defensive: a field of a type this UI does not know, or an operator outside the type's
 * matrix, is dropped rather than rendered with a broken editor (a newer server must not break an older UI).
 */
export function fromQuerySchemaDto(dto: QuerySchemaDto): QuerySchema {
  return {
    fields: dto.fields.filter((f) => TYPES.has(f.type)).map(toField),
    defaultSort: dto.defaultSort
      .filter((s) => s.dir === 'asc' || s.dir === 'desc')
      .map((s) => ({ field: s.field, dir: s.dir as 'asc' | 'desc' })),
    limits: { ...dto.limits },
  };
}

function toField(dto: QuerySchemaFieldDto): SQueryField {
  const type = dto.type as SFilterType;
  const known = S_OPERATORS_BY_TYPE[type];
  return {
    name: dto.name,
    type,
    filterable: dto.filterable,
    sortable: dto.sortable,
    searchable: dto.searchable,
    nullable: dto.nullable,
    operators: dto.operators.filter((op): op is SFilterOperator =>
      known.includes(op as SFilterOperator),
    ),
    ...(dto.options ? { options: dto.options } : {}),
  };
}
