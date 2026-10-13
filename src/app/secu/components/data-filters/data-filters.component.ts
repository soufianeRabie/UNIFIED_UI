import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import {
  CreateSecuDataFilterRequest,
  CreateSecuDataFilterRuleRequest,
  CreateSecuDataFilterTargetRequest,
  RefCompanyDto,
  SecuGroupDto,
  SecuRoleDto,
  SecuDataFilterDto,
  SecuDataFilterRuleDto,
  SecuDataFilterTargetDto,
  SecuEntityDto,
  SecuFieldDto,
  SecuUserDto,
} from '../../models/secu.models';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'DATA_FILTERS';

const OPERATORS = ['Equals', 'NotEquals', 'Contains', 'StartsWith', 'EndsWith', 'GreaterThan', 'LessThan', 'Between', 'In', 'IsNull', 'Regex'];
const CONJUNCTIONS = ['AND', 'OR'];
const VALUE_TYPES = ['String', 'Number', 'Date', 'Boolean', 'Claim'];
const TARGET_TYPES = ['User', 'Role', 'Group', 'Tenant'];

type DetailTab = 'rules' | 'targets' | 'effective';

@Component({
  selector: 'app-data-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, PermActionDirective, TranslatePipe],
  styles: [`
    .df-grid { display:grid; grid-template-columns:minmax(260px,.34fr) minmax(0,1fr); min-height:62vh; }
    @media (max-width: 900px) { .df-grid { grid-template-columns:1fr; } }
    .df-list { border-right:1px solid var(--s-border); max-height:72vh; overflow:auto; }
    .df-item { padding:12px 16px; border-bottom:1px solid var(--s-border); cursor:pointer; transition:background .14s; }
    .df-item:hover { background:var(--s-bg-3); }
    .df-item.active { background:var(--s-accent-glow); border-left:3px solid var(--s-accent); }
    .df-detail { max-height:72vh; overflow:auto; }
    .df-header { padding:15px 20px; border-bottom:1px solid var(--s-border); background:var(--s-bg-3); display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
    .df-rule { display:flex; align-items:center; gap:7px; flex-wrap:wrap; padding:9px 12px; border:1px solid var(--s-border); border-radius:var(--s-radius); background:var(--s-bg-2); }
    .df-chip { font-family:var(--s-mono); font-size:10px; padding:2px 7px; border-radius:5px; background:var(--s-bg-4); color:var(--s-text-2); }
    .df-chip.op { background:var(--s-amber-bg); color:var(--s-amber); }
    .df-chip.and { background:var(--s-accent-glow); color:var(--s-accent); }
    .df-chip.or { background:var(--s-purple-bg); color:var(--s-purple); }
    .df-help { font-size:11px; color:var(--s-text-3); line-height:1.5; }
  `],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'SECU.DATA_FILTERS.TITLE' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'SECU.DATA_FILTERS.SUBTITLE' | translate }}</p>
      </div>
      <button class="s-btn s-btn-primary" [permAction]="permissionService.canCreate(PAGE_CODE)" (click)="openCreate()">{{ 'SECU.DATA_FILTERS.NEW' | translate }}</button>
    </div>

    <div class="s-card" style="padding:0;overflow:visible;">
      <div class="df-grid">
        <div class="df-list">
          <div class="s-toolbar" style="gap:8px;flex-wrap:wrap;">
            <div class="s-search" style="flex:1;min-width:150px;">
              <span class="s-search-icon">🔍</span>
              <input [(ngModel)]="search" (ngModelChange)="onFilterSearch()" [placeholder]="'SECU.DATA_FILTERS.SEARCH_PLACEHOLDER' | translate" />
            </div>
            <input class="s-input mono" style="width:150px;" [(ngModel)]="entityFilter" (ngModelChange)="onFilterSearch()" list="dfEntityList" placeholder="{{ 'SECU.DATA_FILTERS.COLUMNS.ENTITY' | translate }}" />
            <label class="s-toggle" title="{{ 'AUTO_INLINE_SECURITY_UI.INCLUDE_INACTIVE' | translate }}">
              <input type="checkbox" [(ngModel)]="includeInactive" (change)="onFilterSearch()" />
              <div class="s-toggle-track"></div><div class="s-toggle-thumb"></div>
            </label>
          </div>

          <datalist id="dfEntityList">
            @for (entity of entities(); track entity.idEntity) {
              <option [value]="entity.entityName">{{ entity.tableName || entity.entityName }}</option>
            }
          </datalist>

          @if (loading()) {
            <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
          } @else {
            @for (filter of filters(); track filter.idFilter) {
              <div class="df-item" [class.active]="selected()?.idFilter === filter.idFilter" (click)="select(filter)">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <span class="mono" style="font-size:12px;color:var(--s-accent);font-weight:600;">{{ filter.filterCode }}</span>
                  <span class="s-badge" [class.active]="filter.isActive" [class.inactive]="!filter.isActive">{{ (filter.isActive ? 'COMMON.ACTIVE' : 'COMMON.OFF') | translate }}</span>
                </div>
                <div style="font-size:12px;color:var(--s-text-2);margin-top:4px;">{{ filter.entityName }}</div>
                <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">
                  <span class="df-chip">{{ filter.rules.length }} rules</span>
                  <span class="df-chip">{{ filter.targets.length }} targets</span>
                  <span class="df-chip">Company {{ filter.tenantId || 'Global' }}</span>
                </div>
              </div>
            } @empty {
              <div class="s-empty" style="padding:40px 20px;"><div class="s-empty-text">{{ 'SECU.DATA_FILTERS.EMPTY' | translate }}</div></div>
            }
            <secu-pagination
              [page]="page"
              [size]="pageSize"
              [totalRecords]="totalRecords()"
              [totalPages]="totalPages()"
              (pageChange)="onPageChange($event)"
            />
          }
        </div>

        <div class="df-detail">
          @if (!selected()) {
            <div class="s-empty" style="padding:80px 20px;"><div class="s-empty-text">{{ 'SECU.DATA_FILTERS.SELECT_HINT' | translate }}</div></div>
          } @else {
            <div class="df-header">
              <div>
                <div class="mono" style="font-size:15px;color:var(--s-accent);font-weight:700;">{{ selected()!.filterCode }}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                  <span class="df-chip">{{ selected()!.entityName }}</span>
                  <span class="df-chip">Company {{ companyLabel(selected()!.tenantId) }}</span>
                  <span class="s-badge" [class.active]="selected()!.isActive" [class.inactive]="!selected()!.isActive">{{ (selected()!.isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}</span>
                </div>
                @if (selected()!.description) {
                  <div style="font-size:12px;color:var(--s-text-2);margin-top:6px;">{{ selected()!.description }}</div>
                }
              </div>
              <div style="display:flex;gap:6px;">
                <button class="s-btn s-btn-ghost s-btn-sm" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="openEdit(selected()!)">{{ 'COMMON.EDIT' | translate }}</button>
                <button class="s-btn-icon danger" [permAction]="permissionService.canDelete(PAGE_CODE)" (click)="askDelete(selected()!)">{{ 'COMMON.DELETE' | translate }}</button>
              </div>
            </div>

            <div class="s-tabs" style="border-bottom:1px solid var(--s-border);">
              <div class="s-tab" [class.active]="detailTab()==='rules'" (click)="detailTab.set('rules')">{{ 'SECU.DATA_FILTERS.TABS.RULES' | translate }} <span class="s-tab-count">{{ selected()!.rules.length }}</span></div>
              <div class="s-tab" [class.active]="detailTab()==='targets'" (click)="detailTab.set('targets')">{{ 'SECU.DATA_FILTERS.TABS.TARGETS' | translate }} <span class="s-tab-count">{{ selected()!.targets.length }}</span></div>
              <div class="s-tab" [class.active]="detailTab()==='effective'" (click)="detailTab.set('effective'); loadEffective()">{{ 'SECU.DATA_FILTERS.TABS.EFFECTIVE' | translate }}</div>
            </div>

            @if (detailTab() === 'rules') {
              <div style="padding:12px 16px;border-bottom:1px solid var(--s-border);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <span class="df-help">{{ 'SECU.DATA_FILTERS.RULES_HELP' | translate }}</span>
                <button class="s-btn s-btn-primary s-btn-sm" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="openAddRule()">{{ 'SECU.DATA_FILTERS.ADD_RULE' | translate }}</button>
              </div>
              <div style="padding:14px 16px;display:flex;flex-direction:column;gap:8px;">
                @for (rule of selected()!.rules; track rule.idRule; let i = $index) {
                  <div class="df-rule">
                    @if (i > 0) {
                      <span class="df-chip" [class.and]="rule.conjunction === 'AND'" [class.or]="rule.conjunction === 'OR'">{{ rule.conjunction }}</span>
                    }
                    <span class="df-chip">{{ fieldLabel(rule) }}</span>
                    <span class="df-chip op">{{ rule.operator }}</span>
                    <span class="mono" style="font-size:11px;color:var(--s-text);">{{ rule.value || '-' }}</span>
                    @if (rule.value2) { <span class="mono" style="font-size:11px;color:var(--s-text-2);">to {{ rule.value2 }}</span> }
                    <span class="s-badge" [class.active]="rule.isActive" [class.inactive]="!rule.isActive" style="margin-left:auto;">{{ (rule.isActive ? 'COMMON.ON' : 'COMMON.OFF') | translate }}</span>
                    <button class="s-btn-icon danger" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="deleteRule(rule)">{{ 'COMMON.DELETE' | translate }}</button>
                  </div>
                } @empty {
                  <div class="s-empty" style="padding:28px;"><div class="s-empty-text">{{ 'SECU.DATA_FILTERS.NO_RULES' | translate }}</div></div>
                }
              </div>
            }

            @if (detailTab() === 'targets') {
              <div style="padding:12px 16px;border-bottom:1px solid var(--s-border);display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <span class="df-help">{{ 'SECU.DATA_FILTERS.TARGETS_HELP' | translate }}</span>
                <button class="s-btn s-btn-primary s-btn-sm" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="openAddTarget()">{{ 'SECU.DATA_FILTERS.ADD_TARGET' | translate }}</button>
              </div>
              <div class="s-table-wrap">
                <table class="s-table">
                  <thead><tr><th>{{ 'SECU.DATA_FILTERS.COLUMNS.TYPE' | translate }}</th><th>{{ 'SECU.DATA_FILTERS.COLUMNS.TARGET' | translate }}</th><th>{{ 'COMMON.STATUS' | translate }}</th><th style="width:52px;"></th></tr></thead>
                  <tbody>
                    @for (target of selected()!.targets; track target.idTarget) {
                      <tr>
                        <td><span class="df-chip">{{ target.targetType }}</span></td>
                        <td><span class="mono" style="font-size:11px;color:var(--s-purple);">{{ targetLabel(target) }}</span></td>
                        <td><span class="s-badge" [class.active]="target.isActive" [class.inactive]="!target.isActive">{{ (target.isActive ? 'COMMON.ACTIVE' : 'COMMON.OFF') | translate }}</span></td>
                        <td><button class="s-btn-icon danger" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="deleteTarget(target)">{{ 'COMMON.DELETE' | translate }}</button></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="4"><div class="s-empty"><div class="s-empty-text">{{ 'SECU.DATA_FILTERS.NO_TARGETS' | translate }}</div></div></td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @if (detailTab() === 'effective') {
              <div style="padding:12px 16px;border-bottom:1px solid var(--s-border);display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <input class="s-input mono" style="width:210px;" [(ngModel)]="effectiveTenantId" list="dfCompanyList" placeholder="{{ 'DOM_FALLBACK.TEXT_394' | translate }}" />
                <button class="s-btn s-btn-ghost s-btn-sm" (click)="loadEffective()">{{ 'COMMON.REFRESH' | translate }}</button>
              </div>
              @if (effectiveLoading()) {
                <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
              } @else {
                @for (filter of effectiveFilters(); track filter.idFilter) {
                  <div style="padding:11px 16px;border-bottom:1px solid var(--s-border);display:flex;gap:8px;align-items:center;">
                    <span class="mono" style="font-size:11px;color:var(--s-accent);">{{ filter.filterCode }}</span>
                    <span class="df-chip">{{ filter.rules.length }} rules</span>
                    <span class="df-chip">Company {{ companyLabel(filter.tenantId) }}</span>
                  </div>
                } @empty {
                  <div class="s-empty" style="padding:28px;"><div class="s-empty-text">{{ 'SECU.DATA_FILTERS.NO_EFFECTIVE' | translate }}</div></div>
                }
              }
            }
          }
        </div>
      </div>
    </div>

    <datalist id="dfCompanyList">
      @for (company of companies(); track company.companyCode) {
        <option [value]="company.companyCode">{{ company.companyName }}</option>
      }
    </datalist>
    <datalist id="dfUserList">
      @for (user of users(); track user.idUser) {
        <option [value]="targetOption('User', user)">{{ user.fullName }}</option>
      }
    </datalist>
    <datalist id="dfRoleList">
      @for (role of roles(); track role.idRole) {
        <option [value]="targetOption('Role', role)">{{ role.roleName }}</option>
      }
    </datalist>
    <datalist id="dfGroupList">
      @for (group of groups(); track group.idGroup) {
        <option [value]="targetOption('Group', group)">{{ group.groupName }}</option>
      }
    </datalist>

    @if (filterModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ (editingFilter() ? 'SECU.DATA_FILTERS.MODAL.EDIT_TITLE' : 'SECU.DATA_FILTERS.MODAL.CREATE_TITLE') | translate }}</span>
            <button class="s-btn-icon" (click)="filterModal.set(false)">x</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">{{ saveError() }}</div> }
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.MODAL.FILTER_CODE' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="ff.filterCode" [disabled]="!!editingFilter()" (blur)="ff.filterCode=ff.filterCode.toUpperCase()" placeholder="FLEET_ACTIVE_ONLY" />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.MODAL.ENTITY' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="ff.entityName" list="dfEntityList" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.VEHICLE' | translate }}" />
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'COMMON.DESCRIPTION' | translate }}</label>
                <input class="s-input" [(ngModel)]="ff.description" [placeholder]="'COMMON.OPTIONAL' | translate" />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.MODAL.COMPANY_TENANT' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="ff.tenantId" list="dfCompanyList" [placeholder]="'SECU.DATA_FILTERS.MODAL.COMPANY_PLACEHOLDER' | translate" />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;">
                <label class="s-toggle">
                  <input type="checkbox" [(ngModel)]="ff.isActive" />
                  <div class="s-toggle-track"></div><div class="s-toggle-thumb"></div>
                </label>
                <span style="font-size:13px;color:var(--s-text-2);">{{ 'COMMON.ACTIVE' | translate }}</span>
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="filterModal.set(false)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveFilter()" [disabled]="saving()">{{ saving() ? ('COMMON.SAVING' | translate) : ('COMMON.SAVE' | translate) }}</button>
          </div>
        </div>
      </div>
    }

    @if (ruleModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'SECU.DATA_FILTERS.RULE.ADD_TITLE' | translate }} {{ selected()?.entityName }}</span>
            <button class="s-btn-icon" (click)="ruleModal.set(false)">x</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">{{ saveError() }}</div> }
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.FIELD' | translate }}</label>
                <input class="s-input mono" [ngModel]="ruleFieldText" (ngModelChange)="onRuleFieldInput($event)" list="dfRuleFieldList" [placeholder]="'COMMON.SEARCH' | translate" />
                <datalist id="dfRuleFieldList">
                  @for (field of fieldsForSelectedFilter(); track field.idField) {
                    <option [value]="fieldOption(field)">{{ field.columnName || field.fieldName }}</option>
                  }
                </datalist>
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.OPERATOR' | translate }}</label>
                <select class="s-select" [(ngModel)]="rf.operator">
                  @for (operator of OPERATORS; track operator) { <option [value]="operator">{{ operator }}</option> }
                </select>
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.VALUE' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="rf.value" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.TENANTID_TRUE_10' | translate }}" />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.VALUE2' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="rf.value2" placeholder="{{ 'DOM_FALLBACK.TEXT_386' | translate }}" />
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.VALUE_TYPE' | translate }}</label>
                <select class="s-select" [(ngModel)]="rf.valueType">
                  <option [ngValue]="null">{{ 'COMMON.AUTO' | translate }}</option>
                  @for (type of VALUE_TYPES; track type) { <option [value]="type">{{ type }}</option> }
                </select>
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.CONJUNCTION' | translate }}</label>
                <select class="s-select" [(ngModel)]="rf.conjunction">
                  @for (conjunction of CONJUNCTIONS; track conjunction) { <option [value]="conjunction">{{ conjunction }}</option> }
                </select>
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.RULE.GROUP_INDEX' | translate }}</label>
                <input class="s-input" type="number" min="0" [(ngModel)]="rf.groupIndex" />
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="ruleModal.set(false)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveRule()" [disabled]="saving()">{{ saving() ? ('COMMON.SAVING' | translate) : ('SECU.DATA_FILTERS.RULE.ADD_BTN' | translate) }}</button>
          </div>
        </div>
      </div>
    }

    @if (targetModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'SECU.DATA_FILTERS.TARGET.ADD_TITLE' | translate }}</span>
            <button class="s-btn-icon" (click)="targetModal.set(false)">x</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">{{ saveError() }}</div> }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.DATA_FILTERS.TARGET.TYPE' | translate }}</label>
                <select class="s-select" [(ngModel)]="tf.targetType" (ngModelChange)="onTargetTypeChange()">
                  @for (type of TARGET_TYPES; track type) { <option [value]="type">{{ type }}</option> }
                </select>
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ targetInputLabel() }} *</label>
                <input class="s-input mono" [(ngModel)]="tf.targetId" [attr.list]="targetListId()" [placeholder]="targetPlaceholder()" />
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="targetModal.set(false)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveTarget()" [disabled]="saving()">{{ saving() ? ('COMMON.SAVING' | translate) : ('SECU.DATA_FILTERS.TARGET.ADD_BTN' | translate) }}</button>
          </div>
        </div>
      </div>
    }

    @if (deleteModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'SECU.DATA_FILTERS.DELETE.TITLE' | translate }}</span>
            <button class="s-btn-icon" (click)="deleteModal.set(null)">x</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2);">{{ 'SECU.DATA_FILTERS.DELETE.CONFIRM' | translate }} <strong class="mono" style="color:var(--s-accent);">{{ deleteModal()!.filterCode }}</strong>?</p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteModal.set(null)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="doDelete()">{{ 'COMMON.DELETE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DataFiltersComponent implements OnInit {
  private readonly api = inject(SecuApiService);
  readonly permissionService = inject(PermissionService);
  readonly PAGE_CODE = PAGE_CODE;

  readonly OPERATORS = OPERATORS;
  readonly CONJUNCTIONS = CONJUNCTIONS;
  readonly VALUE_TYPES = VALUE_TYPES;
  readonly TARGET_TYPES = TARGET_TYPES;

  filters = signal<SecuDataFilterDto[]>([]);
  entities = signal<SecuEntityDto[]>([]);
  fields = signal<SecuFieldDto[]>([]);
  companies = signal<RefCompanyDto[]>([]);
  users = signal<SecuUserDto[]>([]);
  roles = signal<SecuRoleDto[]>([]);
  groups = signal<SecuGroupDto[]>([]);
  selected = signal<SecuDataFilterDto | null>(null);
  loading = signal(true);
  totalRecords = signal(0);
  totalPages = signal(1);

  search = '';
  entityFilter = '';
  includeInactive = false;
  page = 1;
  pageSize = 20;
  detailTab = signal<DetailTab>('rules');
  effectiveFilters = signal<SecuDataFilterDto[]>([]);
  effectiveLoading = signal(false);
  effectiveTenantId = '';

  filterModal = signal(false);
  ruleModal = signal(false);
  targetModal = signal(false);
  deleteModal = signal<SecuDataFilterDto | null>(null);
  editingFilter = signal<SecuDataFilterDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  ruleFieldText = '';

  ff = { filterCode: '', entityName: '', description: '', tenantId: '', isActive: true };
  rf = { fieldId: 0, operator: 'Equals', value: '', value2: '', valueType: null as string | null, conjunction: 'AND', groupIndex: 0 };
  tf = { targetType: 'User', targetId: '' };

  ngOnInit() {
    this.loadCatalogs();
    this.load();
  }

  loadCatalogs() {
    forkJoin({
      entities: this.api.getEntities({ size: 1000 }).pipe(catchError(() => of(null))),
      companies: this.api.getCompanies({ size: 1000 }).pipe(catchError(() => of(null))),
      users: this.api.getUsers({ size: 200, includeInactive: true }).pipe(catchError(() => of(null))),
      roles: this.api.getRoles({ size: 200, includeInactive: true }).pipe(catchError(() => of(null))),
      groups: this.api.getGroups({ size: 200, includeInactive: true }).pipe(catchError(() => of(null))),
    }).subscribe(result => {
      if (result.entities) this.entities.set(result.entities.data);
      if (result.companies) this.companies.set(result.companies.data);
      if (result.users) this.users.set(result.users.data);
      if (result.roles) this.roles.set(result.roles.data);
      if (result.groups) this.groups.set(result.groups.data);
      const selected = this.selected();
      if (selected) this.loadFieldsForFilter(selected);
    });
  }

  load() {
    this.loading.set(true);
    this.api.getDataFilters({
      page: this.page,
      size: this.pageSize,
      search: this.search,
      entityName: this.entityFilter,
      includeInactive: this.includeInactive,
    })
      .pipe(catchError(() => of(null)))
      .subscribe(result => {
        if (result) {
          this.filters.set(result.data);
          this.page = result.page;
          this.totalRecords.set(result.totalRecords);
          this.totalPages.set(result.totalPages || 1);
          const current = this.selected();
          if (current) this.selected.set(result.data.find(f => f.idFilter === current.idFilter) ?? null);
        }
        this.loading.set(false);
      });
  }

  onFilterSearch() {
    this.page = 1;
    this.load();
  }

  onPageChange(page: number) {
    this.page = page;
    this.load();
  }

  select(filter: SecuDataFilterDto) {
    this.selected.set(filter);
    this.detailTab.set('rules');
    this.effectiveTenantId = filter.tenantId ?? '';
    this.loadFieldsForFilter(filter);
  }

  fieldsForSelectedFilter(): SecuFieldDto[] {
    const filter = this.selected();
    if (!filter) return [];
    const entity = this.entities().find(e => e.entityName.toLowerCase() === filter.entityName.toLowerCase());
    return entity ? this.fields().filter(field => field.entityId === entity.idEntity) : [];
  }

  private loadFieldsForFilter(filter: SecuDataFilterDto, search?: string) {
    const entity = this.entities().find(e => e.entityName.toLowerCase() === filter.entityName.toLowerCase());
    if (!entity) {
      this.fields.set([]);
      return;
    }

    this.api.getFields({ entityId: entity.idEntity, search, size: 200, includeInactive: true })
      .pipe(catchError(() => of(null)))
      .subscribe(result => {
        if (!result) return;
        this.fields.update(existing => {
          const byId = new Map(existing.map(field => [field.idField, field]));
          result.data.forEach(field => byId.set(field.idField, field));
          return [...byId.values()];
        });
      });
  }

  fieldOption(field: SecuFieldDto): string {
    return `${field.fieldName}${field.columnName ? ` (${field.columnName})` : ''} #${field.idField}`;
  }

  fieldLabel(rule: SecuDataFilterRuleDto): string {
    return rule.fieldName ? `${rule.fieldName}${rule.columnName ? ` (${rule.columnName})` : ''}` : `Field #${rule.fieldId}`;
  }

  companyLabel(companyCode: string | null): string {
    if (!companyCode) return 'Global';
    const company = this.companies().find(c => c.companyCode === companyCode);
    return company ? `${company.companyCode} - ${company.companyName}` : companyCode;
  }

  targetLabel(target: SecuDataFilterTargetDto): string {
    switch (target.targetType) {
      case 'Tenant':
        return this.companyLabel(target.targetId);
      case 'User': {
        const user = this.users().find(item => item.idUser === target.targetId);
        return user ? `${user.username} - ${user.fullName}` : target.targetId;
      }
      case 'Role': {
        const role = this.roles().find(item => String(item.idRole) === target.targetId);
        return role ? `${role.roleCode} - ${role.roleName}` : target.targetId;
      }
      case 'Group': {
        const group = this.groups().find(item => String(item.idGroup) === target.targetId);
        return group ? `${group.groupCode} - ${group.groupName}` : target.targetId;
      }
      default:
        return target.targetId;
    }
  }

  targetOption(type: 'User' | 'Role' | 'Group', item: SecuUserDto | SecuRoleDto | SecuGroupDto): string {
    if (type === 'User') {
      const user = item as SecuUserDto;
      return `${user.username} - ${user.fullName} #${user.idUser}`;
    }
    if (type === 'Role') {
      const role = item as SecuRoleDto;
      return `${role.roleCode} - ${role.roleName} #${role.idRole}`;
    }
    const group = item as SecuGroupDto;
    return `${group.groupCode} - ${group.groupName} #${group.idGroup}`;
  }

  targetInputLabel(): string {
    switch (this.tf.targetType) {
      case 'Tenant': return 'Company / Tenant';
      case 'User': return 'User';
      case 'Role': return 'Role';
      case 'Group': return 'Group';
      default: return 'Target';
    }
  }

  targetPlaceholder(): string {
    switch (this.tf.targetType) {
      case 'Tenant': return 'Company code';
      case 'User': return 'Search user';
      case 'Role': return 'Search role';
      case 'Group': return 'Search group';
      default: return 'id or code';
    }
  }

  targetListId(): string | null {
    switch (this.tf.targetType) {
      case 'Tenant': return 'dfCompanyList';
      case 'User': return 'dfUserList';
      case 'Role': return 'dfRoleList';
      case 'Group': return 'dfGroupList';
      default: return null;
    }
  }

  onTargetTypeChange() {
    this.tf.targetId = '';
  }

  onRuleFieldInput(value: string) {
    this.ruleFieldText = value;
    const normalized = value.trim().toLowerCase();
    const field = this.fieldsForSelectedFilter().find(item =>
      this.fieldOption(item).toLowerCase() === normalized ||
      item.fieldName.toLowerCase() === normalized ||
      item.columnName?.toLowerCase() === normalized ||
      String(item.idField) === normalized.replace('#', ''));
    this.rf.fieldId = field?.idField ?? 0;
    const filter = this.selected();
    if (!field && filter && normalized.length >= 2) {
      this.loadFieldsForFilter(filter, value.trim());
    }
  }

  loadEffective() {
    const filter = this.selected();
    if (!filter) return;
    this.effectiveLoading.set(true);
    this.api.getEffectiveDataFilters(filter.entityName, this.effectiveTenantId || undefined)
      .pipe(catchError(() => of([])))
      .subscribe(result => {
        this.effectiveFilters.set(result);
        this.effectiveLoading.set(false);
      });
  }

  openCreate() {
    this.editingFilter.set(null);
    this.ff = { filterCode: '', entityName: '', description: '', tenantId: '', isActive: true };
    this.saveError.set(null);
    this.filterModal.set(true);
  }

  openEdit(filter: SecuDataFilterDto) {
    this.editingFilter.set(filter);
    this.ff = {
      filterCode: filter.filterCode,
      entityName: filter.entityName,
      description: filter.description ?? '',
      tenantId: filter.tenantId ?? '',
      isActive: filter.isActive,
    };
    this.saveError.set(null);
    this.filterModal.set(true);
  }

  saveFilter() {
    if (!this.ff.filterCode.trim() || !this.ff.entityName.trim()) {
      this.saveError.set('Filter code and entity are required.');
      return;
    }
    this.saving.set(true);
    const body: CreateSecuDataFilterRequest = {
      filterCode: this.ff.filterCode.trim().toUpperCase(),
      entityName: this.ff.entityName.trim(),
      description: this.ff.description || null,
      tenantId: this.ff.tenantId || null,
      isActive: this.ff.isActive,
    };
    const request = this.editingFilter()
      ? this.api.updateDataFilter(this.editingFilter()!.idFilter, body)
      : this.api.createDataFilter(body);
    request.pipe(catchError(error => {
      this.saveError.set(error.error?.title ?? 'Save failed.');
      this.saving.set(false);
      return of(null);
    })).subscribe(result => {
      this.saving.set(false);
      if (!result) return;
      this.filterModal.set(false);
      this.load();
    });
  }

  askDelete(filter: SecuDataFilterDto) {
    this.deleteModal.set(filter);
  }

  doDelete() {
    const filter = this.deleteModal();
    if (!filter) return;
    this.api.deleteDataFilter(filter.idFilter).pipe(catchError(() => of(null))).subscribe(() => {
      if (this.selected()?.idFilter === filter.idFilter) this.selected.set(null);
      this.deleteModal.set(null);
      this.load();
    });
  }

  openAddRule() {
    const filter = this.selected();
    if (filter) this.loadFieldsForFilter(filter);
    this.rf = { fieldId: 0, operator: 'Equals', value: '', value2: '', valueType: null, conjunction: 'AND', groupIndex: 0 };
    this.ruleFieldText = '';
    this.saveError.set(null);
    this.ruleModal.set(true);
  }

  saveRule() {
    const requiresValue = this.rf.operator !== 'IsNull';
    if (!this.rf.fieldId || (requiresValue && !this.rf.value.trim())) {
      this.saveError.set('Choose a field and enter the required value.');
      return;
    }
    const filter = this.selected();
    if (!filter) return;
    this.saving.set(true);
    const body: CreateSecuDataFilterRuleRequest = {
      fieldId: this.rf.fieldId,
      operator: this.rf.operator,
      value: this.rf.value || null,
      value2: this.rf.value2 || null,
      valueType: this.rf.valueType,
      conjunction: this.rf.conjunction,
      groupIndex: this.rf.groupIndex,
    };
    this.api.createDataFilterRule(filter.idFilter, body).pipe(catchError(error => {
      this.saveError.set(error.error?.title ?? 'Rule save failed.');
      this.saving.set(false);
      return of(null);
    })).subscribe(rule => {
      this.saving.set(false);
      if (!rule) return;
      this.ruleModal.set(false);
      this.selected.set({ ...filter, rules: [...filter.rules, rule] });
      this.filters.update(items => items.map(item => item.idFilter === filter.idFilter ? this.selected()! : item));
    });
  }

  deleteRule(rule: SecuDataFilterRuleDto) {
    const filter = this.selected();
    if (!filter) return;
    this.api.deleteDataFilterRule(rule.idRule).pipe(catchError(() => of(null))).subscribe(() => {
      const updated = { ...filter, rules: filter.rules.filter(item => item.idRule !== rule.idRule) };
      this.selected.set(updated);
      this.filters.update(items => items.map(item => item.idFilter === updated.idFilter ? updated : item));
    });
  }

  openAddTarget() {
    this.tf = { targetType: 'User', targetId: '' };
    this.saveError.set(null);
    this.targetModal.set(true);
  }

  saveTarget() {
    const filter = this.selected();
    if (!filter) return;
    if (!this.tf.targetId.trim()) {
      this.saveError.set('Target id is required.');
      return;
    }
    this.saving.set(true);
    const targetId = this.resolveTargetId();
    const body: CreateSecuDataFilterTargetRequest = {
      targetType: this.tf.targetType,
      targetId,
    };
    this.api.createDataFilterTarget(filter.idFilter, body).pipe(catchError(error => {
      this.saveError.set(error.error?.title ?? 'Target save failed.');
      this.saving.set(false);
      return of(null);
    })).subscribe(target => {
      this.saving.set(false);
      if (!target) return;
      this.targetModal.set(false);
      const updated = { ...filter, targets: [...filter.targets, target] };
      this.selected.set(updated);
      this.filters.update(items => items.map(item => item.idFilter === updated.idFilter ? updated : item));
    });
  }

  private resolveTargetId(): string {
    const value = this.tf.targetId.trim();
    const hash = value.match(/#([^#]+)$/);
    if (hash?.[1]) {
      return hash[1].trim();
    }

    if (this.tf.targetType === 'Tenant') {
      return value.toUpperCase();
    }

    if (this.tf.targetType === 'User') {
      const normalized = value.toLowerCase();
      const user = this.users().find(item =>
        item.idUser.toLowerCase() === normalized ||
        item.username.toLowerCase() === normalized ||
        item.email?.toLowerCase() === normalized ||
        item.externalId?.toLowerCase() === normalized);
      return user?.idUser ?? value;
    }

    if (this.tf.targetType === 'Role') {
      const normalized = value.toUpperCase();
      const role = this.roles().find(item =>
        String(item.idRole) === value ||
        item.roleCode.toUpperCase() === normalized);
      return role ? String(role.idRole) : value;
    }

    if (this.tf.targetType === 'Group') {
      const normalized = value.toUpperCase();
      const group = this.groups().find(item =>
        String(item.idGroup) === value ||
        item.groupCode.toUpperCase() === normalized);
      return group ? String(group.idGroup) : value;
    }

    return value;
  }

  deleteTarget(target: SecuDataFilterTargetDto) {
    const filter = this.selected();
    if (!filter) return;
    this.api.deleteDataFilterTarget(target.idTarget).pipe(catchError(() => of(null))).subscribe(() => {
      const updated = { ...filter, targets: filter.targets.filter(item => item.idTarget !== target.idTarget) };
      this.selected.set(updated);
      this.filters.update(items => items.map(item => item.idFilter === updated.idFilter ? updated : item));
    });
  }

  onBd(event: MouseEvent) {
    if (!(event.target as HTMLElement).classList.contains('s-modal-backdrop')) return;
    this.filterModal.set(false);
    this.ruleModal.set(false);
    this.targetModal.set(false);
    this.deleteModal.set(null);
  }
}

