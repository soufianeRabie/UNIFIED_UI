import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import { SColumnFilter } from '../column-filter/s-column-filter';
import { SUiLabels } from '../core/s-ui-labels';
import { SEmpty } from '../empty/s-empty';
import { SIcon } from '../icon/s-icon';
import { SNotice } from '../notice/s-notice';
import { SPagination } from '../pagination/s-pagination';
import { SPopover } from '../popover/s-popover';
import type { SFilterCondition, SQuery, SQueryField, SQueryLimits } from '@s/core';
import { setColumnFilter, setPage, toggleSort } from '@s/core';
import { SCell } from './s-cell.directive';
import { SRowActions } from './s-row-actions.directive';
import type { SColumn, SSort } from '@s/core';
import { headerViews, reachableTotal } from '@s/core';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

/**
 * The one table. Server-driven: the screen owns the request; the table owns rendering, sort state, paging,
 * column filters, loading, empty and error states.
 *
 * Query mode (handbook 08) — sort (Shift+click adds keys), a filter button per filterable column and paging
 * all update one `SQuery`:
 *
 *   <s-data-table [rows]="store.users()" [columns]="columns" rowKey="id" [total]="store.total()"
 *                 [(query)]="query" [fields]="schema.fields" [limits]="schema.limits" />
 *
 * Simple mode: `[(page)]` and `[(sort)]` (one key) without a query.
 */
@Component({
  selector: 's-data-table',
  imports: [NgTemplateOutlet, SColumnFilter, SEmpty, SIcon, SNotice, SPagination, SPopover],
  templateUrl: './s-data-table.html',
  styleUrl: './s-data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SDataTable<T extends object> {
  private readonly labels = inject(SUiLabels);

  readonly rows = input<readonly T[]>([]);
  readonly columns = input.required<readonly SColumn[]>();
  /** Row property used as identity, so rows are not re-rendered needlessly. */
  readonly rowKey = input<keyof T & string>();
  readonly caption = input<string>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyTitle = input<string>();
  readonly emptyIcon = input('inbox');

  /** Paging is shown as soon as a total is bound. */
  readonly total = input<number | null>(null);
  readonly pageSize = input(20, { transform: numberAttribute });
  readonly page = model(1);
  /** Simple mode: cycles asc → desc → none on a sortable header. */
  readonly sort = model<SSort | null>(null);

  /** Query mode: the whole list state. Columns match fields by `key` = field name. */
  readonly query = model<SQuery | null>(null);
  readonly fields = input<readonly SQueryField[]>([]);
  readonly limits = input<SQueryLimits | null>(null);

  private readonly cellTemplates = contentChildren(SCell<T>);
  protected readonly rowActions = contentChild(SRowActions<T>);
  protected readonly openFilter = signal<string | null>(null);

  protected readonly text = computed(() => {
    this.labels.version();
    return {
      empty: this.emptyTitle() || this.labels.get('S.TABLE.EMPTY'),
      actions: this.labels.get('S.TABLE.ACTIONS'),
    };
  });

  protected readonly headers = computed(() => {
    this.labels.version();
    return headerViews(this.columns(), {
      sort: this.sort(),
      query: this.query(),
      fields: this.fields(),
    }).map((header) => ({
      ...header,
      filterLabel: this.labels.get('S.FILTER.OPEN', { column: header.column.header }),
    }));
  });

  protected readonly body = computed(() => {
    const templates = new Map(this.cellTemplates().map((c) => [c.column(), c.template]));
    const key = this.rowKey();
    return this.rows().map((row, index) => ({
      row,
      index,
      id: key ? row[key] : index,
      cells: this.columns().map((column) => ({
        column,
        template: templates.get(column.key) ?? null,
        text: display((row as Record<string, unknown>)[column.key]),
      })),
    }));
  });

  protected readonly paging = computed(() => {
    const query = this.query();
    return {
      page: query?.page ?? this.page(),
      size: query?.size ?? this.pageSize(),
      total: reachableTotal(this.total() ?? 0, this.limits()?.maxResultWindow ?? null),
    };
  });

  protected readonly columnCount = computed(
    () => this.columns().length + (this.rowActions() ? 1 : 0),
  );
  protected readonly showSkeleton = computed(() => this.loading() && this.rows().length === 0);
  protected readonly skeleton = SKELETON_ROWS;

  protected onSort(column: SColumn, event: MouseEvent): void {
    const query = this.query();
    if (query) {
      const options = { multi: event.shiftKey, maxSort: this.limits()?.maxSort };
      this.query.set(toggleSort(query, column.key, options));
      return;
    }
    const current = this.sort();
    if (current?.key !== column.key) this.sort.set({ key: column.key, dir: 'asc' });
    else if (current.dir === 'asc') this.sort.set({ key: column.key, dir: 'desc' });
    else this.sort.set(null);
  }

  protected toggleFilter(key: string): void {
    this.openFilter.update((open) => (open === key ? null : key));
  }

  protected applyFilter(key: string, condition: SFilterCondition | null): void {
    this.query.update((query) => (query ? setColumnFilter(query, key, condition) : query));
    this.openFilter.set(null);
  }

  protected onPage(page: number): void {
    const query = this.query();
    if (query) this.query.set(setPage(query, page));
    else this.page.set(page);
  }
}

function display(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}
