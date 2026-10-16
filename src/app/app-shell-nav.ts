import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { SNavSection } from '@s/core';
import type { Subscription } from 'rxjs';
import { toNavSections } from './app-shell-nav.mapper';
import { I18nStore } from './core/i18n';
import type { ShellNavSource } from './core/shell';
import { NotificationsService } from './notif/core/services/notifications.service';
import { RealtimeService } from './notif/core/services/realtime.service';
import { PermissionService } from './secu/services/permission.service';

/**
 * The shell's navigation for this app: the security permission menu, the unread counter of the notification
 * inbox (live through the notification hub), and the account links. Took over what `secu-layout` and
 * `notif-layout` each did for their half.
 */
@Injectable()
export class AppShellNav implements ShellNavSource {
  private readonly permissions = inject(PermissionService);
  private readonly notifications = inject(NotificationsService);
  private readonly realtime = inject(RealtimeService);
  private readonly translate = inject(TranslateService);
  private readonly i18n = inject(I18nStore);

  private readonly unread = signal(0);
  private subscription: Subscription | null = null;

  readonly sections = computed<readonly SNavSection[]>(() => {
    this.i18n.current();
    this.permissions.loaded();
    const t = (key: string) => this.translate.instant(key) as string;
    return toNavSections(this.permissions.menu() ?? [], {
      labels: {
        security: t('SHELL.SECTION.SECURITY'),
        notifications: t('SHELL.SECTION.NOTIFICATIONS'),
        account: t('SHELL.SECTION.ACCOUNT'),
        mySecurity: t('SHELL.ACCOUNT.MY_SECURITY'),
        changePassword: t('SHELL.ACCOUNT.CHANGE_PASSWORD'),
        authSettings: t('SHELL.ACCOUNT.AUTH_SETTINGS'),
      },
      canAuthSettings:
        this.permissions.canRead('SETTINGS') || this.permissions.canUpdate('SETTINGS'),
      unread: this.unread(),
    });
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.disconnect());
  }

  connect(): void {
    if (this.subscription) return;
    this.permissions.ensureLoaded().subscribe();
    this.notifications.unreadCount().subscribe({
      next: (result) => this.unread.set(result.count ?? 0),
      error: () => undefined,
    });
    this.realtime.start();
    this.subscription = this.realtime.unreadCount$.subscribe((count) => this.unread.set(count));
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.realtime.stop();
  }
}
