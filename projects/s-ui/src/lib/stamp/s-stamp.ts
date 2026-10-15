import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { StateTone } from '../core/scale.types';

/**
 * A state recorded on the record — active, pending, revoked. Always text plus
 * a border, never colour alone (02 §5).
 *
 *   <s-stamp tone="success" dot>{{ 'COMMON.ACTIVE' | translate }}</s-stamp>
 */
@Component({
  selector: 's-stamp',
  templateUrl: './s-stamp.html',
  styleUrl: './s-stamp.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
})
export class SStamp {
  readonly tone = input<StateTone>('neutral');
  /** Small leading dot, for live states (online, running). */
  readonly dot = input(false, { transform: booleanAttribute });
}
