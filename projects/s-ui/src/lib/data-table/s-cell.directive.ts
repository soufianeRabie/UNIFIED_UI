import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { SCellContext } from '@s/core';

/**
 * Custom cell for one column. Bind the table's rows to `[rows]` so the row
 * is typed in the template (without it, the row is `unknown`):
 *
 *   <ng-template s-cell="status" [rows]="store.users()" let-user>
 *     <s-stamp [tone]="user.active ? 'success' : 'neutral'">…</s-stamp>
 *   </ng-template>
 */
@Directive({ selector: 'ng-template[s-cell]' })
export class SCell<T = unknown> {
  /** Key of the column this template renders. */
  readonly column = input.required<string>({ alias: 's-cell' });
  /** Type witness only: the array given to the table, so `let-row` is typed. */
  readonly rows = input<readonly T[]>();
  readonly template = inject<TemplateRef<SCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: SCell<T>, _ctx: unknown): _ctx is SCellContext<T> {
    return true;
  }
}
