import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIcon } from '../icon/s-icon';

/** Pages shown around the current one. */
const WINDOW = 5;

/**
 * Page navigation with a "1–20 of 145" range. Used by `SDataTable`, and on
 * its own under any list.
 *
 *   <s-pagination [(page)]="page" [pageSize]="20" [total]="total()" />
 */
@Component({
  selector: 's-pagination',
  imports: [SIcon],
  templateUrl: './s-pagination.html',
  styleUrl: './s-pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPagination {
  private readonly labels = inject(SUiLabels);

  readonly page = model(1);
  readonly pageSize = input(20, { transform: numberAttribute });
  readonly total = input(0, { transform: numberAttribute });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );

  protected readonly view = computed(() => {
    this.labels.version();
    const page = this.page();
    const last = this.pageCount();
    const from = this.total() ? (page - 1) * this.pageSize() + 1 : 0;
    const to = Math.min(page * this.pageSize(), this.total());
    const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), last - WINDOW + 1));
    const end = Math.min(last, start + WINDOW - 1);
    return {
      range: this.labels.get('S.PAGINATION.RANGE', { from, to, total: this.total() }),
      nav: this.labels.get('S.PAGINATION.NAV'),
      first: this.labels.get('S.PAGINATION.FIRST'),
      previous: this.labels.get('S.PAGINATION.PREVIOUS'),
      next: this.labels.get('S.PAGINATION.NEXT'),
      last: this.labels.get('S.PAGINATION.LAST'),
      atStart: page <= 1,
      atEnd: page >= last,
      lastPage: last,
      pages: Array.from({ length: end - start + 1 }, (_, i) => {
        const number = start + i;
        return {
          number,
          current: number === page,
          label: this.labels.get('S.PAGINATION.PAGE', { page: number }),
        };
      }),
    };
  });

  protected go(target: number): void {
    const next = Math.max(1, Math.min(target, this.pageCount()));
    if (next !== this.page()) this.page.set(next);
  }
}
