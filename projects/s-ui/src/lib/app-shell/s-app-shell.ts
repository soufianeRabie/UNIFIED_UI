import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  inject,
  model,
  viewChild,
} from '@angular/core';
import { SUiLabels } from '../core/s-ui-labels';
import { SIcon } from '../icon/s-icon';

/**
 * The application frame: skip link, sidebar (collapsible on desktop, a focus-trapped drawer on small screens),
 * topbar, and the main region. Purely presentational — the app projects its brand, navigation, breadcrumbs and
 * actions into named slots.
 *
 *   <s-app-shell [(collapsed)]="collapsed">
 *     <span s-shell-brand>…</span>
 *     <s-sidebar-nav s-shell-nav … />
 *     <s-breadcrumbs s-shell-topbar … />
 *     <app-language-switcher s-shell-actions />
 *     <router-outlet />
 *   </s-app-shell>
 */
@Component({
  selector: 's-app-shell',
  imports: [CdkTrapFocus, SIcon],
  templateUrl: './s-app-shell.html',
  styleUrl: './s-app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'mobileOpen.set(false)' },
})
export class SAppShell {
  private readonly labels = inject(SUiLabels);

  /** Desktop: icons-only sidebar. */
  readonly collapsed = model(false);
  /** Small screens: the sidebar drawer is open. */
  readonly mobileOpen = model(false);

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  protected readonly text = computed(() => {
    this.labels.version();
    return {
      skip: this.labels.get('S.SHELL.SKIP'),
      open: this.labels.get('S.SHELL.OPEN_MENU'),
      close: this.labels.get('S.SHELL.CLOSE_MENU'),
      toggle: this.labels.get(this.collapsed() ? 'S.SHELL.EXPAND' : 'S.SHELL.COLLAPSE'),
    };
  });

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
