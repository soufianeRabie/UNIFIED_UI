import { Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, catchError, of, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { SecuRoleDto } from '../../models/secu.models';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SecuPaginationComponent, PermActionDirective],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">Roles</h1>
        <p class="s-page-subtitle">Define roles and their permissions</p>
      </div>
      <button
        class="s-btn s-btn-primary"
        [permAction]="permissionService.canCreate(effectivePageCode)"
        (click)="openCreate()"
      >
        + New Role
      </button>
    </div>

    <div class="s-card">
      <div class="s-toolbar">
        <div class="s-search">
          <span class="s-search-icon">🔍</span>
          <input placeholder="Search roles…" [(ngModel)]="searchTerm" (ngModelChange)="reload()" />
        </div>
        <label class="s-toggle">
          <input type="checkbox" [(ngModel)]="includeInactive" (change)="reload()" />
          <div class="s-toggle-track"></div>
          <div class="s-toggle-thumb"></div>
        </label>
        <span style="font-size:12px; color: var(--s-text-2);">Show inactive</span>
      </div>

      @if (loading()) {
        <div class="s-empty"><div class="s-empty-text">Loading…</div></div>
      } @else {
        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Code</th>
                <th>Name</th>
                <th>App</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of roles(); track r.idRole) {
                <tr>
                  <td style="color:var(--s-text-3); font-size:12px">{{ r.idRole }}</td>
                  <td>
                    <span class="mono" style="color: var(--s-accent)">{{ r.roleCode }}</span>
                  </td>
                  <td>{{ r.roleName }}</td>
                  <td>
                    <span style="font-size:11px; color:var(--s-text-3)">{{ r.appCode }}</span>
                  </td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="r.isActive"
                      [class.inactive]="!r.isActive"
                    >
                      {{ r.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td style="color:var(--s-text-2);font-size:12px">
                    {{ r.createdAt | date: 'dd/MM/yy' }}
                  </td>
                  <td>
                    <div style="display:flex; gap:6px; justify-content:flex-end">
                      <a
                        class="s-btn-icon"
                        [permAction]="permissionService.canRead(effectivePageCode)"
                        [routerLink]="[r.idRole]"
                        title="View permissions"
                        >👁</a
                      >
                      <button
                        class="s-btn-icon"
                        [permAction]="permissionService.canUpdate(effectivePageCode)"
                        (click)="openEdit(r)"
                        title="Edit"
                      >
                        ✏
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(effectivePageCode)"
                        (click)="confirmDelete(r)"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="s-empty"><div class="s-empty-text">No roles found</div></div>
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

    @if (modalOpen()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal narrow">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ editRole() ? 'Edit Role' : 'Create Role' }}</span>
            <button class="s-btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error">⚠ {{ saveError() }}</div>
            }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">Role Code * (A-Z, 0-9, _)</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.roleCode"
                  placeholder="FLEET_MANAGER"
                  style="text-transform:uppercase"
                  maxlength="50"
                />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">Role Name *</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.roleName"
                  placeholder="Fleet Manager"
                  maxlength="150"
                />
              </div>
            </div>
            @if (editRole()) {
              <div
                class="s-field"
                style="flex-direction:row; align-items:center; gap:10px; margin-top:4px;"
              >
                <label class="s-toggle">
                  <input type="checkbox" [(ngModel)]="formActive" />
                  <div class="s-toggle-track"></div>
                  <div class="s-toggle-thumb"></div>
                </label>
                <span class="s-label">Active</span>
              </div>
            }
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="s-btn s-btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : editRole() ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal narrow">
          <div class="s-modal-header">
            <span class="s-modal-title">Delete Role</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px; color: var(--s-text-2);">
              Deactivate role
              <strong style="color:var(--s-accent);font-family:var(--s-mono)">{{
                deleteTarget()!.roleCode
              }}</strong
              >?
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
export class RolesListComponent implements OnInit {
  private api = inject(SecuApiService);
  public permissionService = inject(PermissionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** Fallback for required permission checks */
  readonly defaultPageCode = 'ROLES_MANAGEMENT';
  currentPageCode = signal<string | null>(null);

  roles = signal<SecuRoleDto[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  totalPages = signal(1);
  page = 1;
  pageSize = 20;
  searchTerm = '';
  includeInactive = false;

  modalOpen = signal(false);
  editRole = signal<SecuRoleDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<SecuRoleDto | null>(null);

  form = { roleCode: '', roleName: '' };
  formActive = true;

  private search$ = new Subject<void>();

  ngOnInit() {
    this.setPageCodeFromUrl(this.router.url);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((event: any) => {
      this.setPageCodeFromUrl(event.urlAfterRedirects || event.url || this.router.url);
    });

    this.search$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          this.loading.set(true);
          return this.api
            .getRoles({
              page: this.page,
              size: this.pageSize,
              search: this.searchTerm,
              includeInactive: this.includeInactive,
            })
            .pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => {
        this.loading.set(false);
        if (r) {
          this.roles.set(r.data);
          this.totalRecords.set(r.totalRecords);
          this.totalPages.set(r.totalPages);
        }
      });
    this.reload();
  }

  private setPageCodeFromUrl(url: string): void {
    const pageCode = this.permissionService.getPageCodeForUrl(url);
    this.currentPageCode.set(pageCode);
  }

  get effectivePageCode(): string {
    return this.currentPageCode() ?? this.defaultPageCode;
  }

  reload() {
    this.page = 1;
    this.search$.next();
  }
  onPageChange(p: number) {
    this.page = p;
    this.search$.next();
  }

  openCreate() {
    this.editRole.set(null);
    this.form = { roleCode: '', roleName: '' };
    this.formActive = true;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(r: SecuRoleDto) {
    this.editRole.set(r);
    this.form = { roleCode: r.roleCode, roleName: r.roleName };
    this.formActive = r.isActive;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.modalOpen.set(false);
      this.deleteTarget.set(null);
    }
  }

  save() {
    if (!this.form.roleCode.trim() || !this.form.roleName.trim()) {
      this.saveError.set('Code and Name are required.');
      return;
    }
    this.saving.set(true);
    const payload = { roleCode: this.form.roleCode.toUpperCase(), roleName: this.form.roleName };
    const req = this.editRole()
      ? this.api.updateRole(this.editRole()!.idRole, { ...payload, isActive: this.formActive })
      : this.api.createRole(payload);
    req
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

  confirmDelete(r: SecuRoleDto) {
    this.deleteTarget.set(r);
  }

  doDelete() {
    this.api
      .deleteRole(this.deleteTarget()!.idRole)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.reload();
      });
  }
}
