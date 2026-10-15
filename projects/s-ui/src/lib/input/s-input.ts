import { Directive, booleanAttribute, computed, inject, input } from '@angular/core';
import type { ControlSize } from '../core/scale.types';
import { S_FIELD } from '../field/s-field.context';

/**
 * Styles a native control and wires it to its `SField`:
 *
 *   <input s-input formControlName="username" mono />
 *   <select s-input>…</select>
 *   <textarea s-input></textarea>
 *
 * Visuals live in `styles/controls.css` (inputs are void elements and cannot
 * host a component template).
 */
@Directive({
  selector: 'input[s-input], select[s-input], textarea[s-input]',
  host: {
    class: 's-control',
    '[attr.id]': 'controlId()',
    '[attr.data-size]': 'controlSize()',
    '[attr.data-mono]': 'mono() ? "" : null',
    '[attr.aria-invalid]': 'isInvalid() || null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
  },
})
export class SInput {
  protected readonly field = inject(S_FIELD, { optional: true });

  /** Explicit id; inside an `s-field` the field's id is used by default. */
  readonly id = input<string>();
  /** Not `size`: that is a native <input> attribute. */
  readonly controlSize = input<ControlSize>('md');
  readonly mono = input(false, { transform: booleanAttribute });
  /** Force the invalid state outside an `s-field`. */
  readonly invalid = input(false, { transform: booleanAttribute });

  protected readonly controlId = computed(() => this.id() ?? this.field?.controlId ?? null);
  protected readonly isInvalid = computed(() => this.invalid() || !!this.field?.invalid());
}
