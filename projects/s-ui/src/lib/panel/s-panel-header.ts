import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Title strip of a panel: heading at the start, `[sPanelActions]` at the end. */
@Component({
  selector: 's-panel-header',
  templateUrl: './s-panel-header.html',
  styleUrl: './s-panel-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPanelHeader {}
