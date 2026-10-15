import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SButton } from '../button/s-button';
import { SUiLabels } from '../core/s-ui-labels';
import type { SConfirmOptions } from './s-confirm.types';

let nextId = 0;

/** Body of `SConfirm.ask()`. Not exported: screens use the service. */
@Component({
  selector: 's-confirm-dialog',
  imports: [SButton],
  templateUrl: './s-confirm-dialog.html',
  styleUrl: './s-confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SConfirmDialog {
  protected readonly options = inject<SConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly labels = inject(SUiLabels);

  protected readonly titleId = `s-confirm-title-${++nextId}`;
  protected readonly bodyId = `s-confirm-body-${nextId}`;
  protected readonly danger = this.options.tone === 'danger';

  protected readonly text = computed(() => {
    this.labels.version();
    return {
      cancel: this.options.cancelLabel || this.labels.get('S.DIALOG.CANCEL'),
      confirm:
        this.options.confirmLabel ||
        this.labels.get(this.danger ? 'S.DIALOG.DELETE' : 'S.DIALOG.CONFIRM'),
    };
  });
}
