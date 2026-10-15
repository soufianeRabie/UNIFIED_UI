/** Wire response of `POST /api/<resource>/query` (handbook 08 §4). */
export interface PagedResultDto<T> {
  readonly data: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalRecords: number;
  readonly totalPages: number;
}
