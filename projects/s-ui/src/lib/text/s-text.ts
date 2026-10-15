import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { TextSize, TextTone, TextWeight } from '../core/scale.types';

/**
 * Inline text with a size, tone and weight from the scale. Replaces every
 * `style="font-size:12px;color:…"` a screen would otherwise write.
 *
 *   <s-text size="sm" tone="muted">Last login 3 days ago</s-text>
 *   <s-text mono>{{ user.username }}</s-text>
 */
@Component({
  selector: 's-text',
  templateUrl: './s-text.html',
  styleUrl: './s-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-weight]': 'weight()',
    '[attr.data-mono]': 'mono() ? "" : null',
    '[attr.data-caps]': 'caps() ? "" : null',
    '[attr.data-truncate]': 'truncate() ? "" : null',
    '[attr.data-block]': 'block() ? "" : null',
  },
})
export class SText {
  readonly size = input<TextSize>();
  readonly tone = input<TextTone>();
  readonly weight = input<TextWeight>();
  /** References people read aloud: ids, codes, usernames. */
  readonly mono = input(false, { transform: booleanAttribute });
  readonly caps = input(false, { transform: booleanAttribute });
  /** One line with an ellipsis; implies `block`. */
  readonly truncate = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
}
