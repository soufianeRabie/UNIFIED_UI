import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { map } from 'rxjs';

import { AuthStore } from '../../core/stores/auth.store';
import { ThemeService } from '../../core/services/theme.service';
import { PermissionService } from '../../secu/services/permission.service';
import { OidcAuthService } from '../../core/services/oidc-auth.service';
import type { SecuMenuItemDto, SecuPageType } from '../../secu/models/secu.models';

interface LayoutMenuItem {
  label: string;
  icon: string;
  routerLink: string;
}

interface LayoutMenuNode {
  idPage: number;
  label: string;
  icon: string;
  routerLink: string | null;
  pageType: SecuPageType;
  children: LayoutMenuNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DrawerModule, ButtonModule, TranslatePipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly theme = inject(ThemeService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly permissionService = inject(PermissionService);
  private readonly oidcAuth = inject(OidcAuthService);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 767px)').pipe(map((state) => state.matches)),
    { initialValue: false }
  );

  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileSidebarVisible = signal(false);

  protected readonly userName = computed(() => this.authStore.currentUser()?.username ?? 'Utilisateur');
  protected readonly tenantName = computed(() => {
    const user = this.authStore.currentUser();
    return (
      user?.tenant?.name ??
      this.authStore.tenantBranding()?.name ??
      this.authStore.currentTenantId() ??
      'Tenant'
    );
  });
  protected readonly tenantLogo = computed(() => this.authStore.tenantBranding()?.logoUrl ?? '');

  private readonly fallbackMenu: LayoutMenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', routerLink: '/dashboard' },
    { label: 'Flotte', icon: 'pi pi-car', routerLink: '/fleet' },
    { label: 'Catégories de Flotte', icon: 'pi pi-tags', routerLink: '/fleet/categories' },
    { label: 'Gestion des Prix', icon: 'pi pi-percentage', routerLink: '/admin/pricing' },
    { label: 'Réservations', icon: 'pi pi-calendar', routerLink: '/bookings' },
    { label: 'Agences', icon: 'pi pi-building', routerLink: '/branches' },
    { label: 'Facturation', icon: 'pi pi-wallet', routerLink: '/billing' },
    { label: 'Profil', icon: 'pi pi-user', routerLink: '/profile' }
  ];

  private readonly fallbackAdminMenu: LayoutMenuItem[] = [
    { label: 'Security Center', icon: 'pi pi-shield', routerLink: '/admin' }
  ];

  protected readonly menuTree = signal<LayoutMenuNode[]>(this.buildFallbackTree(this.fallbackMenu));
  protected readonly adminMenuTree = signal<LayoutMenuNode[]>(this.buildFallbackTree(this.fallbackAdminMenu));
  constructor() {
    if (!this.permissionService.loaded()) {
      this.permissionService.loadPermissions();
    }

    effect(() => {
      const menu = this.permissionService.menu();
      if (menu?.length) {
        this.menuTree.set(this.buildMenuTree(menu, { excludePrefix: '/admin' }));
        this.adminMenuTree.set(this.buildMenuTree(menu, { includePrefix: '/admin' }));
      } else {
        this.menuTree.set(this.buildFallbackTree(this.fallbackMenu));
        this.adminMenuTree.set(this.buildFallbackTree(this.fallbackAdminMenu));
      }
    });

    effect(() => {
      const branding = this.authStore.tenantBranding();
      if (branding?.primaryColor) {
        this.theme.applyBranding(branding);
        return;
      }
      const tenant = this.authStore.currentTenantId();
      if (tenant === 'tenant-a') {
        this.theme.applyPrimary('#2563eb');
      } else if (tenant === 'tenant-b') {
        this.theme.applyPrimary('#16a34a');
      } else {
        this.theme.applyPrimary('#111827');
      }
    });

    effect(() => {
      if (!this.isMobile()) {
        this.mobileSidebarVisible.set(false);
      }
    });
  }

  protected toggleMenuNode(node: LayoutMenuNode, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!node.children.length) {
      return;
    }
    node.expanded = !node.expanded;
    this.menuTree.set([...this.menuTree()]);
    this.adminMenuTree.set([...this.adminMenuTree()]);
  }

  private buildMenuTree(
    items: SecuMenuItemDto[],
    opts: { includePrefix?: string; excludePrefix?: string },
  ): LayoutMenuNode[] {
    const filtered = this.filterMenu(items, opts);
    return filtered
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((node) => this.mapMenuNode(node));
  }

  private buildFallbackTree(items: LayoutMenuItem[]): LayoutMenuNode[] {
    return items.map((item, idx) => ({
      idPage: idx + 1,
      label: item.label,
      icon: item.icon,
      routerLink: item.routerLink,
      pageType: 'PAGE',
      children: [],
      expanded: false,
    }));
  }

  private filterMenu(
    items: SecuMenuItemDto[],
    opts: { includePrefix?: string; excludePrefix?: string },
  ): SecuMenuItemDto[] {
    const includePrefix = opts.includePrefix ? this.normalizeRoute(opts.includePrefix) : null;
    const excludePrefix = opts.excludePrefix ? this.normalizeRoute(opts.excludePrefix) : null;

    const visit = (node: SecuMenuItemDto): SecuMenuItemDto | null => {
      const children = (node.children ?? [])
        .map(visit)
        .filter((child): child is SecuMenuItemDto => Boolean(child));
      const url = this.normalizeRoute(node.pageUrl);

      const includedByPrefix = includePrefix ? Boolean(url && url.startsWith(includePrefix)) : true;
      const excludedByPrefix = excludePrefix ? Boolean(url && url.startsWith(excludePrefix)) : false;
      const selfIncluded = Boolean(url) && includedByPrefix && !excludedByPrefix;

      if (selfIncluded || children.length) {
        return { ...node, children };
      }
      return null;
    };

    return (items ?? [])
      .map(visit)
      .filter((node): node is SecuMenuItemDto => Boolean(node));
  }

  private mapMenuNode(node: SecuMenuItemDto): LayoutMenuNode {
    const children = (node.children ?? [])
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((child) => this.mapMenuNode(child));

    return {
      idPage: node.idPage,
      label: (node.pageName ?? node.pageCode ?? 'Untitled').trim(),
      icon: this.normalizeIcon(node.icon),
      routerLink: this.normalizeRoute(node.pageUrl),
      pageType: (node.pageType ?? 'PAGE') as SecuPageType,
      children,
      expanded: children.length > 0,
    };
  }

  private normalizeRoute(url: string | null): string | null {
    const trimmed = url?.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  private normalizeIcon(icon: string | null): string {
    const trimmed = icon?.trim();
    if (trimmed && (trimmed.includes('pi-') || trimmed.startsWith('pi '))) {
      return trimmed;
    }
    return 'pi pi-circle';
  }

  protected toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileSidebarVisible.update((state) => !state);
      return;
    }

    this.sidebarCollapsed.update((state) => !state);
  }

  protected closeMobileSidebar(): void {
    if (this.isMobile()) {
      this.mobileSidebarVisible.set(false);
    }
  }

  protected logout(): void {
    this.oidcAuth.startLogout().catch(() => {
      this.authStore.clearAuth();
      void this.router.navigateByUrl('/login');
    });
  }
}
