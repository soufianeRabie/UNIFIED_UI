import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PanelPadding, PanelTone } from './s-panel.types';

/**
 * A surface: the card every list, form and detail section sits on.
 *
 *   <s-panel padding="5">
 *     <s-panel-header>Title <button s-button sPanelActions>…</button></s-panel-header>
 *     …
 *   </s-panel>
 */
@Component({
  selector: 's-panel',
  templateUrl: './s-panel.html',
  styleUrl: './s-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()', '[attr.data-padding]': 'padding()' },
})
export class SPanel {
  readonly tone = input<PanelTone>('default');
  readonly padding = input<PanelPadding>('0');
}
