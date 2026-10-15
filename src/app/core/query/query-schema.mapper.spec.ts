import type { QuerySchemaDto } from './query-schema.dto';
import { fromQuerySchemaDto } from './query-schema.mapper';

const limits = {
  maxPageSize: 100,
  maxResultWindow: 10_000,
  maxSort: 3,
  maxConditions: 25,
  maxDepth: 3,
  maxInValues: 100,
  maxSearchLength: 200,
  maxTextValueLength: 500,
};

describe('fromQuerySchemaDto', () => {
  it('maps fields, default sort and limits', () => {
    const dto: QuerySchemaDto = {
      fields: [
        {
          name: 'status',
          type: 'enum',
          filterable: true,
          sortable: true,
          searchable: false,
          nullable: false,
          operators: ['eq', 'in'],
          options: ['Active', 'Locked'],
        },
        {
          name: 'email',
          type: 'text',
          filterable: true,
          sortable: true,
          searchable: true,
          nullable: true,
          operators: ['contains', 'isNull'],
          options: null,
        },
      ],
      defaultSort: [{ field: 'createdAt', dir: 'desc' }],
      limits,
    };

    const schema = fromQuerySchemaDto(dto);
    expect(schema.fields[0]).toEqual({
      name: 'status',
      type: 'enum',
      filterable: true,
      sortable: true,
      searchable: false,
      nullable: false,
      operators: ['eq', 'in'],
      options: ['Active', 'Locked'],
    });
    expect(schema.fields[1].options).toBeUndefined();
    expect(schema.defaultSort).toEqual([{ field: 'createdAt', dir: 'desc' }]);
    expect(schema.limits.maxResultWindow).toBe(10_000);
  });

  it('ignores types and operators this UI does not know', () => {
    const schema = fromQuerySchemaDto({
      fields: [
        {
          name: 'geo',
          type: 'geometry',
          filterable: true,
          sortable: false,
          searchable: false,
          nullable: false,
          operators: ['near'],
          options: null,
        },
        {
          name: 'age',
          type: 'number',
          filterable: true,
          sortable: true,
          searchable: false,
          nullable: false,
          operators: ['eq', 'fuzzy'],
          options: null,
        },
      ],
      defaultSort: [{ field: 'age', dir: 'sideways' }],
      limits,
    });
    expect(schema.fields.map((f) => f.name)).toEqual(['age']);
    expect(schema.fields[0].operators).toEqual(['eq']);
    expect(schema.defaultSort).toEqual([]);
  });
});
