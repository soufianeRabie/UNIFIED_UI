import { Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import {
  SecuPolicyDto,
  CreateSecuPolicyRequest,
  UpdateSecuPolicyRequest,
} from '../../models/secu.models';
import { PermActionDirective } from '../../directives/perm-action.directive';

@Component({
  selector: 'app-policies-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, PermActionDirective],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">Policies</h1>
        <p class="s-page-subtitle">Manage security policies</p>
      </div>
      <button class="s-btn s-btn-primary" permAction="SECU_POLICIES:CREATE" (click)="openCreate()">
        + New Policy
      </button>
    </div>

    <div class="s-card">
      <div class="s-toolbar">
        <div class="s-search">
          <span class="s-search-icon">🔍</span>
          <input
            placeholder="Search policies…"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch($event)"
          />
        </div>
        <label class="s-toggle">
          <input type="checkbox" [(ngModel)]="includeInactive" (change)="reload()" />
          <div class="s-toggle-track"></div>
          <div class="s-toggle-thumb"></div>
        </label>
        <span style="font-size:12px; color: var(--s-text-2);">Show inactive</span>
      </div>

      @if (loading()) {
        <div class="s-empty">
          <div class="s-empty-text">Loading…</div>
        </div>
      } @else if (error()) {
        <div class="s-alert error" style="margin:16px;">⚠ {{ error() }}</div>
      } @else {
        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th>Policy Code</th>
                <th>Resource</th>
                <th>Action</th>
                <th>Effect</th>
                <th>Description</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (policy of policies(); track policy.idPolicy) {
                <tr>
                  <td>
                    <span class="mono">{{ policy.policyCode }}</span>
                  </td>
                  <td>{{ policy.resource }}</td>
                  <td>{{ policy.action }}</td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="policy.effect === 'Allow'"
                      [class.inactive]="policy.effect === 'Deny'"
                    >
                      {{ policy.effect }}
                    </span>
                  </td>
                  <td>{{ policy.description ?? '—' }}</td>
                  <td>{{ policy.tenantId ?? '—' }}</td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="policy.isActive"
                      [class.inactive]="!policy.isActive"
                    >
                      {{ policy.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td style="color: var(--s-text-2); font-size:12px">
                    {{ policy.createdAt | date: 'dd/MM/yy' }}
                  </td>
                  <td>
                    <div style="display:flex; gap:6px; justify-content: flex-end;">
                      <button
                        class="s-btn-icon"
                        permAction="SECU_POLICIES:EDIT"
                        (click)="openEdit(policy)"
                        title="Edit"
                      >
                        ✏
                      </button>
                      <button
                        class="s-btn-icon danger"
                        permAction="SECU_POLICIES:DELETE"
                        (click)="confirmDelete(policy)"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">
                    <div class="s-empty">
                      <div class="s-empty-icon">📋</div>
                      <div class="s-empty-text">No policies found</div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <secu-pagination
          [page]="page"
          [size]="pageSize"
          [totalRecords]="totalRecords()"
          [totalPages]="totalPages()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (modalOpen()) {
      <div class="s-modal-backdrop" (click)="onBackdropClick($event)">
        <div class="s-modal">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ editPolicy() ? 'Edit Policy' : 'Create Policy' }}</span>
            <button class="s-btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error">⚠ {{ saveError() }}</div>
            }
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">Policy Code *</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.policyCode"
                  placeholder="READ_USERS"
                  maxlength="100"
                  [disabled]="!!editPolicy()"
                />
              </div>
              <div class="s-field">
                <label class="s-label">Resource *</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.resource"
                  placeholder="users"
                  maxlength="200"
                />
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">Action *</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.action"
                  placeholder="read"
                  maxlength="200"
                />
              </div>
              <div class="s-field">
                <label class="s-label">Effect *</label>
                <select class="s-input" [(ngModel)]="form.effect">
                  <option value="Allow">Allow</option>
                  <option value="Deny">Deny</option>
                </select>
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">Description</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.description"
                  placeholder="Allows reading users"
                  maxlength="500"
                />
              </div>
              <div class="s-field">
                <label class="s-label">Tenant ID</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.tenantId"
                  placeholder="tenant-123"
                  maxlength="100"
                />
              </div>
            </div>
            @if (editPolicy()) {
              <div class="s-form-row single">
                <div class="s-field" style="flex-direction:row; align-items:center; gap:10px;">
                  <label class="s-toggle">
                    <input type="checkbox" [(ngModel)]="formActive" />
                    <div class="s-toggle-track"></div>
                    <div class="s-toggle-thumb"></div>
                  </label>
                  <span class="s-label">Active</span>
                </div>
              </div>
            }
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="s-btn s-btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : editPolicy() ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deleteTarget()) {
      <div class="s-modal-backdrop" (click)="onBackdropClick($event)">
        <div class="s-modal narrow">
          <div class="s-modal-header">
            <span class="s-modal-title">Delete Policy</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px; color: var(--s-text-2);">
              Delete <strong style="color:var(--s-text)">{{ deleteTarget()!.policyCode }}</strong
              >? This action cannot be undone.
            </p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="s-btn s-btn-danger" (click)="doDelete()">Delete</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PoliciesListComponent implements OnInit {
  private api = inject(SecuApiService);
  private destroyRef = inject(DestroyRef);

  policies = signal<SecuPolicyDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  totalRecords = signal(0);
  totalPages = signal(1);

  page = 1;
  pageSize = 20;
  searchTerm = '';
  includeInactive = false;

  modalOpen = signal(false);
  editPolicy = signal<SecuPolicyDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<SecuPolicyDto | null>(null);

  form: {
    policyCode: string;
    resource: string;
    action: string;
    effect: string;
    description?: string;
    tenantId?: string;
  } = {
    policyCode: '',
    resource: '',
    action: '',
    effect: 'Allow',
    description: '',
    tenantId: '',
  };
  formActive = true;

  private search$ = new Subject<void>();

  ngOnInit() {
    this.search$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          this.loading.set(true);
          return this.api
            .getPolicies({
              page: this.page,
              size: this.pageSize,
              search: this.searchTerm,
              includeInactive: this.includeInactive,
            })
            .pipe(
              catchError((e) => {
                this.error.set(e.message);
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => {
        this.loading.set(false);
        if (r) {
          this.policies.set(r.data);
          this.totalRecords.set(r.totalRecords);
          this.totalPages.set(r.totalPages);
        }
      });
    this.reload();
  }

  reload() {
    this.page = 1;
    this.search$.next();
  }
  onSearch(_: string) {
    this.reload();
  }
  onPageChange(p: number) {
    this.page = p;
    this.search$.next();
  }

  openCreate() {
    this.editPolicy.set(null);
    this.form = {
      policyCode: '',
      resource: '',
      action: '',
      effect: 'Allow',
      description: '',
      tenantId: '',
    };
    this.formActive = true;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(p: SecuPolicyDto) {
    this.editPolicy.set(p);
    this.form = {
      policyCode: p.policyCode,
      resource: p.resource,
      action: p.action,
      effect: p.effect,
      description: p.description ?? '',
      tenantId: p.tenantId ?? '',
    };
    this.formActive = p.isActive;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.closeModal();
      this.deleteTarget.set(null);
    }
  }

  save() {
    if (
      !this.form.policyCode.trim() ||
      !this.form.resource.trim() ||
      !this.form.action.trim() ||
      !this.form.effect
    ) {
      this.saveError.set('Policy Code, Resource, Action, and Effect are required.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    if (this.editPolicy()) {
      const payload: UpdateSecuPolicyRequest = {
        policyCode: this.form.policyCode.trim(),
        resource: this.form.resource.trim(),
        action: this.form.action.trim(),
        effect: this.form.effect,
        description: this.form.description?.trim() || undefined,
        tenantId: this.form.tenantId?.trim() || undefined,
        isActive: this.formActive,
      };
      this.api
        .updatePolicy(this.editPolicy()!.idPolicy, payload)
        .pipe(
          catchError((e) => {
            this.saveError.set(e.message);
            this.saving.set(false);
            return of(null);
          }),
        )
        .subscribe((r) => {
          this.saving.set(false);
          if (r) {
            this.closeModal();
            this.reload();
          }
        });
    } else {
      const payload: CreateSecuPolicyRequest = {
        policyCode: this.form.policyCode.trim(),
        resource: this.form.resource.trim(),
        action: this.form.action.trim(),
        effect: this.form.effect,
        description: this.form.description?.trim() || undefined,
        tenantId: this.form.tenantId?.trim() || undefined,
        isActive: true,
      };
      this.api
        .createPolicy(payload)
        .pipe(
          catchError((e) => {
            this.saveError.set(e.message);
            this.saving.set(false);
            return of(null);
          }),
        )
        .subscribe((r) => {
          this.saving.set(false);
          if (r) {
            this.closeModal();
            this.reload();
          }
        });
    }
  }

  confirmDelete(p: SecuPolicyDto) {
    this.deleteTarget.set(p);
  }

  doDelete() {
    const p = this.deleteTarget();
    if (!p) return;
    this.api
      .deletePolicy(p.idPolicy)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.reload();
      });
  }
}
