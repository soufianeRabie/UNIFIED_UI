import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Align, Space } from '../core/scale.types';

/**
 * Vertical flow with a gap from the spacing scale.
 *
 *   <s-stack gap="4">…</s-stack>
 */
@Component({
  selector: 's-stack',
  templateUrl: './s-stack.html',
  styleUrl: './s-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-gap]': 'gap()', '[attr.data-align]': 'align()' },
})
export class SStack {
  readonly gap = input<Space>('3');
  readonly align = input<Align>();
}
