import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SAppShell, SBreadcrumbs, SIcon, SIconButton, SSidebarNav } from '@s/ui';
import { LanguageSwitcher } from '../../i18n';
import { OidcAuthService } from '../../services/oidc-auth.service';
import { AuthStore } from '../../stores/auth.store';
import { ShellStore } from '../shell.store';

/** Legacy stylesheets are scoped to this body class until Phase 5 removes them. */
const LEGACY_BODY_CLASS = 'secu-module';

/**
 * The one application frame for every module (security, notifications…): our sidebar from the permission menu,
 * breadcrumbs, language, user and sign-out around the routed page. Replaces `secu-layout` and `notif-layout`.
 */
@Component({
  selector: 'app-shell-layout',
  imports: [
    LanguageSwitcher,
    RouterOutlet,
    SAppShell,
    SBreadcrumbs,
    SIcon,
    SIconButton,
    SSidebarNav,
    TranslatePipe,
  ],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {
  protected readonly shell = inject(ShellStore);
  private readonly auth = inject(AuthStore);
  private readonly oidc = inject(OidcAuthService);

  protected readonly userName = computed(() => {
    const user = this.auth.currentUser();
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    return full || user?.username || '';
  });

  constructor() {
    const body = inject(DOCUMENT).body;
    body.classList.add(LEGACY_BODY_CLASS);
    this.shell.connect();
    inject(DestroyRef).onDestroy(() => {
      body.classList.remove(LEGACY_BODY_CLASS);
      this.shell.disconnect();
    });
  }

  protected signOut(): void {
    void this.oidc.startLogout();
  }
}
