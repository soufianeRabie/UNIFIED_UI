import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Top of every screen: optional eyebrow, the title in the document serif (the
 * page's only `<h1>`), a one-line subtitle, and the screen's main actions.
 *
 *   <s-page-header [title]="'SECU.USERS.TITLE' | translate">
 *     <button s-button variant="primary" sPageActions>…</button>
 *   </s-page-header>
 */
@Component({
  selector: 's-page-header',
  templateUrl: './s-page-header.html',
  styleUrl: './s-page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly eyebrow = input<string>();
}
