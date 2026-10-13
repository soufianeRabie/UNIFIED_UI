import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { SecuApiService } from './secu-api.service';
import { SecuMenuItemDto } from '../models/secu.models';
import { PERMISSION_CONFIG } from '../permissions/permission.config';
import { SECU_ACTIONS, getActionLabel, isKnownAction } from '../permissions/actions';
import { actionToFlagKey } from '../permissions/permission-helpers';

type PermissionMap = Record<string, string[]>;

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private api = inject(SecuApiService);
  private config = inject(PERMISSION_CONFIG);

  private permissions = signal<PermissionMap>({});
  private menuTree = signal<SecuMenuItemDto[]>([]);
  public readonly menu = computed(() => this.menuTree());
  public loaded = signal(false);
  private urlToNode: Record<string, SecuMenuItemDto> = {};
  private load$?: Observable<SecuMenuItemDto[]>;
  private readonly legacyPageCodes = new Set([
    'USERS_LIST',
    'ROLES_LIST',
    'GROUPS_LIST',
    'PERMISSIONS_ASSIGN',
    'COMPANIES',
    'POLICIES_LIST',
    'DATA_FILTERS',
    'TOKEN_REVOCATIONS',
    'AUDIT_LOGS',
    'AUDIT_CONFIG',
  ]);

  hasPermission(page: string, action: string): boolean {
    if (!page || !action) return false;
    const pageUpper = page.toUpperCase();
    const actionUpper = action.toUpperCase();

    const allowedActions = this.permissions()[pageUpper];
    if (!allowedActions) return false;

    return allowedActions.includes('*') || allowedActions.includes(actionUpper);
  }

  can(page: string, action: string): boolean {
    return this.hasPermission(page, action);
  }

  canCreate(page: string): boolean {
    return this.can(page, 'CREATE');
  }

  canRead(page: string): boolean {
    return this.can(page, 'READ');
  }

  canUpdate(page: string): boolean {
    return this.can(page, 'UPDATE');
  }

  canDelete(page: string): boolean {
    return this.can(page, 'DELETE');
  }

  canExport(page: string): boolean {
    return this.can(page, 'EXPORT');
  }

  getActionsForPage(page: string): string[] {
    if (!page) return [];
    const allowedActions = this.permissions()[page.toUpperCase()];
    return allowedActions ? [...allowedActions] : [];
  }

  getPagePermissionFlags(page: string): Record<string, boolean> {
    const normalizedPage = (page ?? '').toUpperCase();
    const pageActions = this.getActionsForPage(normalizedPage);

    const flags: Record<string, boolean> = {};
    for (const def of SECU_ACTIONS) {
      flags[actionToFlagKey(def.code)] = this.hasPermission(normalizedPage, def.code);
    }
    return flags;
  }

  getNodeByUrl(url: string): SecuMenuItemDto | null {
    if (!url) return null;
    const normalized = this.normalizeUrl(url);
    return this.urlToNode[normalized] ?? null;
  }

  getPageCodeForUrl(url: string): string | null {
    const node = this.getNodeByUrl(url);
    return node?.pageCode ?? null;
  }

  getActionsForUrl(url: string): string[] {
    const pageCode = this.getPageCodeForUrl(url);
    return pageCode ? this.getActionsForPage(pageCode) : [];
  }

  loadPermissions() {
    // Keep the public API used elsewhere, but route everything through ensureLoaded().
    this.ensureLoaded().subscribe();
  }

  invalidate() {
    this.permissions.set({});
    this.loaded.set(false);
    this.menuTree.set([]);
    this.urlToNode = {};
    this.load$ = undefined;
  }

  ensureLoaded(): Observable<SecuMenuItemDto[]> {
    if (this.loaded()) {
      return of(this.menuTree());
    }

    if (!this.load$) {
      this.load$ = this.api.getMenu().pipe(
        tap((items) => this.applyMenu(items ?? [])),
        catchError((err) => {
          console.warn('SECU: Unable to load /api/secu/me/menu. Denying protected routes.', err);
          this.applyMenu([]);
          return of([] as SecuMenuItemDto[]);
        }),
        shareReplay(1),
      );
    }

    return this.load$;
  }

  canAccessUrl(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    const node = this.urlToNode[normalized];
    if (node) {
      return this.canAccessNode(node);
    }

    // Allow container routes if any child page under them is accessible.
    const prefix = normalized.endsWith('/') ? normalized : `${normalized}/`;
    return Object.keys(this.urlToNode).some((knownUrl) => {
      if (!knownUrl.startsWith(prefix)) {
        return false;
      }
      const candidate = this.urlToNode[knownUrl];
      return candidate ? this.canAccessNode(candidate) : false;
    });
  }

  firstAllowedUrl(prefix?: string): string | null {
    const items = this.menuTree();
    if (!items?.length) {
      return null;
    }

    const flat = this.flattenMenu(items)
      .filter((x) => Boolean(x.url))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const entry of flat) {
      if (
        prefix &&
        entry.url &&
        !this.normalizeUrl(entry.url).startsWith(this.normalizeUrl(prefix))
      ) {
        continue;
      }
      if (entry.url && this.canAccessNode(entry.node)) {
        return entry.url;
      }
    }

    return null;
  }

  private buildMapFromMenu(items: SecuMenuItemDto[]): PermissionMap {
    const map: PermissionMap = {};
    const visit = (item: SecuMenuItemDto) => {
      if (item?.pageCode) {
        const pageUpper = item.pageCode.toUpperCase();
        if (!map[pageUpper]) map[pageUpper] = [];
        (item.actions ?? []).forEach((action) => {
          const actionUpper = action.toUpperCase();
          if (!map[pageUpper].includes(actionUpper)) {
            map[pageUpper].push(actionUpper);
          }
        });
      }
      (item.children ?? []).forEach(visit);
    };
    (items ?? []).forEach(visit);
    return map;
  }

  private buildMapFromFlat(
    items: Array<{ pageCode?: string; actionCode?: string }>,
  ): PermissionMap {
    const map: PermissionMap = {};
    for (const item of items ?? []) {
      if (!item.pageCode || !item.actionCode) continue;
      const pageUpper = item.pageCode.toUpperCase();
      const actionUpper = item.actionCode.toUpperCase();
      if (!map[pageUpper]) map[pageUpper] = [];
      map[pageUpper].push(actionUpper);
    }
    return map;
  }

  private applyMenu(items: SecuMenuItemDto[]): void {
    const transformedItems = this.dedupeMenu(this.canonicalizeMenuUrls(items ?? []));

    const map = this.buildMapFromMenu(transformedItems);
    this.permissions.set(map);
    this.menuTree.set(transformedItems);

    const urlToNode: Record<string, SecuMenuItemDto> = {};
    for (const entry of this.flattenMenu(transformedItems)) {
      if (!entry.url) continue;
      urlToNode[this.normalizeUrl(entry.url)] = entry.node;
    }
    this.urlToNode = urlToNode;
    this.loaded.set(true);
  }

  private canonicalizeMenuUrls(items: SecuMenuItemDto[]): SecuMenuItemDto[] {
    return items.map((item) => ({
      ...item,
      pageUrl: this.canonicalAdminUrl(item.pageUrl),
      children: this.canonicalizeMenuUrls(item.children ?? []),
    }));
  }

  private canonicalAdminUrl(url: string | null): string | null {
    if (!url) {
      return null;
    }

    const normalized = this.normalizeUrl(url);
    if (normalized === '/admin/security') {
      return '/admin';
    }
    if (normalized.startsWith('/admin/security/')) {
      return `/admin/${normalized.substring('/admin/security/'.length)}`;
    }
    return normalized;
  }

  private dedupeMenu(items: SecuMenuItemDto[]): SecuMenuItemDto[] {
    const byKey = new Map<string, SecuMenuItemDto>();

    for (const item of items ?? []) {
      const normalized: SecuMenuItemDto = {
        ...item,
        children: this.dedupeMenu(item.children ?? []),
      };
      const key = normalized.pageUrl
        ? `url:${this.normalizeUrl(normalized.pageUrl)}`
        : `code:${normalized.pageCode?.toUpperCase() ?? normalized.idPage}`;
      const existing = byKey.get(key);
      byKey.set(key, existing ? this.mergeMenuItems(existing, normalized) : normalized);
    }

    return [...byKey.values()];
  }

  private mergeMenuItems(a: SecuMenuItemDto, b: SecuMenuItemDto): SecuMenuItemDto {
    const primary = this.preferMenuItem(b, a) ? b : a;
    const secondary = primary === a ? b : a;
    const actions = Array.from(new Set([...(primary.actions ?? []), ...(secondary.actions ?? [])]));

    return {
      ...primary,
      icon: primary.icon || secondary.icon,
      actions,
      children: this.dedupeMenu([...(primary.children ?? []), ...(secondary.children ?? [])]),
    };
  }

  private preferMenuItem(candidate: SecuMenuItemDto, current: SecuMenuItemDto): boolean {
    const candidateLegacy = this.legacyPageCodes.has(candidate.pageCode?.toUpperCase() ?? '');
    const currentLegacy = this.legacyPageCodes.has(current.pageCode?.toUpperCase() ?? '');
    if (candidateLegacy !== currentLegacy) {
      return !candidateLegacy;
    }

    if (Boolean(candidate.icon?.trim()) !== Boolean(current.icon?.trim())) {
      return Boolean(candidate.icon?.trim());
    }

    return (candidate.sortOrder ?? Number.POSITIVE_INFINITY) <
      (current.sortOrder ?? Number.POSITIVE_INFINITY);
  }

  private canAccessPage(pageCode: string): boolean {
    const actions = this.permissions()[pageCode.toUpperCase()];
    if (!actions || actions.length === 0) {
      return false;
    }
    if (actions.includes('*')) {
      return true;
    }

    const mode = this.config.routeAccessMode;
    if (mode === 'any') {
      return true;
    }

    const required = new Set(this.config.routeAccessActions.map((a) => a.toUpperCase()));
    return actions.some((a) => required.has(a.toUpperCase()));
  }

  private canAccessNode(node: SecuMenuItemDto): boolean {
    const pageType = (node.pageType ?? 'PAGE').toUpperCase();
    if (pageType === 'MODEL') {
      if (this.canAccessPage(node.pageCode)) {
        return true;
      }
      return this.hasAccessibleDescendant(node);
    }
    return this.canAccessPage(node.pageCode);
  }

  private hasAccessibleDescendant(node: SecuMenuItemDto): boolean {
    for (const child of node.children ?? []) {
      if (this.canAccessNode(child)) {
        return true;
      }
    }
    return false;
  }

  private flattenMenu(
    items: SecuMenuItemDto[],
  ): Array<{ node: SecuMenuItemDto; url: string | null; sortOrder: number }> {
    const out: Array<{ node: SecuMenuItemDto; url: string | null; sortOrder: number }> = [];
    const visit = (node: SecuMenuItemDto) => {
      if (node?.pageCode) {
        out.push({
          node,
          url: node.pageUrl ?? null,
          sortOrder: node.sortOrder ?? Number.POSITIVE_INFINITY,
        });
      }
      (node.children ?? []).forEach(visit);
    };
    (items ?? []).forEach(visit);
    return out;
  }

  private normalizeUrl(url: string): string {
    const noHash = url.split('#')[0];
    const noQuery = noHash.split('?')[0];
    const withSlash = noQuery.startsWith('/') ? noQuery : `/${noQuery}`;
    if (withSlash.length > 1) {
      return withSlash.replace(/\/+$/, '');
    }
    return withSlash;
  }

  private isMenuStructure(items: any[]): items is SecuMenuItemDto[] {
    if (!Array.isArray(items) || items.length === 0) {
      return false;
    }
    return items.every((item) => Boolean(item) && Array.isArray(item?.children));
  }

  // -------------------------------
  // Action helpers
  // -------------------------------

  getAllKnownActions() {
    return SECU_ACTIONS;
  }

  getActionLabel(actionCode: string) {
    return getActionLabel(actionCode);
  }

  isActionAllowed(pageCode: string, actionCode: string): boolean {
    return this.hasPermission(pageCode, actionCode);
  }

  getPageActions(pageCode: string): string[] {
    if (!pageCode) return [];
    const upper = pageCode.toUpperCase();
    return this.permissions()[upper] ?? [];
  }

  getActionFriendlyNamesForPage(pageCode: string): { code: string; label: string }[] {
    return this.getPageActions(pageCode).map((code) => ({ code, label: getActionLabel(code) }));
  }

  isValidActionCode(code: string): boolean {
    return isKnownAction(code);
  }
}
