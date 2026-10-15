import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { Align, Justify, Space } from '../core/scale.types';

/**
 * Horizontal flow, vertically centred by default.
 *
 *   <s-row gap="2" justify="between" wrap>…</s-row>
 */
@Component({
  selector: 's-row',
  templateUrl: './s-row.html',
  styleUrl: './s-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gap]': 'gap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
    '[attr.data-wrap]': 'wrap() ? "" : null',
  },
})
export class SRow {
  readonly gap = input<Space>('2');
  readonly align = input<Align>();
  readonly justify = input<Justify>();
  readonly wrap = input(false, { transform: booleanAttribute });
}
