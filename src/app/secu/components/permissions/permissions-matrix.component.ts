import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of, forkJoin } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { SecuRoleDto, SecuPageActionDto, SecuPermissionDto } from '../../models/secu.models';
import { TranslatePipe } from '@ngx-translate/core';

type ViewMode = 'matrix' | 'role';

interface MatrixCell {
  granted: boolean;
  idPermission: number | null;
  saving: boolean;
}

interface PageGroup {
  pageCode: string;
  pageName: string;
  pageActions: SecuPageActionDto[];
  expanded: boolean;
}

@Component({
  selector: 'app-permissions-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [
    `
      .view-toggle {
        display: flex;
        border: 1px solid var(--s-border);
        border-radius: var(--s-radius);
        overflow: hidden;
      }
      .vt-btn {
        padding: 6px 14px;
        font-size: 12px;
        background: transparent;
        border: none;
        color: var(--s-text-2);
        cursor: pointer;
        font-family: var(--s-font);
        transition: all 0.13s;
      }
      .vt-btn.active {
        background: var(--s-accent);
        color: #fff;
      }

      .mx-table thead th {
        background: var(--s-bg-3);
        padding: 7px 6px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: var(--s-text-3);
        text-transform: uppercase;
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .mx-table thead th:first-child {
        position: sticky;
        left: 0;
        z-index: 4;
        min-width: 220px;
        text-align: left;
        padding-left: 12px;
      }
      .mx-table thead th.role-header {
        min-width: 90px;
      }
      .mx-table thead th.role-header.selected-role {
        background: var(--s-accent-glow);
        color: var(--s-accent);
      }

      .pg-group-row th {
        background: var(--s-bg-2);
        padding: 6px 12px;
        font-size: 11px;
        color: var(--s-text-2);
        font-weight: 500;
        position: sticky;
        left: 0;
        z-index: 1;
        border-left: 2px solid var(--s-accent);
      }
      .pg-group-row td {
        background: var(--s-bg-2);
      }

      .mx-table tbody tr:not(.pg-group-row):hover td {
        background: rgba(255, 255, 255, 0.02);
      }
      .mx-row-label {
        position: sticky;
        left: 0;
        z-index: 1;
        background: var(--s-bg-2);
        padding: 0 12px;
        white-space: nowrap;
        min-width: 220px;
      }
      .mx-row-label:hover {
        background: var(--s-bg-3);
      }

      .mx-cell {
        padding: 0;
        width: 42px;
        height: 36px;
        text-align: center;
      }
      .mx-cell-inner {
        width: 100%;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.1s;
      }
      .mx-cell-inner:hover {
        background: var(--s-bg-4);
      }
      .mx-cell-inner.granted {
        background: rgba(52, 211, 153, 0.09);
      }
      .mx-cell-inner.granted:hover {
        background: rgba(248, 113, 113, 0.09);
      }
      .mx-cell-inner.saving {
        pointer-events: none;
        opacity: 0.4;
      }
      .mx-cell-inner .check {
        font-size: 13px;
        color: var(--s-green);
      }
      .mx-cell-inner .dot {
        font-size: 10px;
        color: var(--s-border-2);
      }
      .mx-cell-inner .spin {
        font-size: 11px;
        color: var(--s-text-3);
        animation: spin 0.6s linear infinite;
        display: inline-block;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .role-list {
        border: 1px solid var(--s-border);
        border-radius: var(--s-radius-lg);
        overflow: hidden;
      }
      .role-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        cursor: pointer;
        transition: background 0.13s;
        border-bottom: 1px solid var(--s-border);
        font-size: 13px;
      }
      .role-item:last-child {
        border-bottom: none;
      }
      .role-item:hover {
        background: var(--s-bg-3);
      }
      .role-item.active {
        background: var(--s-accent-glow);
        border-right: 3px solid var(--s-accent);
      }
      .role-item .perm-count {
        margin-left: auto;
        font-size: 11px;
        color: var(--s-text-3);
      }

      .rp-tree {
        overflow-y: auto;
        max-height: 65vh;
      }
      .rp-page {
        border-bottom: 1px solid var(--s-border);
      }
      .rp-page:last-child {
        border-bottom: none;
      }
      .rp-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 16px;
        cursor: pointer;
        transition: background 0.13s;
        user-select: none;
      }
      .rp-header:hover {
        background: var(--s-bg-3);
      }
      .rp-chevron {
        font-size: 9px;
        color: var(--s-text-3);
        transition: transform 0.15s;
        width: 14px;
        text-align: center;
      }
      .rp-chevron.open {
        transform: rotate(90deg);
      }
      .rp-actions {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 3px;
        padding: 4px 16px 12px 42px;
        background: var(--s-bg);
      }
      .rp-action {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.12s;
      }
      .rp-action:hover {
        background: var(--s-bg-3);
      }
      .rp-action.granted-action {
        background: rgba(52, 211, 153, 0.07);
      }
      .rp-action.granted-action:hover {
        background: rgba(248, 113, 113, 0.07);
      }
      .rp-action .rp-check {
        width: 14px;
        height: 14px;
        accent-color: var(--s-accent);
        flex-shrink: 0;
      }
      .rp-action .rp-acode {
        font-family: var(--s-mono);
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--s-amber-bg);
        color: var(--s-amber);
      }
      .rp-action .rp-aname {
        font-size: 11px;
        color: var(--s-text-2);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rp-count {
        font-size: 11px;
        margin-left: auto;
        padding: 1px 8px;
        border-radius: 999px;
      }
      .rp-count.has {
        background: var(--s-accent-glow);
        color: var(--s-accent);
      }
      .rp-count.none {
        background: var(--s-bg-4);
        color: var(--s-text-3);
      }
    `,
  ],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_307' | translate }}</h1>
        <p class="s-page-subtitle">
          {{ roles().length }} roles · {{ allPageActions().length }} page-actions ·
          {{ totalGranted() }} grants
        </p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="view-toggle">
          <button
            class="vt-btn"
            [class.active]="viewMode() === 'matrix'"
            (click)="viewMode.set('matrix')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.MATRIX' | translate }}
          </button>
          <button
            class="vt-btn"
            [class.active]="viewMode() === 'role'"
            (click)="viewMode.set('role')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.BY_ROLE' | translate }}
          </button>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="s-empty"><div class="s-empty-text">{{ 'AUTO_INLINE_SECURITY_UI.LOADING' | translate }}</div></div>
    } @else {
      <!-- Stats -->
      <div class="s-stats-grid" style="margin-bottom:20px;">
        <div class="s-stat-card">
          <div class="s-stat-icon blue">🎭</div>
          <div>
            <div class="s-stat-value">{{ roles().length }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_309' | translate }}</div>
          </div>
        </div>
        <div class="s-stat-card">
          <div class="s-stat-icon amber">🔗</div>
          <div>
            <div class="s-stat-value">{{ allPageActions().length }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_264' | translate }}</div>
          </div>
        </div>
        <div class="s-stat-card">
          <div class="s-stat-icon green">✓</div>
          <div>
            <div class="s-stat-value">{{ totalGranted() }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_310' | translate }}</div>
          </div>
        </div>
        <div class="s-stat-card">
          <div class="s-stat-icon purple">📄</div>
          <div>
            <div class="s-stat-value">{{ pageGroups().length }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_284' | translate }}</div>
          </div>
        </div>
      </div>

      <!-- ── MATRIX VIEW ──────────────────────────────────────────────── -->
      @if (viewMode() === 'matrix') {
        <div class="s-card">
          <!-- Filter bar -->
          <div
            style="padding:10px 16px;border-bottom:1px solid var(--s-border);display:flex;align-items:center;gap:10px;flex-wrap:wrap;"
          >
            <div class="s-search" style="max-width:180px;">
              <span class="s-search-icon">🔍</span>
              <input placeholder="{{ 'AUTO_INLINE_SECURITY_UI.FILTER_PAGES' | translate }}" [(ngModel)]="mxSearch" />
            </div>
            <span style="font-size:11px;color:var(--s-text-3);"
              >{{ 'AUTO_INLINE_SECURITY_UI.CLICK_TO_REVOKE_CLICK_TO_GRANT' | translate }}</span
            >
            @if (pendingCount() > 0) {
              <span style="font-size:12px;color:var(--s-amber);margin-left:auto;"
                >{{ pendingCount() }} operation{{ pendingCount() !== 1 ? 's' : '' }} in
                progress…</span
              >
            }
          </div>

          <div class="mx-wrap">
            <table class="mx-table">
              <thead>
                <tr>
                  <th>{{ 'DOM_FALLBACK.TEXT_312' | translate }}</th>
                  @for (r of roles(); track r.idRole) {
                    <th
                      class="role-header"
                      [class.selected-role]="selectedRoleId() === r.idRole"
                      (click)="selectedRoleId.set(selectedRoleId() === r.idRole ? null : r.idRole)"
                      style="cursor:pointer;"
                      [title]="r.roleName"
                    >
                      {{ r.roleCode }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (pg of filteredPageGroups(); track pg.pageCode) {
                  <!-- Page group header -->
                  <tr class="pg-group-row">
                    <th
                      colspan="1"
                      (click)="pg.expanded = !pg.expanded"
                      style="cursor:pointer;user-select:none;"
                    >
                      <span style="margin-right:6px;font-size:9px;color:var(--s-text-3);">{{
                        pg.expanded ? '▾' : '▸'
                      }}</span>
                      <span style="font-family:var(--s-mono);color:var(--s-accent)">{{
                        pg.pageCode
                      }}</span>
                      <span style="color:var(--s-text-3);margin-left:8px;font-size:11px;">{{
                        pg.pageName
                      }}</span>
                      <span style="font-size:10px;color:var(--s-text-3);margin-left:6px;"
                        >({{ pg.pageActions.length }} actions)</span
                      >
                    </th>
                    @for (r of roles(); track r.idRole) {
                      <td style="background:var(--s-bg-2);"></td>
                    }
                  </tr>

                  @if (pg.expanded) {
                    @for (pa of pg.pageActions; track pa.idPageAction) {
                      <tr>
                        <td class="mx-row-label">
                          <div style="display:flex;align-items:center;gap:8px;">
                            <span
                              style="font-family:var(--s-mono);font-size:10px;padding:1px 6px;border-radius:4px;background:var(--s-amber-bg);color:var(--s-amber);"
                              >{{ pa.actionCode }}</span
                            >
                            <span style="font-size:11px;color:var(--s-text-2);">{{
                              pa.actionName
                            }}</span>
                          </div>
                        </td>
                        @for (r of roles(); track r.idRole) {
                          @let cell = getCell(r.idRole, pa.idPageAction);
                          <td class="mx-cell">
                            <div
                              class="mx-cell-inner"
                              [class.granted]="cell.granted"
                              [class.saving]="cell.saving"
                              [style.opacity]="
                                selectedRoleId() && selectedRoleId() !== r.idRole ? '0.35' : '1'
                              "
                              (click)="toggleMxCell(r, pa)"
                              [title]="
                                cell.granted
                                  ? 'Revoke from ' + r.roleCode
                                  : 'Grant to ' + r.roleCode
                              "
                            >
                              @if (cell.saving) {
                                <span class="spin">⏳</span>
                              } @else if (cell.granted) {
                                <span class="check">✓</span>
                              } @else {
                                <span class="dot">·</span>
                              }
                            </div>
                          </td>
                        }
                      </tr>
                    }
                  }
                }
              </tbody>
            </table>
            @if (!filteredPageGroups().length) {
              <div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_261' | translate }}</div></div>
            }
          </div>
        </div>
      }

      <!-- ── BY ROLE VIEW ─────────────────────────────────────────────── -->
      @if (viewMode() === 'role') {
        <div class="role-panel">
          <!-- Role list -->
          <div>
            <div
              style="font-size:11px;font-weight:600;color:var(--s-text-3);text-transform:uppercase;letter-spacing:.07em;padding:10px 14px;border:1px solid var(--s-border);border-bottom:none;border-radius:var(--s-radius-lg) var(--s-radius-lg) 0 0;background:var(--s-bg-3);"
            >
              {{ 'DOM_FALLBACK.TEXT_313' | translate }}
            </div>
            <div class="role-list">
              @for (r of roles(); track r.idRole) {
                <div
                  class="role-item"
                  [class.active]="selectedRoleId() === r.idRole"
                  (click)="selectRole(r.idRole)"
                >
                  <div>
                    <div style="font-family:var(--s-mono);font-size:12px;color:var(--s-accent)">
                      {{ r.roleCode }}
                    </div>
                    <div style="font-size:11px;color:var(--s-text-3)">{{ r.roleName }}</div>
                  </div>
                  <span class="perm-count">{{ roleGrantCount(r.idRole) }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Right panel -->
          <div>
            @if (!selectedRoleId()) {
              <div class="s-card">
                <div class="s-empty" style="padding:60px;">
                  <div class="s-empty-icon">🎭</div>
                  <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_314' | translate }}</div>
                </div>
              </div>
            } @else {
              <div class="s-card" style="overflow:visible;">
                <div class="s-card-header">
                  <span class="s-card-title">
                    <span style="font-family:var(--s-mono);color:var(--s-accent)">{{
                      selectedRoleName()
                    }}</span>
                    &nbsp;— {{ roleGrantCount(selectedRoleId()!) }} permissions
                  </span>
                  <div style="margin-left:auto;display:flex;gap:8px;">
                    <div class="s-search" style="max-width:160px;">
                      <span class="s-search-icon">🔍</span>
                      <input placeholder="{{ 'AUTO_INLINE_SECURITY_UI.FILTER' | translate }}" [(ngModel)]="roleViewSearch" />
                    </div>
                    <button class="s-btn s-btn-ghost s-btn-sm" (click)="expandAllRole()">
                      {{ 'DOM_FALLBACK.TEXT_289' | translate }}
                    </button>
                    <button class="s-btn s-btn-ghost s-btn-sm" (click)="collapseAllRole()">
                      {{ 'DOM_FALLBACK.TEXT_290' | translate }}
                    </button>
                  </div>
                </div>
                <div class="rp-tree">
                  @for (pg of filteredRolePageGroups(); track pg.pageCode) {
                    <div class="rp-page">
                      <div class="rp-header" (click)="pg.expanded = !pg.expanded">
                        <span class="rp-chevron" [class.open]="pg.expanded">▶</span>
                        <span style="font-size:13px">📄</span>
                        <span
                          style="font-family:var(--s-mono);font-size:12px;color:var(--s-accent);min-width:100px;flex-shrink:0;"
                          >{{ pg.pageCode }}</span
                        >
                        <span style="font-size:13px;color:var(--s-text)">{{ pg.pageName }}</span>
                        <span
                          class="rp-count"
                          [class.has]="rolePageGrantCount(pg) > 0"
                          [class.none]="!rolePageGrantCount(pg)"
                          style="margin-left:auto;flex-shrink:0;"
                        >
                          {{ rolePageGrantCount(pg) }}/{{ pg.pageActions.length }}
                        </span>
                      </div>
                      @if (pg.expanded) {
                        <div class="rp-actions">
                          @for (pa of pg.pageActions; track pa.idPageAction) {
                            @let cell = getCell(selectedRoleId()!, pa.idPageAction);
                            <div
                              class="rp-action"
                              [class.granted-action]="cell.granted"
                              (click)="toggleMxCell(getRoleById(selectedRoleId()!)!, pa)"
                              [title]="cell.granted ? 'Click to revoke' : 'Click to grant'"
                            >
                              <input
                                type="checkbox"
                                class="rp-check"
                                [checked]="cell.granted"
                                [disabled]="cell.saving"
                                readonly
                              />
                              <span class="rp-acode">{{ pa.actionCode }}</span>
                              <span class="rp-aname">{{ pa.actionName }}</span>
                              @if (cell.saving) {
                                <span
                                  style="font-size:10px;color:var(--s-text-3);animation:spin .6s linear infinite;display:inline-block"
                                  >⏳</span
                                >
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  } @empty {
                    <div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_261' | translate }}</div></div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class PermissionsMatrixComponent implements OnInit {
  private api = inject(SecuApiService);
  private router = inject(Router);
  public permissionService = inject(PermissionService);

  /** Fallback for required permission checks */
  readonly defaultPageCode = 'SECU_PERMISSIONS';

  roles = signal<SecuRoleDto[]>([]);
  allPageActions = signal<SecuPageActionDto[]>([]);
  loading = signal(true);

  viewMode = signal<ViewMode>('matrix');
  selectedRoleId = signal<number | null>(null);
  mxSearch = '';
  roleViewSearch = '';

  /** Map: `roleId_pageActionId` → MatrixCell */
  cellMap = signal(new Map<string, MatrixCell>());
  /** Map: roleId → permId[] (for counting) */
  rolePermMap = signal(new Map<number, Map<number, number>>()); // roleId → (paId → permId)

  pageGroups = signal<PageGroup[]>([]);

  totalGranted = computed(() => {
    let count = 0;
    for (const [, v] of this.cellMap()) if (v.granted) count++;
    return count;
  });

  pendingCount = computed(() => {
    let count = 0;
    for (const [, v] of this.cellMap()) if (v.saving) count++;
    return count;
  });

  filteredPageGroups = computed(() => {
    const q = this.mxSearch.trim().toLowerCase();
    if (!q) return this.pageGroups();
    return this.pageGroups()
      .map((pg) => {
        const match =
          pg.pageCode.toLowerCase().includes(q) || pg.pageName.toLowerCase().includes(q);
        const actions = match
          ? pg.pageActions
          : pg.pageActions.filter(
              (a) =>
                a.actionCode.toLowerCase().includes(q) || a.actionName.toLowerCase().includes(q),
            );
        if (match || actions.length) return { ...pg, actions, expanded: true };
        return null;
      })
      .filter(Boolean) as PageGroup[];
  });

  filteredRolePageGroups = computed(() => {
    const q = this.roleViewSearch.trim().toLowerCase();
    if (!q) return this.pageGroups();
    return this.pageGroups()
      .map((pg) => {
        const match =
          pg.pageCode.toLowerCase().includes(q) || pg.pageName.toLowerCase().includes(q);
        const actions = match
          ? pg.pageActions
          : pg.pageActions.filter(
              (a) =>
                a.actionCode.toLowerCase().includes(q) || a.actionName.toLowerCase().includes(q),
            );
        if (match || actions.length) return { ...pg, actions, expanded: true };
        return null;
      })
      .filter(Boolean) as PageGroup[];
  });

  selectedRoleName = computed(
    () => this.roles().find((r) => r.idRole === this.selectedRoleId())?.roleCode ?? '',
  );

  ngOnInit() {
    forkJoin({
      roles: this.api.getRoles({ size: 200 }).pipe(catchError(() => of(null))),
      pas: this.api.getPageActions({ size: 1000 }).pipe(catchError(() => of(null))),
    }).subscribe((r) => {
      if (r.roles) this.roles.set(r.roles.data);
      if (r.pas) this.allPageActions.set(r.pas.data);
      this.buildPageGroups(r.pas?.data ?? []);
      this.loadAllPermissions(r.roles?.data ?? []);
    });
  }

  readonly effectivePageCode = computed(() => {
    this.permissionService.loaded();
    return this.permissionService.getPageCodeForUrl(this.router.url) ?? this.defaultPageCode;
  });

  buildPageGroups(pas: SecuPageActionDto[]) {
    const map = new Map<string, PageGroup>();
    for (const pa of pas) {
      if (!map.has(pa.pageCode)) {
        map.set(pa.pageCode, {
          pageCode: pa.pageCode,
          pageName: pa.pageName,
          pageActions: [],
          expanded: true,
        });
      }
      map.get(pa.pageCode)!.pageActions.push(pa);
    }
    // Sort actions within each page
    const groups = [...map.values()].sort((a, b) => a.pageCode.localeCompare(b.pageCode));
    groups.forEach((g) => g.pageActions.sort((a, b) => a.actionCode.localeCompare(b.actionCode)));
    this.pageGroups.set(groups);
  }

  loadAllPermissions(roles: SecuRoleDto[]) {
    if (!roles.length) {
      this.loading.set(false);
      return;
    }

    forkJoin(
      roles.map((r) =>
        this.api.getRolePermissions(r.idRole, { size: 500 }).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      const cellMap = new Map<string, MatrixCell>();
      const rolePermMap = new Map<number, Map<number, number>>();

      // Init all cells as empty
      for (const r of roles) {
        rolePermMap.set(r.idRole, new Map());
        for (const pa of this.allPageActions()) {
          cellMap.set(`${r.idRole}_${pa.idPageAction}`, {
            granted: false,
            idPermission: null,
            saving: false,
          });
        }
      }

      results.forEach((res, i) => {
        const roleId = roles[i].idRole;
        res?.data
          .filter((p) => p.isActive)
          .forEach((p) => {
            const key = `${roleId}_${p.pageActionId}`;
            cellMap.set(key, { granted: true, idPermission: p.idPermission, saving: false });
            rolePermMap.get(roleId)!.set(p.pageActionId, p.idPermission);
          });
      });

      this.cellMap.set(cellMap);
      this.rolePermMap.set(rolePermMap);
      this.loading.set(false);
    });
  }

  getCell(roleId: number, paId: number): MatrixCell {
    return (
      this.cellMap().get(`${roleId}_${paId}`) ?? {
        granted: false,
        idPermission: null,
        saving: false,
      }
    );
  }

  roleGrantCount(roleId: number): number {
    let count = 0;
    for (const pa of this.allPageActions()) {
      if (this.cellMap().get(`${roleId}_${pa.idPageAction}`)?.granted) count++;
    }
    return count;
  }

  rolePageGrantCount(pg: PageGroup): number {
    const rid = this.selectedRoleId();
    if (!rid) return 0;
    return pg.pageActions.filter((pa) => this.cellMap().get(`${rid}_${pa.idPageAction}`)?.granted)
      .length;
  }

  toggleMxCell(role: SecuRoleDto, pa: SecuPageActionDto) {
    if (!this.permissionService.canUpdate(this.effectivePageCode())) return;
    const key = `${role.idRole}_${pa.idPageAction}`;
    const cell = this.cellMap().get(key);
    if (!cell || cell.saving) return;

    const newMap = new Map(this.cellMap());
    newMap.set(key, { ...cell, saving: true });
    this.cellMap.set(newMap);

    if (cell.granted && cell.idPermission) {
      this.api
        .deletePermission(cell.idPermission)
        .pipe(catchError(() => of(null)))
        .subscribe(() => {
          const m = new Map(this.cellMap());
          m.set(key, { granted: false, idPermission: null, saving: false });
          this.cellMap.set(m);
        });
    } else {
      this.api
        .createPermission({ roleId: role.idRole, pageActionId: pa.idPageAction })
        .pipe(catchError(() => of(null)))
        .subscribe((perm) => {
          const m = new Map(this.cellMap());
          if (perm) {
            m.set(key, { granted: true, idPermission: perm.idPermission, saving: false });
          } else {
            m.set(key, { ...cell, saving: false });
          }
          this.cellMap.set(m);
        });
    }
  }

  selectRole(id: number) {
    this.selectedRoleId.set(id);
  }

  getRoleById(id: number): SecuRoleDto | undefined {
    return this.roles().find((r) => r.idRole === id);
  }

  expandAllRole() {
    this.pageGroups.update((gs) => gs.map((g) => ({ ...g, expanded: true })));
  }

  collapseAllRole() {
    this.pageGroups.update((gs) => gs.map((g) => ({ ...g, expanded: false })));
  }
}

