/** Wire response of `GET /api/<resource>/query/schema` (handbook 08 §5). */
export interface QuerySchemaDto {
  readonly fields: readonly QuerySchemaFieldDto[];
  readonly defaultSort: readonly { readonly field: string; readonly dir: string }[];
  readonly limits: QuerySchemaLimitsDto;
}

export interface QuerySchemaFieldDto {
  readonly name: string;
  readonly type: string;
  readonly filterable: boolean;
  readonly sortable: boolean;
  readonly searchable: boolean;
  readonly nullable: boolean;
  readonly operators: readonly string[];
  readonly options: readonly string[] | null;
}

export interface QuerySchemaLimitsDto {
  readonly maxPageSize: number;
  readonly maxResultWindow: number;
  readonly maxSort: number;
  readonly maxConditions: number;
  readonly maxDepth: number;
  readonly maxInValues: number;
  readonly maxSearchLength: number;
  readonly maxTextValueLength: number;
}
