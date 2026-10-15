import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { ButtonVariant, ControlSize } from '../core/scale.types';
import { SIcon } from '../icon/s-icon';

/**
 * Text button on the native element, so forms, routerLink, focus and
 * disabled states keep working:
 *
 *   <button type="button" s-button variant="primary" icon="plus">New user</button>
 *   <a s-button routerLink="/users">Back</a>
 */
@Component({
  selector: 'button[s-button], a[s-button]',
  imports: [SIcon],
  templateUrl: './s-button.html',
  styleUrl: './s-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-busy]': 'loading() || null',
  },
})
export class SButton {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ControlSize>('md');
  /** Leading icon name (see SIcon). */
  readonly icon = input<string>();
  /** Shows a spinner in place of the icon and sets `aria-busy`. */
  readonly loading = input(false, { transform: booleanAttribute });
}
