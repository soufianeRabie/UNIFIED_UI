/** Wire body of `POST /api/<resource>/query` (handbook 08 §2). Only mappers in this folder build it. */
export interface QueryRequestDto {
  readonly page: number;
  readonly size: number;
  readonly search?: string;
  readonly sort?: readonly SortRequestDto[];
  readonly filter?: FilterNodeDto;
}

export interface SortRequestDto {
  readonly field: string;
  readonly dir: 'asc' | 'desc';
}

/** A group (`logic`, `conditions`) or a condition (`field`, `op`, `value`). */
export interface FilterNodeDto {
  readonly logic?: 'and' | 'or';
  readonly conditions?: readonly FilterNodeDto[];
  readonly field?: string;
  readonly op?: string;
  readonly value?: string | number | boolean | readonly (string | number | boolean)[];
}
