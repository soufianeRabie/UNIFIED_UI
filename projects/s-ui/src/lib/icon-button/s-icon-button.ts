import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ControlSize } from '../core/scale.types';
import { SIcon } from '../icon/s-icon';
import type { IconButtonVariant } from './s-icon-button.types';

/**
 * Square icon-only button. `aria-label` is required: it is the accessible name
 * and becomes the tooltip, so an icon is never the only explanation (02 §5).
 *
 *   <button type="button" s-icon-button icon="pencil" [aria-label]="'COMMON.EDIT' | translate"></button>
 */
@Component({
  selector: 'button[s-icon-button], a[s-icon-button]',
  imports: [SIcon],
  templateUrl: './s-icon-button.html',
  styleUrl: './s-icon-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.title]': 'ariaLabel()',
  },
})
export class SIconButton {
  readonly icon = input.required<string>();
  /** Accessible name and tooltip. */
  readonly ariaLabel = input.required<string>({ alias: 'aria-label' });
  readonly variant = input<IconButtonVariant>('secondary');
  readonly size = input<ControlSize>('md');
}
