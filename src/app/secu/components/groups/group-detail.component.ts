import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, forkJoin } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import {
  SecuGroupDto,
  SecuGroupRoleDto,
  SecuRoleDto,
  SecuPageActionDto,
  SecuPermissionDto,
  SecuUserDto,
} from '../../models/secu.models';
import { TranslatePipe } from '@ngx-translate/core';

type Tab = 'info' | 'roles' | 'permissions' | 'members';

interface PagePermNode {
  pageCode: string;
  pageName: string;
  idPage: number;
  actions: { idPageAction: number; actionCode: string; actionName: string; fromRole: string }[];
  children: PagePermNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  styles: [
    `
      .tab-body {
        padding: 0;
      }
      .row-adding {
        background: rgba(79, 142, 247, 0.06);
      }
      .add-select {
        background: var(--s-bg-3);
        border: 1px solid var(--s-accent);
        border-radius: 6px;
        color: var(--s-text);
        font-family: var(--s-font);
        font-size: 13px;
        padding: 5px 10px;
        outline: none;
        min-width: 240px;
      }
      /* perm tree */
      .eff-tree {
        overflow-y: auto;
        max-height: 58vh;
      }
      .pg-row {
        border-bottom: 1px solid var(--s-border);
      }
      .pg-row:last-child {
        border-bottom: none;
      }
      .pg-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 18px;
        cursor: pointer;
        transition: background 0.13s;
        user-select: none;
      }
      .pg-header:hover {
        background: var(--s-bg-3);
      }
      .pg-chevron {
        font-size: 9px;
        color: var(--s-text-3);
        transition: transform 0.15s;
        width: 14px;
        text-align: center;
        flex-shrink: 0;
      }
      .pg-chevron.open {
        transform: rotate(90deg);
      }
      .pg-actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 2px;
        padding: 4px 18px 12px 46px;
        background: var(--s-bg);
      }
      .pa-chip {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 5px 10px;
        border-radius: 6px;
        background: var(--s-bg-3);
      }
      .ac {
        font-family: var(--s-mono);
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--s-accent-glow);
        color: var(--s-accent);
      }
      .from-role {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--s-purple-bg);
        color: var(--s-purple);
        font-family: var(--s-mono);
        margin-left: auto;
        flex-shrink: 0;
      }
      .pg-children {
        padding-left: 18px;
        border-left: 1px solid var(--s-border);
        margin-left: 22px;
      }
      .count-pill {
        font-size: 11px;
        padding: 1px 8px;
        border-radius: 999px;
      }
      .count-pill.blue {
        background: var(--s-accent-glow);
        color: var(--s-accent);
      }
    `,
  ],
  template: `
    <div style="margin-bottom:16px;">
      <a routerLink="../" style="color:var(--s-text-2);font-size:13px;text-decoration:none"
        >{{ 'AUTO_INLINE_SECURITY_UI.BACK_TO_GROUPS' | translate }}</a
      >
    </div>

    @if (loading()) {
      <div class="s-empty"><div class="s-empty-text">{{ 'AUTO_INLINE_SECURITY_UI.LOADING' | translate }}</div></div>
    } @else if (!group()) {
      <div class="s-alert error">{{ 'DOM_FALLBACK.TEXT_246' | translate }}</div>
    } @else {
      <!-- Header -->
      <div class="s-page-header">
        <div style="display:flex;align-items:center;gap:14px;">
          <div
            style="width:46px;height:46px;border-radius:10px;background:var(--s-purple-bg);border:2px solid var(--s-purple);display:grid;place-items:center;font-size:18px;font-weight:700;color:var(--s-purple);flex-shrink:0;"
          >
            {{ group()!.groupCode[0] }}
          </div>
          <div>
            <h1 class="s-page-title" style="font-family:var(--s-mono);color:var(--s-purple);">
              {{ group()!.groupCode }}
            </h1>
            <p class="s-page-subtitle">{{ group()!.groupName }}</p>
          </div>
        </div>
        <span
          class="s-badge"
          [class.active]="group()!.isActive"
          [class.inactive]="!group()!.isActive"
        >
          {{ group()!.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <!-- Stats -->
      <div class="s-stats-grid" style="margin-bottom:20px;">
        <div class="s-stat-card">
          <div class="s-stat-icon purple">�­</div>
          <div>
            <div class="s-stat-value">{{ groupRoles().length }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_309' | translate }}</div>
          </div>
        </div>
        <div class="s-stat-card">
          <div class="s-stat-icon blue">�</div>
          <div>
            <div class="s-stat-value">{{ effectivePermCount() }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_247' | translate }}</div>
          </div>
        </div>
        <div class="s-stat-card">
          <div class="s-stat-icon green">�¤</div>
          <div>
            <div class="s-stat-value">{{ memberCount() }}</div>
            <div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_250' | translate }}</div>
          </div>
        </div>
      </div>

      <!-- Card + Tabs -->
      <div class="s-card" style="overflow:visible;">
        <div class="s-tabs">
          <div class="s-tab" [class.active]="tab() === 'info'" (click)="tab.set('info')">
            {{ 'AUTO_INLINE_SECURITY_UI.INFO' | translate }}
          </div>
          <div class="s-tab" [class.active]="tab() === 'roles'" (click)="tab.set('roles')">
            {{ 'AUTO_INLINE_SECURITY_UI.ROLES' | translate }} <span class="s-tab-count">{{ groupRoles().length }}</span>
          </div>
          <div
            class="s-tab"
            [class.active]="tab() === 'permissions'"
            (click)="tab.set('permissions')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.EFFECTIVE_PERMISSIONS' | translate }} <span class="s-tab-count">{{ effectivePermCount() }}</span>
          </div>
          <div class="s-tab" [class.active]="tab() === 'members'" (click)="tab.set('members')">
            {{ 'AUTO_INLINE_SECURITY_UI.MEMBERS' | translate }} <span class="s-tab-count">{{ memberCount() }}</span>
          </div>
        </div>

        <!-- ── INFO ──────────────────────────────────────────────────── -->
        @if (tab() === 'info') {
          <div class="s-card-body">
            <div class="s-detail-grid">
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_251' | translate }}</label>
                <div class="val" style="font-family:var(--s-mono);color:var(--s-text-3)">
                  {{ group()!.idGroup }}
                </div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_035' | translate }}</label>
                <div class="val" style="font-family:var(--s-mono);color:var(--s-purple)">
                  {{ group()!.groupCode }}
                </div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_043' | translate }}</label>
                <div class="val">{{ group()!.groupName }}</div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'AUTO_INLINE_SECURITY_UI.APP' | translate }}</label>
                <div class="val" style="font-family:var(--s-mono);font-size:12px">
                  {{ group()!.appCode }}
                </div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</label>
                <span
                  class="s-badge"
                  [class.active]="group()!.isActive"
                  [class.inactive]="!group()!.isActive"
                >
                  {{ group()!.isActive ? 'Active' : 'Inactive' }}</span
                >
              </div>
              <div class="s-detail-field">
                <label>{{ 'SECU.USERS.COLUMNS.CREATED' | translate }}</label>
                <div class="val">{{ group()!.createdAt | date: 'dd/MM/yyyy HH:mm' }}</div>
              </div>
            </div>
          </div>
        }

        <!-- ── ROLES ─────────────────────────────────────────────────── -->
        @if (tab() === 'roles') {
          <div class="tab-body">
            <div class="s-toolbar" style="justify-content:space-between;">
              <span style="font-size:13px;font-weight:500;color:var(--s-text)">{{ 'DOM_FALLBACK.TEXT_252' | translate }}</span>
              <button
                class="s-btn s-btn-primary s-btn-sm"
                (click)="startAddRole()"
                [disabled]="addingRole()"
              >
                {{ 'DOM_FALLBACK.TEXT_253' | translate }}
              </button>
            </div>
            <div class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th>{{ 'SECU.PERMISSIONS.ROLE_LABEL' | translate }}</th>
                    <th>{{ 'AUTO_INLINE_SECURITY_UI.APP' | translate }}</th>
                    <th>{{ 'DOM_FALLBACK.TEXT_254' | translate }}</th>
                    <th>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                    <th style="width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  @if (addingRole()) {
                    <tr class="row-adding">
                      <td colspan="4" style="padding:10px 14px;">
                        <select class="add-select" [(ngModel)]="addRoleId">
                          <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.SELECT_A_ROLE' | translate }}</option>
                          @for (r of availableRoles(); track r.idRole) {
                            <option [ngValue]="r.idRole">
                              {{ r.roleCode }} — {{ r.roleName }}
                            </option>
                          }
                          @if (!availableRoles().length) {
                            <option disabled>{{ 'DOM_FALLBACK.TEXT_256' | translate }}</option>
                          }
                        </select>
                      </td>
                      <td style="padding:10px 14px;">
                        <div style="display:flex;gap:4px;">
                          <button
                            class="s-btn s-btn-primary s-btn-sm"
                            (click)="confirmAddRole()"
                            [disabled]="!addRoleId"
                          >
                            {{ 'DOM_FALLBACK.TEXT_193' | translate }}
                          </button>
                          <button class="s-btn s-btn-ghost s-btn-sm" (click)="cancelAddRole()">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @for (gr of groupRoles(); track gr.idGroupRole) {
                    <tr>
                      <td>
                        <div style="display:flex;flex-direction:column;gap:2px;">
                          <span class="mono" style="color:var(--s-accent)">{{ gr.roleCode }}</span>
                          <span style="font-size:11px;color:var(--s-text-3)">{{
                            gr.roleName
                          }}</span>
                        </div>
                      </td>
                      <td style="font-size:11px;color:var(--s-text-3);font-family:var(--s-mono)">
                        {{ group()!.appCode }}
                      </td>
                      <td style="font-size:12px;color:var(--s-text-2)">
                        {{ gr.grantedAt ? (gr.grantedAt | date: 'dd/MM/yy HH:mm') : '—' }}
                      </td>
                      <td>
                        <span
                          class="s-badge"
                          [class.active]="gr.isActive"
                          [class.inactive]="!gr.isActive"
                          >{{ gr.isActive ? 'Active' : 'Inactive' }}</span
                        >
                      </td>
                      <td>
                        <button
                          class="s-btn-icon danger"
                          (click)="askRemoveRole(gr)"
                          title="{{ 'AUTO_SECURITY_UI.REMOVE' | translate }}"
                        >
                          �—‘
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    @if (!addingRole()) {
                      <tr>
                        <td colspan="5">
                          <div class="s-empty">
                            <div class="s-empty-icon">�­</div>
                            <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_257' | translate }}</div>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ── EFFECTIVE PERMISSIONS ──────────────────────────────────── -->
        @if (tab() === 'permissions') {
          <div class="tab-body">
            <div class="s-toolbar" style="justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-size:13px;font-weight:500;color:var(--s-text)"
                  >{{ 'DOM_FALLBACK.TEXT_249' | translate }}</span
                >
                <span style="font-size:11px;color:var(--s-text-3);margin-left:8px;"
                  >{{ 'DOM_FALLBACK.TEXT_258' | translate }}</span
                >
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <div class="s-search" style="max-width:200px;">
                  <span class="s-search-icon">�</span>
                  <input placeholder="{{ 'AUTO_INLINE_SECURITY_UI.FILTER_PAGES' | translate }}" [(ngModel)]="permSearch" />
                </div>
                <button class="s-btn s-btn-ghost s-btn-sm" (click)="expandAll()">{{ 'DOM_FALLBACK.TEXT_289' | translate }}</button>
                <button class="s-btn s-btn-ghost s-btn-sm" (click)="collapseAll()">
                  {{ 'DOM_FALLBACK.TEXT_290' | translate }}
                </button>
              </div>
            </div>

            @if (!groupRoles().length) {
              <div class="s-empty" style="padding:48px;">
                <div class="s-empty-icon">�</div>
                <div class="s-empty-text">
                  {{ 'DOM_FALLBACK.TEXT_259' | translate }}
                </div>
              </div>
            } @else if (permTreeLoading()) {
              <div class="s-empty"><div class="s-empty-text">{{ 'AUTO_INLINE_SECURITY_UI.LOADING_PERMISSIONS' | translate }}</div></div>
            } @else {
              <div class="eff-tree">
                @for (node of filteredPermTree(); track node.idPage) {
                  <ng-container
                    *ngTemplateOutlet="pgNodeTpl; context: { $implicit: node }"
                  ></ng-container>
                } @empty {
                  <div class="s-empty" style="padding:40px;">
                    <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_261' | translate }}</div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ── MEMBERS ────────────────────────────────────────────────── -->
        @if (tab() === 'members') {
          <div class="tab-body">
            <div class="s-toolbar">
              <span style="font-size:13px;font-weight:500;color:var(--s-text)"
                >{{ 'DOM_FALLBACK.TEXT_262' | translate }}</span
              >
              <div class="s-search" style="margin-left:auto;max-width:220px;">
                <span class="s-search-icon">�</span>
                <input placeholder="{{ 'AUTO_INLINE_SECURITY_UI.SEARCH_MEMBERS' | translate }}" [(ngModel)]="memberSearch" />
              </div>
            </div>
            <div class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th>{{ 'NOTIF.USERS.COLUMNS.USER' | translate }}</th>
                    <th>{{ 'NOTIF.USERS.COLUMNS.EMAIL' | translate }}</th>
                    <th>{{ 'DOM_FALLBACK.TEXT_254' | translate }}</th>
                    <th>{{ 'DOM_FALLBACK.TEXT_355' | translate }}</th>
                    <th>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of filteredMembers(); track m.idUser) {
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div
                            style="width:28px;height:28px;border-radius:50%;background:var(--s-accent-glow);color:var(--s-accent);display:grid;place-items:center;font-size:11px;font-weight:600;flex-shrink:0;"
                          >
                            {{ m.fullName[0].toUpperCase() }}
                          </div>
                          <div>
                            <div style="font-size:13px;">{{ m.fullName }}</div>
                            <div
                              style="font-family:var(--s-mono);font-size:11px;color:var(--s-text-3)"
                            >
                              {{ m.username }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style="font-size:12px;color:var(--s-text-2)">{{ m.email ?? '—' }}</td>
                      <td style="font-size:12px;color:var(--s-text-2)">—</td>
                      <td style="font-size:12px;color:var(--s-text-2)">—</td>
                      <td>
                        <span
                          class="s-badge"
                          [class.active]="m.isActive"
                          [class.inactive]="!m.isActive"
                          >{{ m.isActive ? 'Active' : 'Inactive' }}</span
                        >
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5">
                        <div class="s-empty">
                          <div class="s-empty-icon">�¥</div>
                          <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_263' | translate }}</div>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    }

    <!-- Page node template -->
    <ng-template #pgNodeTpl let-node>
      <div class="pg-row">
        <div class="pg-header" (click)="node.expanded = !node.expanded">
          <span class="pg-chevron" [class.open]="node.expanded">�–¶</span>
          <span style="font-size:13px">📄</span>
          <span
            style="font-family:var(--s-mono);font-size:12px;color:var(--s-accent);min-width:100px;flex-shrink:0;"
            >{{ node.pageCode }}</span
          >
          <span style="font-size:13px;color:var(--s-text)">{{ node.pageName }}</span>
          <span class="count-pill blue" style="margin-left:auto;flex-shrink:0;"
            >{{ node.actions.length }} permission{{ node.actions.length !== 1 ? 's' : '' }}</span
          >
        </div>
        @if (node.expanded) {
          @if (node.actions.length) {
            <div class="pg-actions-grid">
              @for (a of node.actions; track a.idPageAction) {
                <div class="pa-chip">
                  <span class="ac">{{ a.actionCode }}</span>
                  <span
                    style="font-size:11px;color:var(--s-text-2);flex:1;overflow:hidden;text-overflow:ellipsis;"
                    >{{ a.actionName }}</span
                  >
                  <span class="from-role">{{ a.fromRole }}</span>
                </div>
              }
            </div>
          }
          @if (node.children.length) {
            <div class="pg-children">
              @for (child of node.children; track child.idPage) {
                <ng-container
                  *ngTemplateOutlet="pgNodeTpl; context: { $implicit: child }"
                ></ng-container>
              }
            </div>
          }
        }
      </div>
    </ng-template>

    <!-- Confirm modal -->
    @if (confirmModal()) {
      <div class="s-modal-backdrop" (click)="confirmModal.set(null)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ confirmModal()!.title }}</span>
            <button class="s-btn-icon" (click)="confirmModal.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p
              style="font-size:13px;color:var(--s-text-2);"
              [innerHTML]="confirmModal()!.message"
            ></p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="confirmModal.set(null)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="runConfirm()">{{ 'DOM_FALLBACK.TEXT_375' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class GroupDetailComponent implements OnInit {
  private api = inject(SecuApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  permTreeLoading = signal(false);
  group = signal<SecuGroupDto | null>(null);
  groupRoles = signal<SecuGroupRoleDto[]>([]);
  allRoles = signal<SecuRoleDto[]>([]);
  members = signal<SecuUserDto[]>([]);

  tab = signal<Tab>('info');
  addingRole = signal(false);
  addRoleId: number | null = null;

  permTree = signal<PagePermNode[]>([]);
  permSearch = '';
  memberSearch = '';

  confirmModal = signal<{ title: string; message: string; onConfirm: () => void } | null>(null);

  effectivePermCount = computed(() => this.countTree(this.permTree()));
  memberCount = computed(() => this.members().length);

  availableRoles = computed(() => {
    const assigned = new Set(this.groupRoles().map((r) => r.roleId));
    return this.allRoles().filter((r) => !assigned.has(r.idRole) && r.isActive);
  });

  filteredPermTree = computed(() => {
    const q = this.permSearch.trim().toLowerCase();
    if (!q) return this.permTree();
    return this.filterTree(this.permTree(), q);
  });

  filteredMembers = computed(() => {
    const q = this.memberSearch.trim().toLowerCase();
    if (!q) return this.members();
    return this.members().filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        (m.email ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      groups: this.api.getGroups({ size: 200 }).pipe(catchError(() => of(null))),
      groupRoles: this.api.getGroupRoles(id, { size: 200 }).pipe(catchError(() => of(null))),
      allRoles: this.api.getRoles({ size: 200 }).pipe(catchError(() => of(null))),
      users: this.api.getUsers({ size: 500 }).pipe(catchError(() => of(null))),
    }).subscribe((r) => {
      if (r.groups) this.group.set(r.groups.data.find((g) => g.idGroup === id) ?? null);
      if (r.groupRoles) this.groupRoles.set(r.groupRoles.data);
      if (r.allRoles) this.allRoles.set(r.allRoles.data);

      // Derive members: users whose groups include this group
      // API has getUserGroups per user — instead we load all users and their groups lazily
      // For now surface all users (server should filter by group — use search note)
      if (r.users) {
        // We filter client-side by checking which users have this group via the getUsers endpoint
        // Since no direct "group members" endpoint exists, we load and filter
        this.loadMembers(id, r.users.data);
      }

      this.loadEffectivePerms(r.groupRoles?.data ?? []);
      this.loading.set(false);
    });
  }

  loadMembers(groupId: number, allUsers: SecuUserDto[]) {
    if (!allUsers.length) return;
    // Load group memberships for each user in batches — sample first 100 for performance
    const sample = allUsers.slice(0, 100);
    forkJoin(
      sample.map((u) =>
        this.api.getUserGroups(u.idUser, { size: 200 }).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      const members: SecuUserDto[] = [];
      results.forEach((res, i) => {
        if (res?.data.some((ug) => ug.groupId === groupId && ug.isActive)) {
          members.push(sample[i]);
        }
      });
      this.members.set(members);
    });
  }

  loadEffectivePerms(groupRoles: SecuGroupRoleDto[]) {
    if (!groupRoles.length) {
      this.permTree.set([]);
      return;
    }
    this.permTreeLoading.set(true);

    forkJoin(
      groupRoles.map((gr) =>
        this.api.getRolePermissions(gr.roleId, { size: 500 }).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      // Map paId → { actionCode, actionName, pageCode, pageName, idPage, fromRole }
      const paMap = new Map<
        number,
        {
          idPageAction: number;
          pageCode: string;
          pageName: string;
          idPage: number;
          actionCode: string;
          actionName: string;
          fromRole: string;
        }
      >();
      results.forEach((res, i) => {
        const roleName = groupRoles[i].roleCode;
        res?.data
          .filter((p) => p.isActive)
          .forEach((p) => {
            if (!paMap.has(p.pageActionId)) {
              paMap.set(p.pageActionId, {
                idPageAction: p.pageActionId,
                pageCode: p.pageCode,
                pageName: p.pageName,
                idPage: p.pageActionId, // use as page key
                actionCode: p.actionCode,
                actionName: p.actionName,
                fromRole: roleName,
              });
            }
          });
      });

      // Group by pageCode
      const byPage = new Map<
        string,
        {
          pageCode: string;
          pageName: string;
          actions: typeof paMap extends Map<any, infer V> ? V[] : never[];
        }
      >();
      for (const entry of paMap.values()) {
        if (!byPage.has(entry.pageCode))
          byPage.set(entry.pageCode, {
            pageCode: entry.pageCode,
            pageName: entry.pageName,
            actions: [] as any,
          });
        (byPage.get(entry.pageCode)! as any).actions.push(entry);
      }

      const nodes: PagePermNode[] = [...byPage.values()]
        .map((pg, i) => ({
          idPage: i,
          pageCode: pg.pageCode,
          pageName: pg.pageName,
          actions: (pg as any).actions,
          children: [],
          expanded: false,
          parentId: null,
          sortOrder: null,
        }))
        .sort((a, b) => a.pageCode.localeCompare(b.pageCode));

      this.permTree.set(nodes);
      this.permTreeLoading.set(false);
    });
  }

  countTree(nodes: PagePermNode[]): number {
    return nodes.reduce((s, n) => s + n.actions.length + this.countTree(n.children), 0);
  }

  filterTree(nodes: PagePermNode[], q: string): PagePermNode[] {
    return nodes
      .map((n) => {
        const match = n.pageCode.toLowerCase().includes(q) || n.pageName.toLowerCase().includes(q);
        const children = this.filterTree(n.children, q);
        const actions = match
          ? n.actions
          : n.actions.filter(
              (a) =>
                a.actionCode.toLowerCase().includes(q) || a.actionName.toLowerCase().includes(q),
            );
        if (match || children.length || actions.length)
          return { ...n, actions, children, expanded: true };
        return null;
      })
      .filter(Boolean) as PagePermNode[];
  }

  expandAll() {
    const expand = (ns: PagePermNode[]) =>
      ns.forEach((n) => {
        n.expanded = true;
        expand(n.children);
      });
    expand(this.permTree());
    this.permTree.set([...this.permTree()]);
  }

  collapseAll() {
    const collapse = (ns: PagePermNode[]) =>
      ns.forEach((n) => {
        n.expanded = false;
        collapse(n.children);
      });
    collapse(this.permTree());
    this.permTree.set([...this.permTree()]);
  }

  startAddRole() {
    this.addRoleId = null;
    this.addingRole.set(true);
  }
  cancelAddRole() {
    this.addingRole.set(false);
    this.addRoleId = null;
  }

  confirmAddRole() {
    if (!this.addRoleId) return;
    const id = +this.route.snapshot.paramMap.get('id')!;
    const newIds = [...new Set([...this.groupRoles().map((r) => r.roleId), this.addRoleId])];
    this.api
      .assignGroupRoles(id, { roleIds: newIds })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.cancelAddRole();
        this.reload(id);
      });
  }

  askRemoveRole(gr: SecuGroupRoleDto) {
    this.confirmModal.set({
      title: 'Remove Role',
      message: `Remove role <strong style="color:var(--s-accent);font-family:var(--s-mono)">${gr.roleCode}</strong> from this group?<br><br>
        <span style="font-size:12px;color:var(--s-amber);">�  Users in this group will lose permissions granted by this role.</span>`,
      onConfirm: () => {
        const id = +this.route.snapshot.paramMap.get('id')!;
        const newIds = this.groupRoles()
          .filter((r) => r.idGroupRole !== gr.idGroupRole)
          .map((r) => r.roleId);
        this.api
          .assignGroupRoles(id, { roleIds: newIds })
          .pipe(catchError(() => of(null)))
          .subscribe(() => this.reload(id));
      },
    });
  }

  reload(id: number) {
    this.api.getGroupRoles(id, { size: 200 }).subscribe((r) => {
      this.groupRoles.set(r.data);
      this.loadEffectivePerms(r.data);
    });
  }

  runConfirm() {
    this.confirmModal()?.onConfirm();
    this.confirmModal.set(null);
  }
}

