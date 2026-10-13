import { Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, catchError, of, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { SecuGroupDto } from '../../models/secu.models';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SecuPaginationComponent, PermActionDirective],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">Groups</h1>
        <p class="s-page-subtitle">Organize users into groups with shared roles</p>
      </div>
      <button
        class="s-btn s-btn-primary"
        [permAction]="permissionService.canCreate(effectivePageCode)"
        (click)="openCreate()"
      >
        + New Group
      </button>
    </div>

    <div class="s-card">
      <div class="s-toolbar">
        <div class="s-search">
          <span class="s-search-icon">🔍</span>
          <input placeholder="Search groups…" [(ngModel)]="searchTerm" (ngModelChange)="reload()" />
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
              @for (g of groups(); track g.idGroup) {
                <tr>
                  <td style="color:var(--s-text-3);font-size:12px">{{ g.idGroup }}</td>
                  <td>
                    <span class="mono" style="color:var(--s-purple)">{{ g.groupCode }}</span>
                  </td>
                  <td>{{ g.groupName }}</td>
                  <td>
                    <span style="font-size:11px;color:var(--s-text-3)">{{ g.appCode }}</span>
                  </td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="g.isActive"
                      [class.inactive]="!g.isActive"
                      >{{ g.isActive ? 'Active' : 'Inactive' }}</span
                    >
                  </td>
                  <td style="color:var(--s-text-2);font-size:12px">
                    {{ g.createdAt | date: 'dd/MM/yy' }}
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;justify-content:flex-end">
                      <a
                        class="s-btn-icon"
                        [permAction]="permissionService.canRead(effectivePageCode)"
                        [routerLink]="[g.idGroup]"
                        title="Manage roles"
                        >👁</a
                      >
                      <button
                        class="s-btn-icon"
                        [permAction]="permissionService.canUpdate(effectivePageCode)"
                        (click)="openEdit(g)"
                      >
                        ✏
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(effectivePageCode)"
                        (click)="confirmDelete(g)"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="s-empty"><div class="s-empty-text">No groups found</div></div>
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
            <span class="s-modal-title">{{ editGroup() ? 'Edit Group' : 'Create Group' }}</span>
            <button class="s-btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error">⚠ {{ saveError() }}</div>
            }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">Group Code *</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.groupCode"
                  placeholder="FLEET_TEAM"
                  maxlength="50"
                />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">Group Name *</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.groupName"
                  placeholder="Fleet Team"
                  maxlength="150"
                />
              </div>
            </div>
            @if (editGroup()) {
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
              {{ saving() ? 'Saving…' : editGroup() ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal narrow">
          <div class="s-modal-header">
            <span class="s-modal-title">Delete Group</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2)">
              Deactivate group
              <strong style="color:var(--s-purple);font-family:var(--s-mono)">{{
                deleteTarget()!.groupCode
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
export class GroupsListComponent implements OnInit {
  private api = inject(SecuApiService);
  private router = inject(Router);
  public permissionService = inject(PermissionService);
  private destroyRef = inject(DestroyRef);

  /** Fallback for required permission checks */
  readonly defaultPageCode = 'GROUPS_MANAGEMENT';
  currentPageCode = signal<string | null>(null);

  groups = signal<SecuGroupDto[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  totalPages = signal(1);
  page = 1;
  pageSize = 20;
  searchTerm = '';
  includeInactive = false;
  modalOpen = signal(false);
  editGroup = signal<SecuGroupDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<SecuGroupDto | null>(null);
  form = { groupCode: '', groupName: '' };
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
            .getGroups({
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
          this.groups.set(r.data);
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
    this.editGroup.set(null);
    this.form = { groupCode: '', groupName: '' };
    this.formActive = true;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }
  openEdit(g: SecuGroupDto) {
    this.editGroup.set(g);
    this.form = { groupCode: g.groupCode, groupName: g.groupName };
    this.formActive = g.isActive;
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
    if (!this.form.groupCode.trim() || !this.form.groupName.trim()) {
      this.saveError.set('Code and Name required');
      return;
    }
    this.saving.set(true);
    const payload = {
      groupCode: this.form.groupCode.toUpperCase(),
      groupName: this.form.groupName,
    };
    const req = this.editGroup()
      ? this.api.updateGroup(this.editGroup()!.idGroup, { ...payload, isActive: this.formActive })
      : this.api.createGroup(payload);
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
  confirmDelete(g: SecuGroupDto) {
    this.deleteTarget.set(g);
  }
  doDelete() {
    this.api
      .deleteGroup(this.deleteTarget()!.idGroup)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.reload();
      });
  }
}
