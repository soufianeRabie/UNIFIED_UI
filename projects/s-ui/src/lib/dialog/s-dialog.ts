import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type TemplateRef,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIconButton } from '../icon-button/s-icon-button';
import {
  DIALOG_BACKDROP_CLASS,
  DIALOG_MAX_WIDTH,
  DIALOG_PANEL_CLASS,
  DIALOG_WIDTHS,
  type DialogWidth,
} from './s-dialog.types';

let nextId = 0;

/**
 * Declarative modal dialog, driven by a boolean. Focus is trapped inside,
 * Escape and the backdrop close it, and focus returns to the trigger.
 *
 *   <s-dialog [(open)]="editing" [title]="'SECU.USERS.MODAL.EDIT_TITLE' | translate">
 *     …form…
 *     <ng-container s-dialog-footer>
 *       <button type="button" s-button (click)="editing.set(false)">…</button>
 *       <button type="submit" s-button variant="primary">…</button>
 *     </ng-container>
 *   </s-dialog>
 */
@Component({
  selector: 's-dialog',
  imports: [SIconButton],
  templateUrl: './s-dialog.html',
  styleUrl: './s-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SDialog {
  private readonly dialog = inject(Dialog);
  private readonly labels = inject(SUiLabels);

  readonly open = model(false);
  readonly title = input.required<string>();
  readonly width = input<DialogWidth>('md');

  protected readonly titleId = `s-dialog-title-${++nextId}`;
  protected readonly closeLabel = computed(() => {
    this.labels.version();
    return this.labels.get('S.DIALOG.CLOSE');
  });

  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private ref: DialogRef | null = null;

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      if (shouldOpen && !this.ref) this.show();
      if (!shouldOpen && this.ref) this.ref.close();
    });
    inject(DestroyRef).onDestroy(() => this.ref?.close());
  }

  protected close(): void {
    this.open.set(false);
  }

  private show(): void {
    const ref = this.dialog.open(this.panel(), {
      width: DIALOG_WIDTHS[this.width()],
      maxWidth: DIALOG_MAX_WIDTH,
      panelClass: DIALOG_PANEL_CLASS,
      backdropClass: DIALOG_BACKDROP_CLASS,
      ariaLabelledBy: this.titleId,
      // First field of the form rather than the close button.
      autoFocus: '.body input:not([type=hidden]), .body select, .body textarea',
      restoreFocus: true,
    });
    this.ref = ref;
    ref.closed.subscribe(() => {
      this.ref = null;
      this.open.set(false);
    });
  }
}
