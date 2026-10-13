import { Component, DestroyRef, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { SecuActionDto } from '../../models/secu.models';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { PermissionService } from '../../services/permission.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-actions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, PermActionDirective, TranslatePipe],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'SECU.ACTIONS.TITLE' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'SECU.ACTIONS.SUBTITLE' | translate }}</p>
      </div>
      <button
        class="s-btn s-btn-primary"
        [permAction]="permissionService.canCreate(effectivePageCode())"
        (click)="openCreate()"
      >
        {{ 'SECU.ACTIONS.NEW' | translate }}
      </button>
    </div>

    <div class="s-card">
      <div class="s-toolbar">
        <div class="s-search">
          <span class="s-search-icon">🔍</span>
          <input
            [placeholder]="'SECU.ACTIONS.SEARCH_PLACEHOLDER' | translate"
            [(ngModel)]="searchTerm"
            (ngModelChange)="reload()"
          />
        </div>
        <label class="s-toggle">
          <input type="checkbox" [(ngModel)]="includeInactive" (change)="reload()" />
          <div class="s-toggle-track"></div>
          <div class="s-toggle-thumb"></div>
        </label>
        <span style="font-size:12px;color:var(--s-text-2)">{{ 'COMMON.SHOW_INACTIVE' | translate }}</span>
      </div>

      @if (loading()) {
        <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
      } @else {
        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'COMMON.CODE' | translate }}</th>
                <th>{{ 'COMMON.NAME' | translate }}</th>
                <th>{{ 'COMMON.STATUS' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (a of actions(); track a.idAction) {
                <tr>
                  <td style="color:var(--s-text-3);font-size:12px">{{ a.idAction }}</td>
                  <td>
                    <span class="s-badge action">{{ a.actionCode }}</span>
                  </td>
                  <td>{{ a.actionName }}</td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="a.isActive"
                      [class.inactive]="!a.isActive"
                      >{{ (a.isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE') | translate }}</span
                    >
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;justify-content:flex-end">
                      <button
                        class="s-btn-icon"
                        [permAction]="permissionService.canUpdate(effectivePageCode())"
                        (click)="openEdit(a)"
                      >
                        ✏
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(effectivePageCode())"
                        (click)="confirmDelete(a)"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">
                    <div class="s-empty"><div class="s-empty-text">{{ 'SECU.ACTIONS.EMPTY' | translate }}</div></div>
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
            <span class="s-modal-title">{{ (editAction() ? 'SECU.ACTIONS.EDIT_TITLE' : 'SECU.ACTIONS.CREATE_TITLE') | translate }}</span>
            <button class="s-btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error">⚠ {{ saveError() }}</div>
            }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.ACTIONS.FIELDS.CODE' | translate }}</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.actionCode"
                  placeholder="VIEW"
                  style="text-transform:uppercase"
                  maxlength="50"
                />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'SECU.ACTIONS.FIELDS.NAME' | translate }}</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.actionName"
                  placeholder="{{ 'AUTO_INLINE_SECURITY_UI.VIEW' | translate }}"
                  maxlength="150"
                />
              </div>
            </div>
            @if (editAction()) {
              <div
                class="s-field"
                style="flex-direction:row;align-items:center;gap:10px;margin-top:4px"
              >
                <label class="s-toggle">
                  <input type="checkbox" [(ngModel)]="formActive" />
                  <div class="s-toggle-track"></div>
                  <div class="s-toggle-thumb"></div>
                </label>
                <span class="s-label">{{ 'COMMON.ACTIVE' | translate }}</span>
              </div>
            }
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="closeModal()">{{ 'COMMON.CANCEL' | translate }}</button>
            <button
              class="s-btn s-btn-primary"
              [permAction]="
                editAction()
                  ? permissionService.canUpdate(effectivePageCode())
                  : permissionService.canCreate(effectivePageCode())
              "
              (click)="save()"
              [disabled]="saving()"
            >
              {{ saving() ? ('COMMON.SAVING' | translate) : (editAction() ? ('COMMON.UPDATE' | translate) : ('COMMON.CREATE' | translate)) }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal narrow">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'SECU.ACTIONS.DELETE_TITLE' | translate }}</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2)">
              {{ 'AUTO_INLINE_SECURITY_UI.DELETE_ACTION' | translate }} <strong class="s-badge action">{{ deleteTarget()!.actionCode }}</strong
              >?
            </p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteTarget.set(null)">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="doDelete()">{{ 'COMMON.DELETE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ActionsListComponent implements OnInit {
  private api = inject(SecuApiService);
  private router = inject(Router);
  public permissionService = inject(PermissionService);
  private destroyRef = inject(DestroyRef);

  readonly defaultPageCode = 'SECU_ACTIONS';

  actions = signal<SecuActionDto[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  totalPages = signal(1);
  page = 1;
  pageSize = 20;
  searchTerm = '';
  includeInactive = false;
  modalOpen = signal(false);
  editAction = signal<SecuActionDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<SecuActionDto | null>(null);
  form = { actionCode: '', actionName: '' };
  formActive = true;
  private search$ = new Subject<void>();

  ngOnInit() {
    this.search$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          this.loading.set(true);
          return this.api
            .getActionsCatalog({
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
          this.actions.set(r.data);
          this.totalRecords.set(r.totalRecords);
          this.totalPages.set(r.totalPages);
        }
      });
    this.reload();
  }

  readonly effectivePageCode = computed(() => {
    this.permissionService.loaded();
    return this.permissionService.getPageCodeForUrl(this.router.url) ?? this.defaultPageCode;
  });

  reload() {
    this.page = 1;
    this.search$.next();
  }
  onPageChange(p: number) {
    this.page = p;
    this.search$.next();
  }

  openCreate() {
    this.editAction.set(null);
    this.form = { actionCode: '', actionName: '' };
    this.formActive = true;
    this.saveError.set(null);
    this.modalOpen.set(true);
  }
  openEdit(a: SecuActionDto) {
    this.editAction.set(a);
    this.form = { actionCode: a.actionCode, actionName: a.actionName };
    this.formActive = a.isActive;
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
    if (!this.form.actionCode.trim() || !this.form.actionName.trim()) {
      this.saveError.set('Code and Name required');
      return;
    }
    this.saving.set(true);
    const payload = {
      actionCode: this.form.actionCode.toUpperCase(),
      actionName: this.form.actionName,
    };
    const req = this.editAction()
      ? this.api.updateAction(this.editAction()!.idAction, {
          ...payload,
          isActive: this.formActive,
        })
      : this.api.createAction(payload);
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
  confirmDelete(a: SecuActionDto) {
    this.deleteTarget.set(a);
  }
  doDelete() {
    this.api
      .deleteAction(this.deleteTarget()!.idAction)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.reload();
      });
  }
}

