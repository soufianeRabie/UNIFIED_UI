export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageableObject {
  offset: number;
  sort: SortObject;
  pageSize: number;
  pageNumber: number;
  unpaged: boolean;
  paged: boolean;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  sort: SortObject;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: PageableObject;
  empty: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string[];
}
