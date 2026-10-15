import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { S_FIELD, type SFieldContext } from './s-field.context';

let nextId = 0;

/**
 * Label + control + hint or error. The projected `s-input` (or any control
 * using `S_FIELD`) receives the id, `aria-describedby` and `aria-invalid`.
 *
 *   <s-field [label]="'SECU.USERS.MODAL.EMAIL' | translate" [error]="emailError()" required>
 *     <input s-input type="email" formControlName="email" />
 *   </s-field>
 */
@Component({
  selector: 's-field',
  templateUrl: './s-field.html',
  styleUrl: './s-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: S_FIELD, useExisting: SField }],
})
export class SField implements SFieldContext {
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();
  readonly required = input(false, { transform: booleanAttribute });

  readonly controlId = `s-field-${++nextId}`;
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;

  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(() => {
    if (this.error()) return this.errorId;
    return this.hint() ? this.hintId : null;
  });
}
