import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { StateTone } from '../core/scale.types';
import { SIcon } from '../icon/s-icon';

/**
 * A headline number with its label, for overview strips.
 *
 *   <s-grid columns="4"><s-kpi [value]="roles().length" label="Roles" icon="id-card" /></s-grid>
 */
@Component({
  selector: 's-kpi',
  imports: [SIcon],
  templateUrl: './s-kpi.html',
  styleUrl: './s-kpi.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
})
export class SKpi {
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
  readonly icon = input('chart-bar');
  readonly tone = input<StateTone>('accent');
}
