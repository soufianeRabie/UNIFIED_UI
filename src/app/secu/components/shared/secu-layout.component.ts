import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import type { SecuMenuItemDto, SecuPageType } from '../../models/secu.models';

interface MenuNode {
  idPage: number;
  label: string;
  url: string | null;
  pageType: SecuPageType;
  iconText: string;
  iconClass?: string;
  children: MenuNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-secu-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="secu-layout">
      <!-- Sidebar -->
      <aside class="secu-sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
        <div class="s-brand">
          <div class="s-brand-icon">S</div>
          <span class="s-brand-label">SECU Admin</span>
        </div>

        <nav class="s-nav">
          @if (menuTree().length) {
            <ng-container *ngTemplateOutlet="menuTpl; context: { $implicit: menuTree() }"></ng-container>
          } @else {
            <div class="s-empty">
              <div class="s-empty-text">No menu items</div>
            </div>
          }
        </nav>

        <div style="padding: 12px; border-top: 1px solid var(--s-border); flex-shrink: 0;">
          <button class="s-btn s-btn-ghost" style="width:100%; justify-content: center;" (click)="toggle()">
            {{ collapsed() ? 'Expand' : 'Collapse' }}
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="secu-main">
        <!-- Topbar -->
        <header class="secu-topbar">
          <button class="s-btn-icon s-mobile-menu-btn" type="button" (click)="mobileOpen.set(true)">
            <i class="pi pi-bars"></i>
          </button>
          <div class="s-breadcrumb">
            <span>Security</span>
            <span class="s-breadcrumb-sep">/</span>
            <span class="s-breadcrumb-current">Module</span>
          </div>
          <div class="s-topbar-actions">
            <div style="font-size:12px; color: var(--s-text-3); font-family: var(--s-mono);">
              SECU v1
            </div>
          </div>
        </header>

        <!-- Router outlet -->
        <main class="secu-content">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile overlay -->
      @if (mobileOpen()) {
        <div
          style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:40;"
          (click)="mobileOpen.set(false)">
        </div>
      }
    </div>

    <ng-template #menuTpl let-nodes>
      @for (node of nodes; track node.idPage) {
        @if (node.url) {
          <a
            class="s-nav-item s-tree-node"
            [routerLink]="node.url"
            routerLinkActive="active"
            (click)="closeMobile()"
          >
            <span
              class="s-tree-expand"
              [class.open]="node.expanded"
              [style.opacity]="node.children.length ? 1 : 0"
              [style.pointerEvents]="node.children.length ? 'auto' : 'none'"
              (click)="toggleNode(node, $event)"
            >
              >
            </span>
            <span class="s-nav-icon">
              @if (node.iconClass) {
                <i [class]="node.iconClass"></i>
              } @else {
                {{ node.iconText }}
              }
            </span>
            <span class="s-nav-text">{{ node.label }}</span>
          </a>
        } @else {
          <button
            type="button"
            class="s-nav-item s-tree-node"
            (click)="toggleNode(node, $event)"
          >
            <span
              class="s-tree-expand"
              [class.open]="node.expanded"
              [style.opacity]="node.children.length ? 1 : 0"
              [style.pointerEvents]="node.children.length ? 'auto' : 'none'"
            >
              >
            </span>
            <span class="s-nav-icon">
              @if (node.iconClass) {
                <i [class]="node.iconClass"></i>
              } @else {
                {{ node.iconText }}
              }
            </span>
            <span class="s-nav-text">{{ node.label }}</span>
          </button>
        }

        @if (node.children.length && node.expanded) {
          <div class="s-tree-children">
            <ng-container *ngTemplateOutlet="menuTpl; context: { $implicit: node.children }"></ng-container>
          </div>
        }
      }
    </ng-template>
  `,
})
export class SecuLayoutComponent implements OnInit, OnDestroy {
  private readonly permissionService = inject(PermissionService);

  collapsed = signal(false);
  mobileOpen = signal(false);
  menuTree = signal<MenuNode[]>([]);

  constructor() {
    this.permissionService.ensureLoaded().subscribe();
    effect(() => {
      const menu = this.permissionService.menu();
      this.menuTree.set(this.buildSecurityMenu(menu ?? []));
    });
  }

  ngOnInit() {
    document.body.classList.add('secu-module');
  }

  ngOnDestroy() {
    document.body.classList.remove('secu-module');
  }

  toggle() {
    this.collapsed.update(v => !v);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  toggleNode(node: MenuNode, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!node.children.length) {
      return;
    }
    node.expanded = !node.expanded;
    this.menuTree.set([...this.menuTree()]);
  }

  private buildSecurityMenu(items: SecuMenuItemDto[]): MenuNode[] {
    const prefix = '/admin';
    const filtered = this.filterByPrefix(items, prefix);
    const roots = this.extractPrefixRoots(filtered, prefix);
    return roots
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(node => this.mapNode(node));
  }

  private filterByPrefix(items: SecuMenuItemDto[], prefix: string): SecuMenuItemDto[] {
    const normalizedPrefix = this.normalizeRoute(prefix) ?? prefix;
    const visit = (node: SecuMenuItemDto): SecuMenuItemDto | null => {
      const children = (node.children ?? [])
        .map(visit)
        .filter((child): child is SecuMenuItemDto => Boolean(child));
      const url = this.normalizeRoute(node.pageUrl);
      const selfMatches = Boolean(url && url.startsWith(normalizedPrefix));

      if (selfMatches || children.length) {
        return { ...node, children };
      }
      return null;
    };

    return (items ?? [])
      .map(visit)
      .filter((node): node is SecuMenuItemDto => Boolean(node));
  }

  private mapNode(node: SecuMenuItemDto): MenuNode {
    const icon = this.resolveIcon(node.icon);
    const children = (node.children ?? [])
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(child => this.mapNode(child));
    return {
      idPage: node.idPage,
      label: (node.pageName ?? node.pageCode ?? 'Untitled').trim(),
      url: this.normalizeRoute(node.pageUrl),
      pageType: (node.pageType ?? 'PAGE') as SecuPageType,
      iconText: icon.iconText,
      iconClass: icon.iconClass,
      children,
      expanded: children.length > 0,
    };
  }

  private extractPrefixRoots(items: SecuMenuItemDto[], prefix: string): SecuMenuItemDto[] {
    const normalizedPrefix = this.normalizeRoute(prefix) ?? prefix;
    const roots: SecuMenuItemDto[] = [];

    const visit = (node: SecuMenuItemDto) => {
      const url = this.normalizeRoute(node.pageUrl);
      if (url && url.startsWith(normalizedPrefix)) {
        roots.push(node);
        return;
      }
      (node.children ?? []).forEach(visit);
    };

    (items ?? []).forEach(visit);
    return roots.length ? roots : items;
  }

  private normalizeRoute(url: string | null): string | null {
    const trimmed = url?.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  private resolveIcon(icon: string | null): { iconText: string; iconClass?: string } {
    const trimmed = icon?.trim() ?? '';
    if (trimmed && (trimmed.includes('pi-') || trimmed.startsWith('pi '))) {
      return { iconText: '', iconClass: trimmed };
    }
    return { iconText: trimmed || '*', iconClass: undefined };
  }
}
