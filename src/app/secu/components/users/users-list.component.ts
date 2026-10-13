import { Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, switchMap, catchError, of, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import {
  SecuUserDto,
  CreateSecuUserRequest,
  UpdateSecuUserRequest,
} from '../../models/secu.models';
import { PermActionDirective } from '../../directives/perm-action.directive';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SecuPaginationComponent, PermActionDirective],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">Users</h1>
        <p class="s-page-subtitle">Manage security user profiles</p>
      </div>
      <button
        class="s-btn s-btn-primary"
        [permAction]="permissionService.canCreate(effectivePageCode)"
        (click)="openCreate()"
      >
        + New User
      </button>
    </div>

    <div class="s-card">
      <div class="s-toolbar">
        <div class="s-search">
          <span class="s-search-icon">🔍</span>
          <input
            placeholder="Search users…"
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
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>External ID</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.idUser) {
                <tr>
                  <td>
                    <span class="mono">{{ user.username }}</span>
                  </td>
                  <td>{{ user.fullName }}</td>
                  <td>{{ user.email ?? '—' }}</td>
                  <td>
                    <span
                      style="font-family: var(--s-mono); font-size:11px; color: var(--s-text-3)"
                      >{{ user.externalId ?? '—' }}</span
                    >
                  </td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="user.isActive"
                      [class.inactive]="!user.isActive"
                    >
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td style="color: var(--s-text-2); font-size:12px">
                    {{ user.createdAt | date: 'dd/MM/yy' }}
                  </td>
                  <td>
                    <div style="display:flex; gap:6px; justify-content: flex-end;">
                      <a
                        class="s-btn-icon"
                        [permAction]="permissionService.canRead(effectivePageCode)"
                        [routerLink]="[user.idUser]"
                        title="Detail"
                      >
                        👁
                      </a>
                      <button
                        class="s-btn-icon"
                        [permAction]="permissionService.canUpdate(effectivePageCode)"
                        (click)="openEdit(user)"
                        title="Edit"
                      >
                        ✏
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(effectivePageCode)"
                        (click)="confirmDelete(user)"
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
                    <div class="s-empty">
                      <div class="s-empty-icon">👤</div>
                      <div class="s-empty-text">No users found</div>
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
            <span class="s-modal-title">{{ editUser() ? 'Edit User' : 'Create User' }}</span>
            <button class="s-btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error">⚠ {{ saveError() }}</div>
            }
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">Username *</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.username"
                  placeholder="john.doe"
                  maxlength="100"
                />
              </div>
              <div class="s-field">
                <label class="s-label">Full Name *</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.fullName"
                  placeholder="John Doe"
                  maxlength="200"
                />
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">Email</label>
                <input
                  class="s-input"
                  type="email"
                  [(ngModel)]="form.email"
                  placeholder="john@example.com"
                  maxlength="200"
                />
              </div>
              <div class="s-field">
                <label class="s-label">External ID</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.externalId"
                  placeholder="ext-123"
                  maxlength="200"
                />
              </div>
            </div>
            @if (editUser()) {
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
              {{ saving() ? 'Saving…' : editUser() ? 'Update' : 'Create' }}
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
            <span class="s-modal-title">Delete User</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px; color: var(--s-text-2);">
              Deactivate <strong style="color:var(--s-text)">{{ deleteTarget()!.username }}</strong
              >? This is a soft-delete.
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
export class UsersListComponent implements OnInit {
  private api = inject(SecuApiService);
  public permissionService = inject(PermissionService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  users = signal<SecuUserDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  totalRecords = signal(0);
  totalPages = signal(1);

  /** Fallback if menu mapping not yet available */
  readonly defaultPageCode = 'USERS_MANAGEMENT';
  currentPageCode = signal<string | null>(null);

  page = 1;
  pageSize = 20;
  searchTerm = '';
  includeInactive = false;

  modalOpen = signal(false);
  editUser = signal<SecuUserDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<SecuUserDto | null>(null);

  form: { username: string; fullName: string; email?: string; externalId?: string } = {
    username: '',
    fullName: '',
    email: '',
    externalId: '',
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
            .getUsers({
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
          this.users.set(r.data);
          this.totalRecords.set(r.totalRecords);
          this.totalPages.set(r.totalPages);
        }
      });
    this.setPageCodeFromUrl(this.router.url);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((event: any) => {
      this.setPageCodeFromUrl(event.urlAfterRedirects || event.url || this.router.url);
    });

    this.reload();
  }

  private setPageCodeFromUrl(url: string): void {
    const pageCode = this.permissionService.getPageCodeForUrl(url);
    this.currentPageCode.set(pageCode);
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

  get effectivePageCode(): string {
    return this.currentPageCode() ?? this.defaultPageCode;
  }

  get availableActions(): string[] {
    return this.permissionService.getActionsForPage(this.effectivePageCode);
  }

  openCreate() {
    this.editUser.set(null);
    this.form = { username: '', fullName: '', email: '', externalId: '' };
    this.formActive = true;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(u: SecuUserDto) {
    this.editUser.set(u);
    this.form = {
      username: u.username,
      fullName: u.fullName,
      email: u.email ?? '',
      externalId: u.externalId ?? '',
    };
    this.formActive = u.isActive;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.modalOpen.set(false);
      this.deleteTarget.set(null);
    }
  }

  save() {
    if (!this.form.username.trim() || !this.form.fullName.trim()) {
      this.saveError.set('Username and Full Name are required.');
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    const payload = {
      username: this.form.username.trim(),
      fullName: this.form.fullName.trim(),
      email: this.form.email?.trim() || undefined,
      externalId: this.form.externalId?.trim() || undefined,
    };
    const req = this.editUser()
      ? this.api.updateUser(this.editUser()!.idUser, { ...payload, isActive: this.formActive })
      : this.api.createUser(payload);

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

  confirmDelete(u: SecuUserDto) {
    this.deleteTarget.set(u);
  }

  doDelete() {
    const u = this.deleteTarget();
    if (!u) return;
    this.api
      .deleteUser(u.idUser)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.reload();
      });
  }
}
