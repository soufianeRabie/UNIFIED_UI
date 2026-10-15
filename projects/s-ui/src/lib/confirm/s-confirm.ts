import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  DIALOG_BACKDROP_CLASS,
  DIALOG_MAX_WIDTH,
  DIALOG_PANEL_CLASS,
  DIALOG_WIDTHS,
} from '../dialog/s-dialog.types';
import { SConfirmDialog } from './s-confirm-dialog';
import type { SConfirmOptions } from './s-confirm.types';

/**
 * One confirmation pattern everywhere:
 *
 *   if (await this.confirm.ask({ title, message, tone: 'danger' })) {
 *     this.store.remove(user.id);
 *   }
 *
 * Resolves `false` on cancel, Escape or backdrop. Focus starts on Cancel so
 * a stray Enter never confirms a destructive action.
 */
@Injectable({ providedIn: 'root' })
export class SConfirm {
  private readonly dialog = inject(Dialog);

  async ask(options: SConfirmOptions): Promise<boolean> {
    const ref = this.dialog.open<boolean, SConfirmOptions>(SConfirmDialog, {
      data: options,
      width: DIALOG_WIDTHS.sm,
      maxWidth: DIALOG_MAX_WIDTH,
      panelClass: DIALOG_PANEL_CLASS,
      backdropClass: DIALOG_BACKDROP_CLASS,
      role: 'alertdialog',
      autoFocus: '.cancel',
      restoreFocus: true,
    });
    return (await firstValueFrom(ref.closed)) === true;
  }
}
