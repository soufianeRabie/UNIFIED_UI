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
} from '@angular/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SEmpty } from '../empty/s-empty';
import { SIcon } from '../icon/s-icon';
import { SNotice } from '../notice/s-notice';
import { SPagination } from '../pagination/s-pagination';
import { SCell } from './s-cell.directive';
import { SRowActions } from './s-row-actions.directive';
import type { SColumn, SSort } from './s-data-table.types';

const SKELETON_ROWS = [0, 1, 2, 3, 4];

/**
 * The one table. Server-driven: the screen owns the request; the table owns
 * rendering, sort state, paging, loading, empty and error states.
 *
 *   <s-data-table [rows]="store.users()" [columns]="columns" rowKey="id"
 *                 [loading]="store.loading()" [error]="store.error()"
 *                 [total]="store.total()" [(page)]="page" [(sort)]="sort">
 *     <ng-template s-cell="status" [rows]="store.users()" let-user>…</ng-template>
 *     <ng-template s-row-actions [rows]="store.users()" let-user>…</ng-template>
 *   </s-data-table>
 */
@Component({
  selector: 's-data-table',
  imports: [NgTemplateOutlet, SEmpty, SIcon, SNotice, SPagination],
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
  /** Cycles asc → desc → none on a sortable header. */
  readonly sort = model<SSort | null>(null);

  private readonly cellTemplates = contentChildren(SCell<T>);
  protected readonly rowActions = contentChild(SRowActions<T>);

  protected readonly text = computed(() => {
    this.labels.version();
    return {
      empty: this.emptyTitle() || this.labels.get('S.TABLE.EMPTY'),
      actions: this.labels.get('S.TABLE.ACTIONS'),
    };
  });

  protected readonly headers = computed(() => {
    const sort = this.sort();
    return this.columns().map((column) => {
      const active = sort?.key === column.key;
      return {
        column,
        ariaSort:
          column.sortable && active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : null,
        sortIcon: !active
          ? 'sort-alt'
          : sort.dir === 'asc'
            ? 'sort-amount-up-alt'
            : 'sort-amount-down',
      };
    });
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

  protected readonly columnCount = computed(
    () => this.columns().length + (this.rowActions() ? 1 : 0),
  );
  protected readonly showSkeleton = computed(() => this.loading() && this.rows().length === 0);
  protected readonly skeleton = SKELETON_ROWS;

  protected toggleSort(column: SColumn): void {
    const current = this.sort();
    if (current?.key !== column.key) this.sort.set({ key: column.key, dir: 'asc' });
    else if (current.dir === 'asc') this.sort.set({ key: column.key, dir: 'desc' });
    else this.sort.set(null);
  }
}

function display(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}
