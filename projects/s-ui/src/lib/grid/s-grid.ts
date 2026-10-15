import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import type { Space } from '../core/scale.types';

/**
 * Responsive grid. Always one column on a phone, so no screen can forget it;
 * `aside` gives a fixed 20rem side column next to the content.
 *
 *   <s-grid columns="3" gap="4">…</s-grid>
 */
@Component({
  selector: 's-grid',
  templateUrl: './s-grid.html',
  styleUrl: './s-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-gap]': 'gap()',
    '[attr.data-columns]': 'columns()',
    '[attr.data-aside]': 'aside() ? "" : null',
  },
})
export class SGrid {
  readonly columns = input<'2' | '3' | '4'>('2');
  readonly gap = input<Space>('3');
  readonly aside = input(false, { transform: booleanAttribute });
}
