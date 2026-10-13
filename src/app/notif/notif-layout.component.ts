import { Component, OnDestroy, OnInit, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { PermissionService, SecuMenuItem } from './core/services/permission.service';
import { AuthStore } from '../core/stores/auth.store';
import { NotificationsService } from './core/services/notifications.service';
import { RealtimeService } from './core/services/realtime.service';
import { LangSwitcherComponent } from '../shared/components/lang-switcher.component';

interface NavItem { label: string; path: string; icon: string; }

@Component({
  selector: 'notif-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslatePipe, LangSwitcherComponent],
  template: `
    <div class="nl-shell">
      <!-- Sidebar -->
      <aside class="nl-sidebar" [class.nl-sidebar--collapsed]="collapsed()">
        <div class="nl-brand">
          <div class="nl-brand-icon">
            <i class="pi pi-bell"></i>
          </div>
          <span class="nl-brand-name">{{ 'NOTIF.BRAND' | translate }}</span>
        </div>

        <nav class="nl-nav">
          @for (item of visibleNavItems(); track item.path) {
            <a class="nl-nav-item"
               [routerLink]="'/notif' + item.path"
               routerLinkActive="nl-nav-item--active"
               [routerLinkActiveOptions]="{ exact: item.path === '' }">
              <span class="nl-nav-icon"><i [class]="item.icon"></i></span>
              <span class="nl-nav-label">{{ item.label }}</span>
              @if (item.path === '/notifications' && unreadCount() > 0) {
                <span class="nl-nav-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              }
            </a>
          }
        </nav>

        <div class="nl-sidebar-footer">
          <button class="nl-collapse-btn" (click)="toggle()" type="button">
            <i class="pi" [class.pi-chevron-left]="!collapsed()" [class.pi-chevron-right]="collapsed()"></i>
            <span class="nl-nav-label">{{ 'NOTIF.COLLAPSE' | translate }}</span>
          </button>
        </div>
      </aside>

      <!-- Main area -->
      <div class="nl-main">
        <header class="nl-topbar">
          <div class="nl-topbar-left">
            <i class="pi pi-bell nl-topbar-icon"></i>
            <div class="nl-topbar-breadcrumb">
              <span class="nl-topbar-module">{{ 'NOTIF.MODULE_LABEL' | translate }}</span>
              @if (currentPageLabel()) {
                <i class="pi pi-chevron-right nl-topbar-sep"></i>
                <span class="nl-topbar-page">{{ currentPageLabel() }}</span>
              }
            </div>
          </div>
          <div class="nl-topbar-right">
            @if (unreadCount() > 0) {
              <div class="nl-topbar-badge">
                <i class="pi pi-inbox"></i>
                <span>{{ 'NOTIF.UNREAD_COUNT' | translate: { count: unreadCount() } }}</span>
              </div>
            }
            <app-lang-switcher />
            <a class="nl-topbar-btn" routerLink="/notif/settings">
              <i class="pi pi-cog"></i>
            </a>
          </div>
        </header>

        <main class="nl-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class NotifLayoutComponent implements OnInit, OnDestroy {
  private readonly permissions = inject(PermissionService);
  private readonly authStore = inject(AuthStore);
  private readonly notifService = inject(NotificationsService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);

  collapsed = signal(false);
  unreadCount = signal(0);
  currentPageLabel = signal('');

  private subs: Subscription[] = [];

  readonly visibleNavItems = computed<NavItem[]>(() => {
    const menu = this.permissions.menu();
    if (!menu?.length) return [];
    const items: NavItem[] = [];
    const visit = (node: SecuMenuItem) => {
      const url = node.pageUrl?.trim() ?? '';
      if (url.startsWith('/notif') && url !== '/notif') {
        items.push({
          label: node.pageName ?? node.pageCode,
          path: url.replace(/^\/notif/, '') || '',
          icon: node.icon?.trim() || 'pi pi-circle',
        });
      }
      // include root /notif as Dashboard
      if (url === '/notif') {
        items.unshift({ label: node.pageName ?? 'Notifications', path: '', icon: node.icon?.trim() || 'pi pi-bell' });
      }
      (node.children ?? []).forEach(visit);
    };
    menu.forEach(visit);
    return items;
  });

  toggle() { this.collapsed.update(v => !v); }

  ngOnInit(): void {
    document.body.classList.add('secu-module');
    this.permissions.ensureLoaded().subscribe();
    this.loadUnread();

    this.realtime.start();
    this.subs.push(
      this.realtime.unreadCount$.subscribe(c => this.unreadCount.set(c)),
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.updateBreadcrumb();
      })
    );
    this.updateBreadcrumb();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('secu-module');
    this.subs.forEach(s => s.unsubscribe());
    this.realtime.stop();
  }

  private loadUnread(): void {
    this.notifService.unreadCount().subscribe({
      next: r => this.unreadCount.set(r.count ?? 0),
      error: () => undefined
    });
  }

  private updateBreadcrumb(): void {
    const url = this.router.url;
    const match = this.visibleNavItems().find(item => {
      if (item.path === '') return url === '/notif' || url === '/notif/';
      return url.startsWith('/notif' + item.path);
    });
    this.currentPageLabel.set(match?.label ?? '');
  }
}


