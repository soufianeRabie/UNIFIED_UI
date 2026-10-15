import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { SCellContext } from './s-data-table.types';

/**
 * Per-row actions, rendered in a trailing column. Bind the table's rows to
 * `[rows]` so the row is typed in the template:
 *
 *   <ng-template s-row-actions [rows]="store.users()" let-user>
 *     <button type="button" s-icon-button icon="pencil" [aria-label]="…" (click)="edit(user)"></button>
 *   </ng-template>
 */
@Directive({ selector: 'ng-template[s-row-actions]' })
export class SRowActions<T = unknown> {
  /** Type witness only: the array given to the table, so `let-row` is typed. */
  readonly rows = input<readonly T[]>();
  readonly template = inject<TemplateRef<SCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: SRowActions<T>, _ctx: unknown): _ctx is SCellContext<T> {
    return true;
  }
}
