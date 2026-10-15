import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { StateTone } from '../core/scale.types';
import { SIcon } from '../icon/s-icon';

const ICONS: Partial<Record<StateTone, string>> = {
  danger: 'exclamation-circle',
  warning: 'exclamation-triangle',
  success: 'check-circle',
};

/**
 * An inline message: errors, confirmations, hints. Danger notices are
 * announced immediately (`role="alert"`), the others politely (`status`).
 *
 *   <s-notice tone="danger">{{ error() }}</s-notice>
 */
@Component({
  selector: 's-notice',
  imports: [SIcon],
  templateUrl: './s-notice.html',
  styleUrl: './s-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'tone() === "danger" ? "alert" : "status"',
  },
})
export class SNotice {
  readonly tone = input<StateTone>('neutral');

  protected readonly icon = computed(() => ICONS[this.tone()] ?? 'info-circle');
}
