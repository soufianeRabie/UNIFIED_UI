import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Toolbar above a table: search first, then filters and toggles. Wraps on
 * narrow screens.
 *
 *   <s-filter-bar>
 *     <s-search … />
 *     <s-switch …>{{ 'COMMON.SHOW_INACTIVE' | translate }}</s-switch>
 *   </s-filter-bar>
 */
@Component({
  selector: 's-filter-bar',
  templateUrl: './s-filter-bar.html',
  styleUrl: './s-filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'search' },
})
export class SFilterBar {}
