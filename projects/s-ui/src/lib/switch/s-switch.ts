import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * On/off control. The projected text is its label, and the track changes
 * shape as well as colour, so the state never depends on colour alone.
 * Works with `[(checked)]`, `formControlName` and `[(ngModel)]`.
 *
 *   <s-switch formControlName="active">{{ 'COMMON.ACTIVE' | translate }}</s-switch>
 */
@Component({
  selector: 's-switch',
  templateUrl: './s-switch.html',
  styleUrl: './s-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SSwitch), multi: true }],
  host: { '[attr.data-checked]': 'checked() ? "" : null' },
})
export class SSwitch implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly labelId = `s-switch-label-${++nextId}`;
  protected readonly formDisabled = signal(false);

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected toggle(): void {
    if (this.disabled() || this.formDisabled()) return;
    this.checked.update((value) => !value);
    this.onChange(this.checked());
    this.onTouched();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
