import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import {
  RefCompanyDto,
  RefCompanyTypeDto,
  CreateRefCompanyRequest,
  UpdateRefCompanyRequest,
  CreateRefCompanyTypeRequest,
} from '../../models/secu.models';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'COMPANIES';

type Tab = 'companies' | 'types';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, PermActionDirective, TranslatePipe],
  styles: [
    `
      .add-select {
        background: var(--s-bg-3);
        border: 1px solid var(--s-accent);
        border-radius: 6px;
        color: var(--s-text);
        font-family: var(--s-font);
        font-size: 13px;
        padding: 5px 10px;
        outline: none;
        min-width: 200px;
      }
      .row-adding {
        background: rgba(79, 142, 247, 0.05);
      }
    `,
  ],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_226' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'DOM_FALLBACK.TEXT_227' | translate }}</p>
      </div>
    </div>

    <div class="s-card" style="overflow:visible;">
      <div class="s-tabs">
        <div class="s-tab" [class.active]="tab() === 'companies'" (click)="tab.set('companies')">
          {{ 'AUTO_INLINE_SECURITY_UI.COMPANIES' | translate }}
          <span class="s-tab-count">{{ companiesTotalRecords() }}</span>
        </div>
        <div class="s-tab" [class.active]="tab() === 'types'" (click)="tab.set('types')">
          {{ 'AUTO_INLINE_SECURITY_UI.COMPANY_TYPES' | translate }}
          <span class="s-tab-count">{{ typesTotalRecords() }}</span>
        </div>
      </div>

      <!-- �� COMPANIES ��������������������������������������������������� -->
      @if (tab() === 'companies') {
        <div class="s-toolbar" style="justify-content:space-between;">
          <div class="s-search">
            <span class="s-search-icon">�</span>
            <input
              placeholder="{{ 'AUTO_INLINE_SECURITY_UI.SEARCH_COMPANIES' | translate }}"
              [(ngModel)]="compSearch"
              (ngModelChange)="onCompanySearch()"
            />
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <label class="s-toggle">
              <input type="checkbox" [(ngModel)]="compInactive" (change)="onCompanySearch()" />
              <div class="s-toggle-track"></div>
              <div class="s-toggle-thumb"></div>
            </label>
            <span style="font-size:12px;color:var(--s-text-2)">{{ 'COMMON.INACTIVE' | translate }}</span>
            <button class="s-btn s-btn-primary s-btn-sm" [permAction]="permissionService.canCreate(PAGE_CODE)" (click)="openCreateCompany()">
              {{ 'DOM_FALLBACK.TEXT_229' | translate }}
            </button>
          </div>
        </div>

        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th>{{ 'DOM_FALLBACK.TEXT_035' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_043' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_231' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_232' | translate }}</th>
                <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_233' | translate }}</th>
                <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                <th style="width:72px"></th>
              </tr>
            </thead>
            <tbody>
              @for (c of companies(); track c.companyCode) {
                <tr>
                  <td>
                    <span class="mono" style="color:var(--s-accent)">{{ c.companyCode }}</span>
                  </td>
                  <td>{{ c.companyName }}</td>
                  <td>
                    @if (c.parentCompanyCode) {
                      <span class="mono" style="font-size:11px;color:var(--s-purple)">{{
                        c.parentCompanyCode
                      }}</span>
                    } @else {
                      <span style="color:var(--s-text-3)">—</span>
                    }
                  </td>
                  <td>
                    @if (c.companyTypeName) {
                      <span
                        class="s-badge"
                        style="background:var(--s-amber-bg);color:var(--s-amber)"
                        >{{ c.companyTypeName }}</span
                      >
                    } @else {
                      <span style="color:var(--s-text-3)">—</span>
                    }
                  </td>
                  <td style="text-align:center">
                    @if (c.isParent) {
                      <span style="color:var(--s-green)">✓</span>
                    } @else {
                      <span style="color:var(--s-text-3)">—</span>
                    }
                  </td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="c.isActive"
                      [class.inactive]="!c.isActive"
                      >{{ c.isActive ? 'Active' : 'Inactive' }}</span
                    >
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;">
                      <button class="s-btn-icon" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="openEditCompany(c)" title="{{ 'DOM_FALLBACK.TEXT_324' | translate }}">
                        �
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(PAGE_CODE)"
                        (click)="askDeleteCompany(c)"
                        title="{{ 'COMMON.DELETE' | translate }}"
                      >
                        �—‘
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="s-empty">
                      <div class="s-empty-icon">�¢</div>
                      <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_234' | translate }}</div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <secu-pagination
          [page]="compPage"
          [size]="pageSize"
          [totalRecords]="companiesTotalRecords()"
          [totalPages]="companiesTotalPages()"
          (pageChange)="onCompanyPageChange($event)"
        />
      }

      <!-- �� TYPES �������������������������������������������������������� -->
      @if (tab() === 'types') {
        <div class="s-toolbar" style="justify-content:space-between;">
          <div class="s-search">
            <span class="s-search-icon">�</span>
            <input
              placeholder="{{ 'AUTO_INLINE_SECURITY_UI.SEARCH_TYPES' | translate }}"
              [(ngModel)]="typeSearch"
              (ngModelChange)="onTypeSearch()"
            />
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <label class="s-toggle">
              <input type="checkbox" [(ngModel)]="typeInactive" (change)="onTypeSearch()" />
              <div class="s-toggle-track"></div>
              <div class="s-toggle-thumb"></div>
            </label>
            <span style="font-size:12px;color:var(--s-text-2)">{{ 'COMMON.INACTIVE' | translate }}</span>
            <button class="s-btn s-btn-primary s-btn-sm" [permAction]="permissionService.canCreate(PAGE_CODE)" (click)="openCreateType()">
              {{ 'DOM_FALLBACK.TEXT_230' | translate }}
            </button>
          </div>
        </div>

        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ 'DOM_FALLBACK.TEXT_035' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_043' | translate }}</th>
                <th>{{ 'SECU.USERS.COLUMNS.CREATED' | translate }}</th>
                <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                <th style="width:72px"></th>
              </tr>
            </thead>
            <tbody>
              @for (t of types(); track t.idCompanyType) {
                <tr>
                  <td style="color:var(--s-text-3);font-size:12px">{{ t.idCompanyType }}</td>
                  <td>
                    <span class="mono" style="color:var(--s-accent)">{{ t.typeCode }}</span>
                  </td>
                  <td>{{ t.typeName }}</td>
                  <td style="font-size:12px;color:var(--s-text-2)">
                    {{ t.createdAt | date: 'dd/MM/yy' }}
                  </td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="t.isActive"
                      [class.inactive]="!t.isActive"
                      >{{ t.isActive ? 'Active' : 'Inactive' }}</span
                    >
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;">
                      <button class="s-btn-icon" [permAction]="permissionService.canUpdate(PAGE_CODE)" (click)="openEditType(t)">�</button>
                      <button class="s-btn-icon danger" [permAction]="permissionService.canDelete(PAGE_CODE)" (click)="askDeleteType(t)">�—‘</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="s-empty">
                      <div class="s-empty-icon">�·</div>
                      <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_235' | translate }}</div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <secu-pagination
          [page]="typePage"
          [size]="pageSize"
          [totalRecords]="typesTotalRecords()"
          [totalPages]="typesTotalPages()"
          (pageChange)="onTypePageChange($event)"
        />
      }
    </div>

    <!-- ── Company Modal ──────────────────────────────────────────────── -->
    @if (compModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ editCompany() ? 'Edit Company' : 'New Company' }}</span>
            <button class="s-btn-icon" (click)="compModal.set(false)">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error" style="margin-bottom:12px;">�  {{ saveError() }}</div>
            }
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_236' | translate }}</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="cf.companyCode"
                  placeholder="ACME"
                  [disabled]="!!editCompany()"
                  (blur)="cf.companyCode = cf.companyCode.toUpperCase()"
                />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_237' | translate }}</label>
                <input class="s-input" [(ngModel)]="cf.companyName" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.ACME_CORP' | translate }}" />
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_238' | translate }}</label>
                <select class="s-select" [(ngModel)]="cf.parentCompanyCode">
                  <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.NONE' | translate }}</option>
                  @for (c of companyOptions(); track c.companyCode) {
                    @if (c.companyCode !== editCompany()?.companyCode) {
                      <option [value]="c.companyCode">
                        {{ c.companyCode }} — {{ c.companyName }}
                      </option>
                    }
                  }
                </select>
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_239' | translate }}</label>
                <select class="s-select" [(ngModel)]="cf.companyTypeId">
                  <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.NONE' | translate }}</option>
                  @for (t of typeOptions(); track t.idCompanyType) {
                    <option [ngValue]="t.idCompanyType">{{ t.typeCode }} — {{ t.typeName }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="s-form-row">
              <div
                class="s-field"
                style="flex-direction:row;align-items:center;gap:10px;padding-top:8px;"
              >
                <label class="s-toggle">
                  <input type="checkbox" [(ngModel)]="cf.isParent" />
                  <div class="s-toggle-track"></div>
                  <div class="s-toggle-thumb"></div>
                </label>
                <span style="font-size:13px;color:var(--s-text-2)">{{ 'DOM_FALLBACK.TEXT_240' | translate }}</span>
              </div>
              @if (editCompany()) {
                <div
                  class="s-field"
                  style="flex-direction:row;align-items:center;gap:10px;padding-top:8px;"
                >
                  <label class="s-toggle">
                    <input type="checkbox" [(ngModel)]="cf.isActive" />
                    <div class="s-toggle-track"></div>
                    <div class="s-toggle-thumb"></div>
                  </label>
                  <span style="font-size:13px;color:var(--s-text-2)">{{ 'DOM_FALLBACK.TEXT_092' | translate }}</span>
                </div>
              }
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="compModal.set(false)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveCompany()" [disabled]="saving()">
              {{ saving() ? 'Saving�¦' : editCompany() ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Type Modal ─────────────────────────────────────────────────── -->
    @if (typeModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ editType() ? 'Edit Type' : 'New Company Type' }}</span>
            <button class="s-btn-icon" (click)="typeModal.set(false)">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error" style="margin-bottom:12px;">�  {{ saveError() }}</div>
            }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_241' | translate }}</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="tf.typeCode"
                  placeholder="HOLDING"
                  [disabled]="!!editType()"
                  (blur)="tf.typeCode = tf.typeCode.toUpperCase()"
                />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_242' | translate }}</label>
                <input class="s-input" [(ngModel)]="tf.typeName" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.HOLDING_COMPANY' | translate }}" />
              </div>
            </div>
            @if (editType()) {
              <div class="s-form-row single">
                <div
                  class="s-field"
                  style="flex-direction:row;align-items:center;gap:10px;padding-top:4px;"
                >
                  <label class="s-toggle">
                    <input type="checkbox" [(ngModel)]="tf.isActive" />
                    <div class="s-toggle-track"></div>
                    <div class="s-toggle-thumb"></div>
                  </label>
                  <span style="font-size:13px;color:var(--s-text-2)">{{ 'DOM_FALLBACK.TEXT_092' | translate }}</span>
                </div>
              </div>
            }
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="typeModal.set(false)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveType()" [disabled]="saving()">
              {{ saving() ? 'Saving�¦' : editType() ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Delete confirm ─────────────────────────────────────────────── -->
    @if (deleteTarget()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ deleteTarget()!.title }}</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p
              style="font-size:13px;color:var(--s-text-2);"
              [innerHTML]="deleteTarget()!.message"
            ></p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteTarget.set(null)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="runDelete()">{{ 'COMMON.DELETE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CompaniesComponent implements OnInit {
  private api = inject(SecuApiService);
  readonly permissionService = inject(PermissionService);
  readonly PAGE_CODE = PAGE_CODE;

  tab = signal<Tab>('companies');
  companies = signal<RefCompanyDto[]>([]);
  types = signal<RefCompanyTypeDto[]>([]);
  companyOptions = signal<RefCompanyDto[]>([]);
  typeOptions = signal<RefCompanyTypeDto[]>([]);
  companiesTotalRecords = signal(0);
  companiesTotalPages = signal(1);
  typesTotalRecords = signal(0);
  typesTotalPages = signal(1);

  compSearch = '';
  compInactive = false;
  compPage = 1;
  typeSearch = '';
  typeInactive = false;
  typePage = 1;
  pageSize = 20;

  compModal = signal(false);
  typeModal = signal(false);
  editCompany = signal<RefCompanyDto | null>(null);
  editType = signal<RefCompanyTypeDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<{ title: string; message: string; onDelete: () => void } | null>(null);

  cf: {
    companyCode: string;
    companyName: string;
    parentCompanyCode: string | null;
    companyTypeId: number | null;
    isParent: boolean;
    isActive: boolean;
  } = {
    companyCode: '',
    companyName: '',
    parentCompanyCode: null,
    companyTypeId: null,
    isParent: false,
    isActive: true,
  };

  tf: { typeCode: string; typeName: string; isActive: boolean } = {
    typeCode: '',
    typeName: '',
    isActive: true,
  };

  ngOnInit() {
    this.loadCompanies();
    this.loadTypes();
    this.loadCompanyOptions();
    this.loadTypeOptions();
  }

  loadCompanies() {
    this.api
      .getCompanies({
        page: this.compPage,
        size: this.pageSize,
        search: this.compSearch,
        includeInactive: this.compInactive,
      })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (!result) return;
        this.companies.set(result.data);
        this.compPage = result.page;
        this.companiesTotalRecords.set(result.totalRecords);
        this.companiesTotalPages.set(result.totalPages || 1);
      });
  }
  loadTypes() {
    this.api
      .getCompanyTypes({
        page: this.typePage,
        size: this.pageSize,
        search: this.typeSearch,
        includeInactive: this.typeInactive,
      })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (!result) return;
        this.types.set(result.data);
        this.typePage = result.page;
        this.typesTotalRecords.set(result.totalRecords);
        this.typesTotalPages.set(result.totalPages || 1);
      });
  }

  onCompanySearch() {
    this.compPage = 1;
    this.loadCompanies();
  }

  onCompanyPageChange(page: number) {
    this.compPage = page;
    this.loadCompanies();
  }

  onTypeSearch() {
    this.typePage = 1;
    this.loadTypes();
  }

  onTypePageChange(page: number) {
    this.typePage = page;
    this.loadTypes();
  }

  private loadCompanyOptions() {
    this.api
      .getCompanies({ size: 200, includeInactive: true })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result) this.companyOptions.set(result.data);
      });
  }

  private loadTypeOptions() {
    this.api
      .getCompanyTypes({ size: 200, includeInactive: true })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result) this.typeOptions.set(result.data);
      });
  }

  openCreateCompany() {
    this.editCompany.set(null);
    this.cf = {
      companyCode: '',
      companyName: '',
      parentCompanyCode: null,
      companyTypeId: null,
      isParent: false,
      isActive: true,
    };
    this.saveError.set(null);
    this.compModal.set(true);
  }
  openEditCompany(c: RefCompanyDto) {
    this.editCompany.set(c);
    this.cf = {
      companyCode: c.companyCode,
      companyName: c.companyName,
      parentCompanyCode: c.parentCompanyCode,
      companyTypeId: c.companyTypeId,
      isParent: c.isParent,
      isActive: c.isActive,
    };
    this.saveError.set(null);
    this.compModal.set(true);
  }
  saveCompany() {
    if (!this.cf.companyCode.trim() || !this.cf.companyName.trim()) {
      this.saveError.set('Code and Name are required.');
      return;
    }
    this.saving.set(true);
    const req = this.editCompany()
      ? this.api.updateCompany(this.editCompany()!.companyCode, {
          companyName: this.cf.companyName,
          parentCompanyCode: this.cf.parentCompanyCode,
          companyTypeId: this.cf.companyTypeId,
          isParent: this.cf.isParent,
          isActive: this.cf.isActive,
        })
      : this.api.createCompany({
          companyCode: this.cf.companyCode.toUpperCase(),
          companyName: this.cf.companyName,
          parentCompanyCode: this.cf.parentCompanyCode,
          companyTypeId: this.cf.companyTypeId,
          isParent: this.cf.isParent,
        });
    req
      .pipe(
        catchError((e) => {
          this.saveError.set(e.error?.title ?? 'Error');
          this.saving.set(false);
          return of(null);
        }),
      )
      .subscribe((r) => {
        this.saving.set(false);
        if (r) {
          this.compModal.set(false);
          this.loadCompanies();
          this.loadCompanyOptions();
        }
      });
  }
  askDeleteCompany(c: RefCompanyDto) {
    this.deleteTarget.set({
      title: 'Delete Company',
      message: `Delete company <strong class="mono" style="color:var(--s-accent)">${c.companyCode}</strong>?`,
      onDelete: () =>
        this.api
          .deleteCompany(c.companyCode)
          .pipe(catchError(() => of(null)))
          .subscribe(() => {
            this.loadCompanies();
            this.loadCompanyOptions();
          }),
    });
  }

  openCreateType() {
    this.editType.set(null);
    this.tf = { typeCode: '', typeName: '', isActive: true };
    this.saveError.set(null);
    this.typeModal.set(true);
  }
  openEditType(t: RefCompanyTypeDto) {
    this.editType.set(t);
    this.tf = { typeCode: t.typeCode, typeName: t.typeName, isActive: t.isActive };
    this.saveError.set(null);
    this.typeModal.set(true);
  }
  saveType() {
    if (!this.tf.typeCode.trim() || !this.tf.typeName.trim()) {
      this.saveError.set('Code and Name are required.');
      return;
    }
    this.saving.set(true);
    const req = this.editType()
      ? this.api.updateCompanyType(this.editType()!.idCompanyType, {
          typeName: this.tf.typeName,
          isActive: this.tf.isActive,
        })
      : this.api.createCompanyType({
          typeCode: this.tf.typeCode.toUpperCase(),
          typeName: this.tf.typeName,
        });
    req
      .pipe(
        catchError((e) => {
          this.saveError.set(e.error?.title ?? 'Error');
          this.saving.set(false);
          return of(null);
        }),
      )
      .subscribe((r) => {
        this.saving.set(false);
        if (r) {
          this.typeModal.set(false);
          this.loadTypes();
          this.loadTypeOptions();
        }
      });
  }
  askDeleteType(t: RefCompanyTypeDto) {
    this.deleteTarget.set({
      title: 'Delete Type',
      message: `Delete type <strong class="mono" style="color:var(--s-accent)">${t.typeCode}</strong>?`,
      onDelete: () =>
        this.api
          .deleteCompanyType(t.idCompanyType)
          .pipe(catchError(() => of(null)))
          .subscribe(() => {
            this.loadTypes();
            this.loadTypeOptions();
          }),
    });
  }

  runDelete() {
    this.deleteTarget()?.onDelete();
    this.deleteTarget.set(null);
  }
  onBd(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.compModal.set(false);
      this.typeModal.set(false);
      this.deleteTarget.set(null);
    }
  }
}

