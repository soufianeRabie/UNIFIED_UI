import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

/**
 * Icon by meaning, not by font class: `<s-icon name="search" />`.
 * Decorative by default (hidden from assistive tech); give it a `label` when
 * the icon alone carries information. The glyph set (PrimeIcons today) can be
 * swapped here without touching a single screen.
 */
@Component({
  selector: 's-icon',
  templateUrl: './s-icon.html',
  styleUrl: './s-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
  },
})
export class SIcon {
  readonly name = input.required<string>();
  readonly label = input<string>();
  /** Spin, for loading indicators. */
  readonly spin = input(false, { transform: booleanAttribute });

  protected readonly glyphClass = computed(
    () => `pi pi-${this.name()}${this.spin() ? ' pi-spin' : ''}`,
  );
}
