import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SDataTable,
  SFilterBar,
  SFilterChips,
  SHeading,
  SPanel,
  SPanelHeader,
  SSearch,
  SText,
} from '@s/ui';
import { createQuery, setSearch, type SQuery } from '@s/core';
import { toQueryRequestDto } from '../../../core/query';
import { QUERY_COLUMNS, QUERY_FIELDS, QUERY_LIMITS, QUERY_ROWS } from './gallery-query.data';

/**
 * Gallery section: a table in query mode (handbook 08) — multi-sort, type-aware column filters, chips, paging —
 * with the exact body `POST …/query` would receive. Rows are static: this page has no API.
 */
@Component({
  selector: 'app-gallery-query',
  imports: [
    JsonPipe,
    SDataTable,
    SFilterBar,
    SFilterChips,
    SHeading,
    SPanel,
    SPanelHeader,
    SSearch,
    SText,
  ],
  templateUrl: './gallery-query.html',
  styleUrl: './gallery-query.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryQuery {
  protected readonly columns = QUERY_COLUMNS;
  protected readonly fields = QUERY_FIELDS;
  protected readonly limits = QUERY_LIMITS;
  protected readonly rows = QUERY_ROWS;

  protected readonly query = signal<SQuery>(createQuery());
  protected readonly request = computed(() => toQueryRequestDto(this.query()));

  protected search(term: string): void {
    this.query.update((query) => setSearch(query, term));
  }
}
