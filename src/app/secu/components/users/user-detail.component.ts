import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, forkJoin } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { TranslatePipe } from '@ngx-translate/core';
import {
  SecuUserDto,
  SecuRoleDto,
  SecuUserGroupDto,
  SecuUserPermissionDto,
  SecuGroupDto,
  SecuPageActionDto,
  SecuPageDto,
} from '../../models/secu.models';

const PAGE_CODE = 'USERS_LIST';

type Tab = 'info' | 'groups' | 'roles' | 'permissions';

interface PermNode {
  idPageAction: number;
  pageCode: string;
  pageName: string;
  actionCode: string;
  actionName: string;
  idPage: number;
  checked: boolean;
  /** inherited via role or group → disabled */
  inherited: boolean;
  inheritedReason: string;
}

interface PageNode {
  idPage: number;
  pageCode: string;
  pageName: string;
  parentId: number | null;
  sortOrder: number | null;
  actions: PermNode[];
  children: PageNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PermActionDirective, TranslatePipe],
  styles: [
    `
      .tab-body {
        padding: 0;
      }
      .row-adding {
        background: rgba(79, 142, 247, 0.06);
      }
      .role-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      /* ── Permission tree ── */
      .perm-tree {
        overflow-y: auto;
        max-height: 60vh;
      }
      .page-node {
        border-bottom: 1px solid var(--s-border);
      }
      .page-node:last-child {
        border-bottom: none;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        cursor: pointer;
        transition: background 0.14s;
        user-select: none;
      }
      .page-header:hover {
        background: var(--s-bg-3);
      }

      .page-chevron {
        font-size: 9px;
        color: var(--s-text-3);
        transition: transform 0.15s;
        width: 14px;
        text-align: center;
        flex-shrink: 0;
      }
      .page-chevron.open {
        transform: rotate(90deg);
      }

      .page-actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 2px;
        padding: 4px 18px 12px 46px;
        background: var(--s-bg);
      }

      .action-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 6px;
        transition: background 0.13s;
        cursor: pointer;
      }
      .action-item:hover:not(.is-inherited) {
        background: var(--s-bg-3);
      }
      .action-item.is-inherited {
        cursor: default;
      }

      .action-check {
        width: 14px;
        height: 14px;
        accent-color: var(--s-accent);
        flex-shrink: 0;
        cursor: pointer;
      }
      .action-check:disabled {
        cursor: default;
      }
      .action-code {
        font-family: var(--s-mono);
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--s-amber-bg);
        color: var(--s-amber);
        flex-shrink: 0;
      }
      .action-name {
        font-size: 12px;
        color: var(--s-text-2);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .inherited-tag {
        font-size: 9px;
        padding: 1px 5px;
        background: var(--s-bg-4);
        border: 1px solid var(--s-border);
        color: var(--s-text-3);
        border-radius: 4px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .action-item.is-inherited .action-name {
        text-decoration: line-through;
        opacity: 0.5;
      }

      .page-children {
        padding-left: 18px;
        border-left: 1px solid var(--s-border);
        margin-left: 22px;
      }

      .perm-save-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-top: 1px solid var(--s-border);
        background: var(--s-bg-2);
        position: sticky;
        bottom: 0;
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

      /* page count pills */
      .count-pill {
        font-size: 11px;
        padding: 1px 8px;
        border-radius: 999px;
        margin-left: auto;
        display: inline-block;
      }
      .count-pill.granted {
        background: var(--s-accent-glow);
        color: var(--s-accent);
      }
      .count-pill.inherited {
        background: var(--s-bg-4);
        color: var(--s-text-3);
        border: 1px solid var(--s-border);
      }
    `,
  ],
  template: `
    <div style="margin-bottom:16px;">
      <a routerLink="../" style="color:var(--s-text-2);font-size:13px;text-decoration:none"
        >{{ 'AUTO_INLINE_SECURITY_UI.BACK_TO_USERS' | translate }}</a
      >
    </div>

    @if (loading()) {
      <div class="s-empty"><div class="s-empty-text">{{ 'AUTO_INLINE_SECURITY_UI.LOADING' | translate }}</div></div>
    } @else if (!user()) {
      <div class="s-alert error">{{ 'DOM_FALLBACK.TEXT_342' | translate }}</div>
    } @else {
      <!-- ─── User Header ─────────────────────────────────────────────── -->
      <div class="s-page-header">
        <div style="display:flex;align-items:center;gap:14px;">
          <div
            style="width:48px;height:48px;border-radius:50%;background:var(--s-accent-glow);border:2px solid var(--s-accent);display:grid;place-items:center;font-size:20px;font-weight:700;color:var(--s-accent);flex-shrink:0;"
          >
            {{ user()!.fullName[0].toUpperCase() }}
          </div>
          <div>
            <h1 class="s-page-title">{{ user()!.fullName }}</h1>
            <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
              <span style="font-family:var(--s-mono);font-size:12px;color:var(--s-text-3)">{{
                user()!.username
              }}</span>
              @if (user()!.email) {
                <span style="color:var(--s-border-2)">�·</span>
                <span style="font-size:12px;color:var(--s-text-2)">{{ user()!.email }}</span>
              }
            </div>
          </div>
        </div>
        <span
          class="s-badge"
          [class.active]="user()!.isActive"
          [class.inactive]="!user()!.isActive"
        >
          {{ user()!.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <!-- ─── Tabs ───────────────────────────────────────────────────── -->
      <div class="s-card" style="overflow:visible;">
        <div class="s-tabs">
          <div class="s-tab" [class.active]="tab() === 'info'" (click)="tab.set('info')">
            {{ 'AUTO_INLINE_SECURITY_UI.INFO' | translate }}
          </div>
          <div class="s-tab" [class.active]="tab() === 'groups'" (click)="tab.set('groups')">
            {{ 'AUTO_INLINE_SECURITY_UI.GROUPS' | translate }}
            <span class="s-tab-count">{{ userGroups().length }}</span>
          </div>
          <div class="s-tab" [class.active]="tab() === 'roles'" (click)="tab.set('roles')">
            {{ 'AUTO_INLINE_SECURITY_UI.DIRECT_ROLES' | translate }}
            <span class="s-tab-count">{{ userDirectRoles().length }}</span>
          </div>
          <div
            class="s-tab"
            [class.active]="tab() === 'permissions'"
            (click)="tab.set('permissions')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.PERMISSIONS' | translate }}
            <span class="s-tab-count"
              >{{ directPermCount()
              }}<span style="color:var(--s-text-3)">/{{ totalPermCount() }}</span></span
            >
          </div>
        </div>

        <!-- �� INFO ���������������������������������������������������� -->
        @if (tab() === 'info') {
          <div class="s-card-body">
            <div class="s-detail-grid">
              <div class="s-detail-field">
                <label>{{ 'AUTO_SECURITY_UI.USER_ID' | translate }}</label>
                <div
                  class="val"
                  style="font-family:var(--s-mono);font-size:11px;color:var(--s-text-3)"
                >
                  {{ user()!.idUser }}
                </div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_344' | translate }}</label>
                <div class="val" style="font-family:var(--s-mono)">{{ user()!.username }}</div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_345' | translate }}</label>
                <div class="val">{{ user()!.fullName }}</div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'NOTIF.USERS.COLUMNS.EMAIL' | translate }}</label>
                <div class="val">{{ user()!.email ?? '—' }}</div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_346' | translate }}</label>
                <div class="val" style="font-family:var(--s-mono)">
                  {{ user()!.externalId ?? '—' }}
                </div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</label>
                <span
                  class="s-badge"
                  [class.active]="user()!.isActive"
                  [class.inactive]="!user()!.isActive"
                >
                  {{ user()!.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="s-detail-field">
                <label>{{ 'SECU.USERS.COLUMNS.CREATED' | translate }}</label>
                <div class="val">{{ user()!.createdAt | date: 'dd/MM/yyyy HH:mm' }}</div>
              </div>
              <div class="s-detail-field">
                <label>{{ 'DOM_FALLBACK.TEXT_347' | translate }}</label>
                <div class="val">
                  {{ user()!.updatedAt ? (user()!.updatedAt | date: 'dd/MM/yyyy HH:mm') : '—' }}
                </div>
              </div>
            </div>

            <!-- Effective summary -->
            <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--s-border);">
              <div
                style="font-size:11px;font-weight:600;color:var(--s-text-3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;"
              >
                {{ 'DOM_FALLBACK.TEXT_348' | translate }}
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;">
                  <span style="font-size:12px;color:var(--s-text-2);min-width:80px;flex-shrink:0;"
                    >{{ 'SECU.GROUPS.TITLE' | translate }}</span
                  >
                  <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    @for (g of userGroups(); track g.groupId) {
                      <span class="s-chip" style="color:var(--s-purple)">{{ g.groupCode }}</span>
                    }
                    @if (!userGroups().length) {
                      <span style="font-size:12px;color:var(--s-text-3)">{{ 'DOM_FALLBACK.TEXT_350' | translate }}</span>
                    }
                  </div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;">
                  <span style="font-size:12px;color:var(--s-text-2);min-width:80px;flex-shrink:0;"
                    >{{ 'DOM_FALLBACK.TEXT_349' | translate }}</span
                  >
                  <div style="display:flex;flex-wrap:wrap;gap:4px;">
                    @for (r of allEffectiveRoles(); track r.idRole) {
                      <span class="s-chip" style="color:var(--s-accent)">{{ r.roleCode }}</span>
                    }
                    @if (!allEffectiveRoles().length) {
                      <span style="font-size:12px;color:var(--s-text-3)">{{ 'DOM_FALLBACK.TEXT_350' | translate }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- �� GROUPS ���������������������������������������������������� -->
        @if (tab() === 'groups') {
          <div class="tab-body">
            <div class="s-toolbar" style="justify-content:space-between;">
              <div>
                <span style="font-size:13px;font-weight:500;color:var(--s-text)"
                  >{{ 'DOM_FALLBACK.TEXT_351' | translate }}</span
                >
                <span style="font-size:11px;color:var(--s-text-3);margin-left:8px;">
                  {{ 'DOM_FALLBACK.TEXT_352' | translate }}
                </span>
              </div>
              <button
                class="s-btn s-btn-primary s-btn-sm"
                [permAction]="permissionService.canUpdate(PAGE_CODE)"
                (click)="startAddGroup()"
                [disabled]="addingGroup()"
              >
                {{ 'DOM_FALLBACK.TEXT_353' | translate }}
              </button>
            </div>

            <div class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th style="width:180px">{{ 'SECU.DATA_FILTERS.COLUMNS.GROUP' | translate }}</th>
                    <th>{{ 'DOM_FALLBACK.TEXT_354' | translate }}</th>
                    <th style="width:120px">{{ 'DOM_FALLBACK.TEXT_254' | translate }}</th>
                    <th style="width:100px">{{ 'DOM_FALLBACK.TEXT_355' | translate }}</th>
                    <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                    <th style="width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Add row -->
                  @if (addingGroup()) {
                    <tr class="row-adding">
                      <td colspan="5" style="padding:10px 14px;">
                        <select class="add-select" [(ngModel)]="addGroupId">
                          <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.SELECT_A_GROUP_TO_ADD' | translate }}</option>
                          @for (g of availableGroupsToAdd(); track g.idGroup) {
                            <option [ngValue]="g.idGroup">
                              {{ g.groupCode }} — {{ g.groupName }}
                            </option>
                          }
                          @if (!availableGroupsToAdd().length) {
                            <option disabled>{{ 'DOM_FALLBACK.TEXT_357' | translate }}</option>
                          }
                        </select>
                      </td>
                      <td style="padding:10px 14px;">
                        <div style="display:flex;gap:4px;">
                          <button
                            class="s-btn s-btn-primary s-btn-sm"
                            (click)="confirmAddGroup()"
                            [disabled]="!addGroupId"
                          >
                            {{ 'DOM_FALLBACK.TEXT_193' | translate }}
                          </button>
                          <button class="s-btn s-btn-ghost s-btn-sm" (click)="cancelAddGroup()">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  }

                  @for (ug of userGroups(); track ug.idUserGroup) {
                    <tr>
                      <td>
                        <div style="display:flex;flex-direction:column;gap:2px;">
                          <span class="mono" style="color:var(--s-purple);font-weight:500;">{{
                            ug.groupCode
                          }}</span>
                          <span style="font-size:11px;color:var(--s-text-3)">{{
                            ug.groupName
                          }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="role-chips">
                          @for (r of rolesOfGroup(ug.groupId); track r.idRole) {
                            <span class="s-chip" style="color:var(--s-accent);font-size:10px;">{{
                              r.roleCode
                            }}</span>
                          }
                          @if (!rolesOfGroup(ug.groupId).length) {
                            <span style="font-size:11px;color:var(--s-text-3)">—</span>
                          }
                        </div>
                      </td>
                      <td style="font-size:12px;color:var(--s-text-2)">
                        {{ ug.grantedAt ? (ug.grantedAt | date: 'dd/MM/yy HH:mm') : '—' }}
                      </td>
                      <td style="font-size:12px;color:var(--s-text-2)">
                        {{ ug.expiresAt ? (ug.expiresAt | date: 'dd/MM/yy') : '—' }}
                      </td>
                      <td>
                        <span
                          class="s-badge"
                          [class.active]="ug.isActive"
                          [class.inactive]="!ug.isActive"
                        >
                          {{ ug.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <button
                          class="s-btn-icon danger"
                          [permAction]="permissionService.canUpdate(PAGE_CODE)"
                          (click)="askRemoveGroup(ug)"
                          title="{{ 'DOM_FALLBACK.TEXT_390' | translate }}"
                        >
                          �—‘
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    @if (!addingGroup()) {
                      <tr>
                        <td colspan="6">
                          <div class="s-empty">
                            <div class="s-empty-icon">�¥</div>
                            <div class="s-empty-text">
                              {{ 'DOM_FALLBACK.TEXT_358' | translate }}
                            </div>
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

        <!-- �� DIRECT ROLES ���������������������������������������������� -->
        @if (tab() === 'roles') {
          <div class="tab-body">
            <div class="s-toolbar" style="justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-size:13px;font-weight:500;color:var(--s-text)"
                  >{{ 'DOM_FALLBACK.TEXT_359' | translate }}</span
                >
                <span style="font-size:11px;color:var(--s-text-3);margin-left:8px;">
                  {{ 'DOM_FALLBACK.TEXT_360' | translate }}
                </span>
              </div>
              <button
                class="s-btn s-btn-primary s-btn-sm"
                [permAction]="permissionService.canUpdate(PAGE_CODE)"
                (click)="startAddRole()"
                [disabled]="addingRole()"
              >
                {{ 'DOM_FALLBACK.TEXT_361' | translate }}
              </button>
            </div>

            <div class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th>{{ 'SECU.PERMISSIONS.ROLE_LABEL' | translate }}</th>
                    <th style="width:160px">{{ 'DOM_FALLBACK.TEXT_362' | translate }}</th>
                    <th style="width:100px">{{ 'AUTO_INLINE_SECURITY_UI.APP' | translate }}</th>
                    <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                    <th style="width:48px"></th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Add role row -->
                  @if (addingRole()) {
                    <tr class="row-adding">
                      <td colspan="4" style="padding:10px 14px;">
                        <select class="add-select" [(ngModel)]="addRoleId">
                          <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.SELECT_A_ROLE_TO_ASSIGN_DIRECTLY' | translate }}</option>
                          @for (r of rolesAvailableToAssignDirect(); track r.idRole) {
                            <option [ngValue]="r.idRole">
                              {{ r.roleCode }} — {{ r.roleName }}
                            </option>
                          }
                          @if (!rolesAvailableToAssignDirect().length) {
                            <option disabled>{{ 'DOM_FALLBACK.TEXT_364' | translate }}</option>
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

                  @for (row of rolesTableRows(); track row.role.idRole) {
                    <tr [style.opacity]="row.viaGroup ? '0.6' : '1'">
                      <td>
                        <div style="display:flex;flex-direction:column;gap:2px;">
                          <span class="mono" style="color:var(--s-accent);font-weight:500">{{
                            row.role.roleCode
                          }}</span>
                          <span style="font-size:11px;color:var(--s-text-3)">{{
                            row.role.roleName
                          }}</span>
                        </div>
                      </td>
                      <td>
                        @if (row.viaGroup) {
                          <span
                            style="font-size:11px;background:var(--s-purple-bg);color:var(--s-purple);padding:2px 8px;border-radius:4px;font-family:var(--s-mono);display:inline-block;"
                          >
                            via {{ row.viaGroup }}
                          </span>
                        } @else {
                          <span class="s-badge role">{{ 'DOM_FALLBACK.TEXT_365' | translate }}</span>
                        }
                      </td>
                      <td style="font-size:11px;color:var(--s-text-3)">{{ row.role.appCode }}</td>
                      <td>
                        <span
                          class="s-badge"
                          [class.active]="row.role.isActive"
                          [class.inactive]="!row.role.isActive"
                        >
                          {{ row.role.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        @if (!row.viaGroup) {
                          <button
                            class="s-btn-icon danger"
                            [permAction]="permissionService.canUpdate(PAGE_CODE)"
                            (click)="askRemoveDirectRole(row.role)"
                            title="{{ 'DOM_FALLBACK.TEXT_391' | translate }}"
                          >
                            �—‘
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    @if (!addingRole()) {
                      <tr>
                        <td colspan="5">
                          <div class="s-empty">
                            <div class="s-empty-icon">�­</div>
                            <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_366' | translate }}</div>
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

        <!-- �� PERMISSIONS ������������������������������������������������ -->
        @if (tab() === 'permissions') {
          <div class="tab-body">
            <!-- Toolbar -->
            <div class="s-toolbar" style="justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-size:13px;font-weight:500;color:var(--s-text)"
                  >{{ 'DOM_FALLBACK.TEXT_367' | translate }}</span
                >
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
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

            <!-- Legend -->
            <div
              style="display:flex;gap:20px;padding:8px 20px;border-bottom:1px solid var(--s-border);flex-wrap:wrap;background:var(--s-bg-3);"
            >
              <div
                style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--s-text-2);"
              >
                <input
                  type="checkbox"
                  class="action-check"
                  checked
                  readonly
                  style="pointer-events:none;"
                />
                {{ 'DOM_FALLBACK.TEXT_368' | translate }} <span style="color:var(--s-text-3)">{{ 'DOM_FALLBACK.TEXT_369' | translate }}</span>
              </div>
              <div
                style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--s-text-2);opacity:.5"
              >
                <input type="checkbox" class="action-check" checked disabled />
                {{ 'DOM_FALLBACK.TEXT_370' | translate }} <span style="color:var(--s-text-3)">{{ 'DOM_FALLBACK.TEXT_371' | translate }}</span>
              </div>
              <div
                style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--s-text-2);"
              >
                <input type="checkbox" class="action-check" style="pointer-events:none;" />
                {{ 'DOM_FALLBACK.TEXT_372' | translate }}
              </div>
            </div>

            <!-- Tree -->
            <div class="perm-tree">
              @for (node of filteredPageTree(); track node.idPage) {
                <ng-container
                  *ngTemplateOutlet="pageNodeTpl; context: { $implicit: node, depth: 0 }"
                ></ng-container>
              } @empty {
                <div class="s-empty" style="padding:48px 20px;">
                  <div class="s-empty-icon">�</div>
                  <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_373' | translate }}</div>
                </div>
              }
            </div>

            <!-- Sticky save bar -->
            @if (permDirty()) {
              <div class="perm-save-bar">
                <span style="font-size:12px;color:var(--s-text-2);">
                  <strong style="color:var(--s-accent)">{{ permChangedCount() }}</strong>
                  unsaved change{{ permChangedCount() !== 1 ? 's' : '' }}
                </span>
                <div style="display:flex;gap:8px;">
                  <button class="s-btn s-btn-ghost" (click)="resetPermissions()">{{ 'DOM_FALLBACK.TEXT_374' | translate }}</button>
                  <button
                    class="s-btn s-btn-primary"
                    [permAction]="permissionService.canUpdate(PAGE_CODE)"
                    (click)="savePermissions()"
                    [disabled]="permSaving()"
                  >
                    {{ permSaving() ? 'Saving�¦' : 'Save Changes' }}
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
      <!-- /s-card -->
    }

    <!-- ── Page node template ──────────────────────────────────────────── -->
    <ng-template #pageNodeTpl let-node let-depth="depth">
      <div class="page-node">
        <div class="page-header" (click)="node.expanded = !node.expanded">
          <span class="page-chevron" [class.open]="node.expanded">�–¶</span>
          <span style="font-size:13px;">📄</span>
          <span
            style="font-family:var(--s-mono);font-size:12px;color:var(--s-accent);min-width:100px;flex-shrink:0;"
            >{{ node.pageCode }}</span
          >
          <span style="font-size:13px;color:var(--s-text);">{{ node.pageName }}</span>
          <!-- Summary pills -->
          <div style="display:flex;gap:4px;margin-left:auto;flex-shrink:0;">
            @if (pageDirectCount(node) > 0) {
              <span class="count-pill granted">{{ pageDirectCount(node) }} granted</span>
            }
            @if (pageInheritedCount(node) > 0) {
              <span class="count-pill inherited">{{ pageInheritedCount(node) }} inherited</span>
            }
            @if (node.actions.length > 0) {
              <span style="font-size:11px;color:var(--s-text-3);padding:1px 6px;"
                >{{ node.actions.length }} action{{ node.actions.length !== 1 ? 's' : '' }}</span
              >
            }
          </div>
        </div>

        @if (node.expanded) {
          @if (node.actions.length > 0) {
            <div class="page-actions-grid">
              @for (act of node.actions; track act.idPageAction) {
                <label
                  class="action-item"
                  [class.is-inherited]="act.inherited"
                  [title]="
                    act.inherited
                      ? 'Inherited ' + act.inheritedReason
                      : act.checked
                        ? 'Click to revoke'
                        : 'Click to grant'
                  "
                >
                  <input
                    type="checkbox"
                    class="action-check"
                    [checked]="act.checked || act.inherited"
                    [disabled]="act.inherited || !permissionService.canUpdate(PAGE_CODE)"
                    (change)="togglePerm(act, $event)"
                  />
                  <span class="action-code">{{ act.actionCode }}</span>
                  <span class="action-name" style="font-size:11px;">{{ act.actionName }}</span>
                  @if (act.inherited) {
                    <span class="inherited-tag">{{ act.inheritedReason }}</span>
                  }
                </label>
              }
            </div>
          }
          @if (node.children.length > 0) {
            <div class="page-children">
              @for (child of node.children; track child.idPage) {
                <ng-container
                  *ngTemplateOutlet="pageNodeTpl; context: { $implicit: child, depth: depth + 1 }"
                ></ng-container>
              }
            </div>
          }
        }
      </div>
    </ng-template>

    <!-- ── Confirm modal ───────────────────────────────────────────────── -->
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
export class UserDetailComponent implements OnInit {
  private api = inject(SecuApiService);
  private route = inject(ActivatedRoute);
  readonly permissionService = inject(PermissionService);
  readonly PAGE_CODE = PAGE_CODE;

  // ─── Core ───────────────────────────────────────────────────────────────
  user = signal<SecuUserDto | null>(null);
  loading = signal(true);
  tab = signal<Tab>('info');

  // ─── Groups ─────────────────────────────────────────────────────────────
  userGroups = signal<SecuUserGroupDto[]>([]);
  allGroups = signal<SecuGroupDto[]>([]);
  /** Map groupId → SecuRoleDto[] */
  groupRolesMap = signal(new Map<number, SecuRoleDto[]>());

  addingGroup = signal(false);
  addGroupId: number | null = null;

  // ─── Roles ──────────────────────────────────────────────────────────────
  userDirectRoles = signal<SecuRoleDto[]>([]);
  allRoles = signal<SecuRoleDto[]>([]);

  addingRole = signal(false);
  addRoleId: number | null = null;

  // ─── Permissions ────────────────────────────────────────────────────────
  allPageActions = signal<SecuPageActionDto[]>([]);
  allPages = signal<SecuPageDto[]>([]);
  userDirectPerms = signal<SecuUserPermissionDto[]>([]);

  pageTree = signal<PageNode[]>([]);
  permSearch = '';
  permDirty = signal(false);
  permSaving = signal(false);

  /** Set of pageActionIds currently checked as direct grants */
  private desiredPermIds = new Set<number>();
  /** Original state for dirty checking */
  private origPermIds = new Set<number>();
  /** Inherited pageActionIds (from all effective roles) */
  private inheritedPaIds = new Set<number>();
  /** Map paId → reason string */
  private inheritedReasonMap = new Map<number, string>();

  confirmModal = signal<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────

  allEffectiveRoles = computed((): SecuRoleDto[] => {
    const seen = new Set<number>();
    const result: SecuRoleDto[] = [];
    for (const r of this.userDirectRoles()) {
      if (!seen.has(r.idRole)) {
        seen.add(r.idRole);
        result.push(r);
      }
    }
    for (const [, roles] of this.groupRolesMap()) {
      for (const r of roles) {
        if (!seen.has(r.idRole)) {
          seen.add(r.idRole);
          result.push(r);
        }
      }
    }
    return result;
  });

  /** roleId → groupCode (first group that provides it) */
  private rolesViaGroupMap = computed((): Map<number, string> => {
    const m = new Map<number, string>();
    for (const ug of this.userGroups()) {
      for (const r of this.groupRolesMap().get(ug.groupId) ?? []) {
        if (!m.has(r.idRole)) m.set(r.idRole, ug.groupCode);
      }
    }
    return m;
  });

  rolesTableRows = computed(() => {
    const viaMap = this.rolesViaGroupMap();
    const rows: { role: SecuRoleDto; viaGroup: string | null }[] = [];
    const seen = new Set<number>();
    for (const r of this.userDirectRoles()) {
      if (!seen.has(r.idRole)) {
        seen.add(r.idRole);
        rows.push({ role: r, viaGroup: null });
      }
    }
    for (const [rid, gc] of viaMap) {
      if (!seen.has(rid)) {
        const role = this.allRoles().find((r) => r.idRole === rid);
        if (role) {
          seen.add(rid);
          rows.push({ role, viaGroup: gc });
        }
      }
    }
    return rows.sort((a, b) => (a.viaGroup ? 1 : 0) - (b.viaGroup ? 1 : 0));
  });

  rolesAvailableToAssignDirect = computed(() => {
    const assignedIds = new Set([
      ...this.userDirectRoles().map((r) => r.idRole),
      ...this.rolesViaGroupMap().keys(),
    ]);
    return this.allRoles().filter((r) => !assignedIds.has(r.idRole) && r.isActive);
  });

  availableGroupsToAdd = computed(() => {
    const assigned = new Set(this.userGroups().map((ug) => ug.groupId));
    return this.allGroups().filter((g) => !assigned.has(g.idGroup) && g.isActive);
  });

  filteredPageTree = computed(() => {
    const q = this.permSearch.trim().toLowerCase();
    if (!q) return this.pageTree();
    return this.filterTree(this.pageTree(), q);
  });

  directPermCount = computed(() => this.sumNodes(this.pageTree(), 'direct'));
  totalPermCount = computed(() => this.sumNodes(this.pageTree(), 'any'));

  permChangedCount = computed(() => {
    let count = 0;
    for (const id of this.desiredPermIds) if (!this.origPermIds.has(id)) count++;
    for (const id of this.origPermIds) if (!this.desiredPermIds.has(id)) count++;
    return count;
  });

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(userId);
  }

  loadAll(userId: string) {
    this.loading.set(true);
    forkJoin({
      user: this.api.getUser(userId).pipe(catchError(() => of(null))),
      userGroups: this.api.getUserGroups(userId, { size: 200 }).pipe(catchError(() => of(null))),
      userDirectRoles: this.api
        .getUserRoles(userId, { size: 200 })
        .pipe(catchError(() => of(null))),
      userPerms: this.api
        .getUserPermissions(userId, { size: 500 })
        .pipe(catchError(() => of(null))),
      allGroups: this.api.getGroups({ size: 200 }).pipe(catchError(() => of(null))),
      allRoles: this.api.getRoles({ size: 200 }).pipe(catchError(() => of(null))),
      allPageActions: this.api.getPageActions({ size: 500 }).pipe(catchError(() => of(null))),
      allPages: this.api.getPages({ size: 500 }).pipe(catchError(() => of(null))),
    }).subscribe((r) => {
      if (r.user) this.user.set(r.user);
      if (r.userGroups) this.userGroups.set(r.userGroups.data);
      if (r.userDirectRoles) this.userDirectRoles.set(r.userDirectRoles.data);
      if (r.userPerms) this.userDirectPerms.set(r.userPerms.data);
      if (r.allGroups) this.allGroups.set(r.allGroups.data);
      if (r.allRoles) this.allRoles.set(r.allRoles.data);
      if (r.allPageActions) this.allPageActions.set(r.allPageActions.data);
      if (r.allPages) this.allPages.set(r.allPages.data);

      // Load roles for each group the user is in, then permissions for all effective roles
      this.loadGroupRoles(r.userGroups?.data ?? [], r.userDirectRoles?.data ?? []);
    });
  }

  loadGroupRoles(groups: SecuUserGroupDto[], directRoles: SecuRoleDto[]) {
    if (!groups.length) {
      this.groupRolesMap.set(new Map());
      this.loadRolePermissions(directRoles, []);
      return;
    }
    forkJoin(
      groups.map((ug) =>
        this.api.getGroupRoles(ug.groupId, { size: 200 }).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      const map = new Map<number, SecuRoleDto[]>();
      results.forEach((res, i) => {
        if (res) {
          map.set(
            groups[i].groupId,
            res.data.map((gr) => ({
              idRole: gr.roleId,
              roleCode: gr.roleCode,
              roleName: gr.roleName,
              appCode: '',
              isActive: gr.isActive,
              createdAt: gr.grantedAt ?? '',
            })),
          );
        }
      });
      this.groupRolesMap.set(map);

      // Collect all effective role IDs
      const groupRoles: { roleId: number; source: string }[] = [];
      for (const ug of groups) {
        for (const r of map.get(ug.groupId) ?? []) {
          groupRoles.push({ roleId: r.idRole, source: ug.groupCode });
        }
      }
      this.loadRolePermissions(directRoles, groupRoles);
    });
  }

  loadRolePermissions(
    directRoles: SecuRoleDto[],
    groupRoles: { roleId: number; source: string }[],
  ) {
    const allRoleIds = [
      ...directRoles.map((r) => ({ roleId: r.idRole, source: `role:${r.roleCode}` })),
      ...groupRoles,
    ];
    const unique = [...new Map(allRoleIds.map((x) => [x.roleId, x])).values()];

    if (!unique.length) {
      this.inheritedPaIds = new Set();
      this.inheritedReasonMap = new Map();
      this.buildPermTree();
      this.loading.set(false);
      return;
    }

    forkJoin(
      unique.map(({ roleId }) =>
        this.api.getRolePermissions(roleId, { size: 500 }).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      const ids = new Set<number>();
      const reasonMap = new Map<number, string>();
      results.forEach((res, i) => {
        if (res) {
          const source = unique[i].source;
          res.data
            .filter((p) => p.isActive)
            .forEach((p) => {
              if (!ids.has(p.pageActionId)) {
                ids.add(p.pageActionId);
                reasonMap.set(
                  p.pageActionId,
                  source.startsWith('role:') ? `role ${source.slice(5)}` : `group ${source}`,
                );
              }
            });
        }
      });
      this.inheritedPaIds = ids;
      this.inheritedReasonMap = reasonMap;
      this.buildPermTree();
      this.loading.set(false);
    });
  }

  buildPermTree() {
    const directPaIds = new Set(
      this.userDirectPerms()
        .filter((p) => p.isActive)
        .map((p) => p.pageActionId),
    );
    this.origPermIds = new Set(directPaIds);
    this.desiredPermIds = new Set(directPaIds);

    const inherited = this.inheritedPaIds;
    const reasonMap = this.inheritedReasonMap;

    // Group actions by page
    const paByPage = new Map<number, PermNode[]>();
    for (const pa of this.allPageActions()) {
      if (!paByPage.has(pa.pageId)) paByPage.set(pa.pageId, []);
      const isDirect = directPaIds.has(pa.idPageAction);
      const isInherited = inherited.has(pa.idPageAction) && !isDirect;
      paByPage.get(pa.pageId)!.push({
        idPageAction: pa.idPageAction,
        pageCode: pa.pageCode,
        pageName: pa.pageName,
        actionCode: pa.actionCode,
        actionName: pa.actionName,
        idPage: pa.pageId,
        checked: isDirect,
        inherited: isInherited,
        inheritedReason: isInherited ? (reasonMap.get(pa.idPageAction) ?? 'inherited') : '',
      });
    }

    // Build page node map
    const nodeMap = new Map<number, PageNode>();
    for (const p of this.allPages()) {
      nodeMap.set(p.idPage, {
        idPage: p.idPage,
        pageCode: p.pageCode,
        pageName: p.pageName,
        parentId: p.parentId,
        sortOrder: p.sortOrder,
        actions: paByPage.get(p.idPage) ?? [],
        children: [],
        expanded: false,
      });
    }
    // Pages referenced in page-actions but not in allPages
    for (const [pid, actions] of paByPage) {
      if (!nodeMap.has(pid)) {
        nodeMap.set(pid, {
          idPage: pid,
          pageCode: actions[0].pageCode,
          pageName: actions[0].pageName,
          parentId: null,
          sortOrder: null,
          actions,
          children: [],
          expanded: false,
        });
      }
    }

    // Hierarchy
    const roots: PageNode[] = [];
    for (const [, node] of nodeMap) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Sort + prune pages with no actions anywhere in subtree
    const hasContent = (n: PageNode): boolean =>
      n.actions.length > 0 || n.children.some(hasContent);

    const pruned = roots
      .filter(hasContent)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    pruned.forEach(
      (r) =>
        (r.children = r.children
          .filter(hasContent)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))),
    );

    // Auto-expand nodes that have grants
    const autoExpand = (n: PageNode) => {
      if (n.actions.some((a) => a.checked || a.inherited)) n.expanded = true;
      n.children.forEach(autoExpand);
    };
    pruned.forEach(autoExpand);

    this.pageTree.set(pruned);
    this.permDirty.set(false);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  rolesOfGroup(groupId: number): SecuRoleDto[] {
    return this.groupRolesMap().get(groupId) ?? [];
  }

  pageDirectCount(n: PageNode): number {
    return (
      n.actions.filter((a) => a.checked).length +
      n.children.reduce((s, c) => s + this.pageDirectCount(c), 0)
    );
  }

  pageInheritedCount(n: PageNode): number {
    return (
      n.actions.filter((a) => a.inherited).length +
      n.children.reduce((s, c) => s + this.pageInheritedCount(c), 0)
    );
  }

  sumNodes(nodes: PageNode[], mode: 'direct' | 'any'): number {
    return nodes.reduce(
      (s, n) =>
        s +
        (mode === 'direct'
          ? n.actions.filter((a) => a.checked).length
          : n.actions.filter((a) => a.checked || a.inherited).length) +
        this.sumNodes(n.children, mode),
      0,
    );
  }

  filterTree(nodes: PageNode[], q: string): PageNode[] {
    return nodes
      .map((n) => {
        const match = n.pageCode.toLowerCase().includes(q) || n.pageName.toLowerCase().includes(q);
        const childrenFiltered = this.filterTree(n.children, q);
        const actionsFiltered = match
          ? n.actions
          : n.actions.filter(
              (a) =>
                a.actionCode.toLowerCase().includes(q) || a.actionName.toLowerCase().includes(q),
            );
        if (match || childrenFiltered.length || actionsFiltered.length) {
          return { ...n, actions: actionsFiltered, children: childrenFiltered, expanded: true };
        }
        return null;
      })
      .filter(Boolean) as PageNode[];
  }

  expandAll() {
    const expand = (nodes: PageNode[]) => {
      nodes.forEach((n) => {
        n.expanded = true;
        expand(n.children);
      });
    };
    expand(this.pageTree());
    this.pageTree.set([...this.pageTree()]);
  }

  collapseAll() {
    const collapse = (nodes: PageNode[]) => {
      nodes.forEach((n) => {
        n.expanded = false;
        collapse(n.children);
      });
    };
    collapse(this.pageTree());
    this.pageTree.set([...this.pageTree()]);
  }

  // ─── Groups actions ────────────────────────────────────────────────────
  startAddGroup() {
    this.addGroupId = null;
    this.addingGroup.set(true);
  }
  cancelAddGroup() {
    this.addingGroup.set(false);
    this.addGroupId = null;
  }

  confirmAddGroup() {
    if (!this.addGroupId) return;
    const userId = this.route.snapshot.paramMap.get('id')!;
    const newIds = [...new Set([...this.userGroups().map((ug) => ug.groupId), this.addGroupId])];
    this.api
      .assignUserGroups(userId, { groupIds: newIds })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.cancelAddGroup();
        this.reloadGroups(userId);
      });
  }

  askRemoveGroup(ug: SecuUserGroupDto) {
    this.confirmModal.set({
      title: 'Remove from Group',
      message: `Remove user from group <strong style="color:var(--s-purple);font-family:var(--s-mono)">${ug.groupCode}</strong>?
        <br><br><span style="font-size:12px;color:var(--s-amber);">�  Roles inherited via this group will be removed from effective permissions.</span>`,
      onConfirm: () => {
        const userId = this.route.snapshot.paramMap.get('id')!;
        const newIds = this.userGroups()
          .filter((g) => g.idUserGroup !== ug.idUserGroup)
          .map((g) => g.groupId);
        this.api
          .assignUserGroups(userId, { groupIds: newIds })
          .pipe(catchError(() => of(null)))
          .subscribe(() => this.reloadGroups(userId));
      },
    });
  }

  reloadGroups(userId: string) {
    this.api.getUserGroups(userId, { size: 200 }).subscribe((r) => {
      this.userGroups.set(r.data);
      this.loadGroupRoles(r.data, this.userDirectRoles());
    });
  }

  // ─── Roles actions ─────────────────────────────────────────────────────
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
    const userId = this.route.snapshot.paramMap.get('id')!;
    const newIds = [...new Set([...this.userDirectRoles().map((r) => r.idRole), this.addRoleId])];
    this.api
      .assignUserRoles(userId, { roleIds: newIds })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.cancelAddRole();
        this.reloadRoles(userId);
      });
  }

  askRemoveDirectRole(role: SecuRoleDto) {
    this.confirmModal.set({
      title: 'Remove Direct Role',
      message: `Remove direct role <strong style="color:var(--s-accent);font-family:var(--s-mono)">${role.roleCode}</strong> from this user?`,
      onConfirm: () => {
        const userId = this.route.snapshot.paramMap.get('id')!;
        const newIds = this.userDirectRoles()
          .filter((r) => r.idRole !== role.idRole)
          .map((r) => r.idRole);
        this.api
          .assignUserRoles(userId, { roleIds: newIds })
          .pipe(catchError(() => of(null)))
          .subscribe(() => this.reloadRoles(userId));
      },
    });
  }

  reloadRoles(userId: string) {
    this.api.getUserRoles(userId, { size: 200 }).subscribe((r) => {
      this.userDirectRoles.set(r.data);
      this.loadRolePermissions(
        r.data,
        [...this.rolesViaGroupMap().entries()].map(([rid, gc]) => ({ roleId: rid, source: gc })),
      );
    });
  }

  // ─── Permission actions ────────────────────────────────────────────────
  togglePerm(act: PermNode, event: Event) {
    if (act.inherited) {
      event.preventDefault();
      return;
    }
    act.checked = !act.checked;
    if (act.checked) this.desiredPermIds.add(act.idPageAction);
    else this.desiredPermIds.delete(act.idPageAction);
    this.permDirty.set(this.permChangedCount() > 0);
    this.pageTree.set([...this.pageTree()]);
  }

  resetPermissions() {
    this.desiredPermIds = new Set(this.origPermIds);
    this.resetNodeChecks(this.pageTree());
    this.pageTree.set([...this.pageTree()]);
    this.permDirty.set(false);
  }

  resetNodeChecks(nodes: PageNode[]) {
    for (const n of nodes) {
      n.actions.forEach((a) => {
        a.checked = this.origPermIds.has(a.idPageAction);
      });
      this.resetNodeChecks(n.children);
    }
  }

  savePermissions() {
    const userId = this.route.snapshot.paramMap.get('id')!;
    this.permSaving.set(true);
    this.api
      .assignUserPermissions(userId, { pageActionIds: [...this.desiredPermIds] })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.permSaving.set(false);
        this.origPermIds = new Set(this.desiredPermIds);
        this.permDirty.set(false);
      });
  }

  runConfirm() {
    this.confirmModal()?.onConfirm();
    this.confirmModal.set(null);
  }
}

