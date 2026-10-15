import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of, forkJoin } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { SecuPageActionDto, SecuPageDto, SecuActionDto } from '../../models/secu.models';
import { TranslatePipe } from '@ngx-translate/core';

type ViewMode = 'matrix' | 'list';

interface MatrixCell {
  exists: boolean;
  idPageAction: number | null;
  saving: boolean;
}

@Component({
  selector: 'app-page-actions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, TranslatePipe],
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

      /* Matrix */
      .matrix-wrap {
        overflow: auto;
      }
      .matrix-table {
        border-collapse: collapse;
      }
      .matrix-table th,
      .matrix-table td {
        border: 1px solid var(--s-border);
      }
      .matrix-table thead th {
        background: var(--s-bg-3);
        padding: 8px 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--s-text-3);
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .matrix-table thead th:first-child {
        position: sticky;
        left: 0;
        z-index: 3;
        min-width: 160px;
      }
      .matrix-table tbody th {
        text-align: left;
        background: var(--s-bg-3);
        padding: 8px 14px;
        white-space: nowrap;
        position: sticky;
        left: 0;
        z-index: 1;
      }
      .matrix-table tbody td {
        padding: 0;
        text-align: center;
        width: 48px;
        height: 40px;
      }

      .matrix-cell {
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.12s;
      }
      .matrix-cell:hover {
        background: var(--s-bg-4);
      }
      .matrix-cell.has-link {
        background: rgba(52, 211, 153, 0.08);
      }
      .matrix-cell.has-link:hover {
        background: rgba(248, 113, 113, 0.1);
      }
      .matrix-cell.saving-cell {
        pointer-events: none;
        opacity: 0.5;
      }

      .cell-check {
        font-size: 15px;
        color: var(--s-green);
      }
      .cell-empty {
        font-size: 11px;
        color: var(--s-border-2);
      }
      .cell-spin {
        font-size: 12px;
        color: var(--s-text-3);
        animation: spin 0.6s linear infinite;
        display: inline-block;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Page filter chips */
      .page-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 12px 20px;
        border-bottom: 1px solid var(--s-border);
      }
      .page-chip {
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        border: 1px solid var(--s-border);
        background: var(--s-bg-3);
        color: var(--s-text-2);
        transition: all 0.12s;
        white-space: nowrap;
        font-family: var(--s-mono);
      }
      .page-chip:hover {
        border-color: var(--s-accent);
        color: var(--s-accent);
      }
      .page-chip.active {
        background: var(--s-accent-glow);
        border-color: var(--s-accent);
        color: var(--s-accent);
        font-weight: 500;
      }
      .page-chip.all-chip {
        font-family: var(--s-font);
        font-weight: 500;
      }
    `,
  ],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_264' | translate }}</h1>
        <p class="s-page-subtitle">
          Link actions to pages · {{ totalLinks() }} links across {{ allPages().length }} pages
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
            [class.active]="viewMode() === 'list'"
            (click)="viewMode.set('list')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.LIST' | translate }}
          </button>
        </div>
        <button class="s-btn s-btn-primary" (click)="openCreate()">{{ 'DOM_FALLBACK.TEXT_267' | translate }}</button>
      </div>
    </div>

    @if (loading()) {
      <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
    } @else {
      @if (viewMode() === 'matrix') {
        <!-- ── MATRIX VIEW ─────────────────────────────────────────── -->
        <div class="s-card" style="margin-bottom:16px;">
          <div style="padding:12px 20px;border-bottom:1px solid var(--s-border);">
            <div style="font-size:11px;color:var(--s-text-3);margin-bottom:8px;">
              {{ 'DOM_FALLBACK.TEXT_268' | translate }}
            </div>
            <div class="page-chips" style="padding:0;border:none;">
                <div
                  class="page-chip all-chip"
                  [class.active]="!matrixPageFilter().size"
                  (click)="clearMatrixPageFilter()"
                >
                  {{ 'DOM_FALLBACK.TEXT_269' | translate }}
                </div>
              @for (p of allPages(); track p.idPage) {
                <div
                  class="page-chip"
                  [class.active]="matrixPageFilter().has(p.idPage)"
                  (click)="togglePageFilter(p.idPage)"
                >
                  {{ p.pageCode }}
                </div>
              }
            </div>
          </div>

          <div
            style="padding:10px 16px;border-bottom:1px solid var(--s-border);background:var(--s-bg-3);"
          >
            <div
              style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--s-text-2);"
            >
              <span style="display:flex;align-items:center;gap:5px;"
                ><span style="font-size:14px;color:var(--s-green)">✓</span> {{ 'AUTO_INLINE_SECURITY_UI.LINK_EXISTS_CLICK_TO_REMOVE' | translate }}</span
              >
              <span style="display:flex;align-items:center;gap:5px;"
                ><span style="font-size:12px;color:var(--s-border-2)">·</span> {{ 'AUTO_INLINE_SECURITY_UI.NO_LINK_CLICK_TO_CREATE' | translate }}</span
              >
            </div>
          </div>

          <div class="matrix-wrap" style="max-height:65vh;">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>{{ 'DOM_FALLBACK.TEXT_272' | translate }}</th>
                  @for (a of allActions(); track a.idAction) {
                    <th [title]="a.actionName">{{ a.actionCode }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (p of filteredMatrixPages(); track p.idPage) {
                  <tr>
                    <th>
                      <div style="display:flex;flex-direction:column;gap:1px;">
                        <span
                          style="font-family:var(--s-mono);font-size:12px;color:var(--s-accent)"
                          >{{ p.pageCode }}</span
                        >
                        <span style="font-size:10px;color:var(--s-text-3)">{{ p.pageName }}</span>
                      </div>
                    </th>
                    @for (a of allActions(); track a.idAction) {
                      <td>
                        @let cell = getCell(p.idPage, a.idAction);
                        <div
                          class="matrix-cell"
                          [class.has-link]="cell.exists"
                          [class.saving-cell]="cell.saving"
                          (click)="toggleCell(p, a)"
                          [title]="cell.exists ? 'Click to remove link' : 'Click to create link'"
                        >
                          @if (cell.saving) {
                            <span class="cell-spin">⏳</span>
                          } @else if (cell.exists) {
                            <span class="cell-check">✓</span>
                          } @else {
                            <span class="cell-empty">·</span>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
            @if (!filteredMatrixPages().length) {
              <div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_273' | translate }}</div></div>
            }
          </div>
        </div>
      } @else {
        <!-- ── LIST VIEW ───────────────────────────────────────────── -->
        <div class="s-card">
          <div class="s-toolbar">
            <div class="s-search">
              <span class="s-search-icon">🔍</span>
              <input placeholder="{{ 'AUTO_INLINE_SECURITY_UI.SEARCH' | translate }}" [(ngModel)]="listSearch" />
            </div>
            <select class="s-select" style="width:200px;" [(ngModel)]="listPageFilter">
              <option [ngValue]="null">{{ 'DOM_FALLBACK.TEXT_269' | translate }}</option>
              @for (p of allPages(); track p.idPage) {
                <option [ngValue]="p.idPage">{{ p.pageCode }}</option>
              }
            </select>
            <label class="s-toggle">
              <input type="checkbox" [(ngModel)]="includeInactive" (change)="loadData()" />
              <div class="s-toggle-track"></div>
              <div class="s-toggle-thumb"></div>
            </label>
            <span style="font-size:12px;color:var(--s-text-2)">{{ 'COMMON.INACTIVE' | translate }}</span>
          </div>

          <div class="s-table-wrap">
            <table class="s-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ 'SECU.PAGE_ACTIONS.COLUMNS.PAGE' | translate }}</th>
                  <th>{{ 'SECU.PAGE_ACTIONS.COLUMNS.ACTION' | translate }}</th>
                  <th>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                  <th style="width:48px"></th>
                </tr>
              </thead>
              <tbody>
                @for (pa of pagedList(); track pa.idPageAction) {
                  <tr>
                    <td style="color:var(--s-text-3);font-size:12px">{{ pa.idPageAction }}</td>
                    <td>
                      <div style="display:flex;flex-direction:column;gap:1px;">
                        <span class="mono">{{ pa.pageCode }}</span>
                        <span style="font-size:11px;color:var(--s-text-3)">{{ pa.pageName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="s-badge action">{{ pa.actionCode }}</span>
                    </td>
                    <td>
                      <span
                        class="s-badge"
                        [class.active]="pa.isActive"
                        [class.inactive]="!pa.isActive"
                        >{{ pa.isActive ? 'Active' : 'Inactive' }}</span
                      >
                    </td>
                    <td><button class="s-btn-icon danger" (click)="askDelete(pa)">🗑</button></td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5">
                      <div class="s-empty">
                        <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_274' | translate }}</div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <secu-pagination
            [page]="listPage"
            [size]="pageSize"
            [totalRecords]="filteredList().length"
            [totalPages]="listTotalPages()"
            (pageChange)="listPage = $event"
          />
        </div>
      }
    }

    <!-- Quick link modal -->
    @if (createOpen()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'DOM_FALLBACK.TEXT_275' | translate }}</span>
            <button class="s-btn-icon" (click)="createOpen.set(false)">✕</button>
          </div>
          <div class="s-modal-body">
            @if (createError()) {
              <div class="s-alert error">⚠ {{ createError() }}</div>
            }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_276' | translate }}</label>
                <select class="s-select" [(ngModel)]="createForm.pageId">
                  <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.SELECT_PAGE' | translate }}</option>
                  @for (p of allPages(); track p.idPage) {
                    <option [ngValue]="p.idPage">{{ p.pageCode }} — {{ p.pageName }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_278' | translate }}</label>
                <select
                  class="s-select"
                  [(ngModel)]="createForm.actionId"
                  [disabled]="!createForm.pageId"
                >
                  <option [ngValue]="null">{{ 'AUTO_INLINE_SECURITY_UI.SELECT_ACTION' | translate }}</option>
                  @for (a of availableActionsForCreate(); track a.idAction) {
                    <option [ngValue]="a.idAction">{{ a.actionCode }} — {{ a.actionName }}</option>
                  }
                </select>
                @if (createForm.pageId && !availableActionsForCreate().length) {
                  <div style="font-size:11px;color:var(--s-green);margin-top:4px;">
                    {{ 'AUTO_INLINE_SECURITY_UI.ALL_ACTIONS_ALREADY_LINKED_TO_THIS_PAGE' | translate }}
                  </div>
                }
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="createOpen.set(false)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button
              class="s-btn s-btn-primary"
              (click)="doCreate()"
              [disabled]="!createForm.pageId || !createForm.actionId || creating()"
            >
              {{ creating() ? 'Saving…' : 'Create Link' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deleteTarget()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'DOM_FALLBACK.TEXT_281' | translate }}</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2);">
              {{ 'DOM_FALLBACK.TEXT_282' | translate }} <strong class="mono">{{ deleteTarget()!.pageCode }}</strong> ↔
              <span class="s-badge action">{{ deleteTarget()!.actionCode }}</span
              >? <br /><br /><span style="font-size:12px;color:var(--s-amber);"
                >{{ 'AUTO_INLINE_SECURITY_UI.ROLE_PERMISSIONS_USING_THIS_LINK_WILL_ALSO_BE_REMOVED' | translate }}</span
              >
            </p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteTarget.set(null)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="doDelete()">{{ 'AUTO_SECURITY_UI.REMOVE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PageActionsListComponent implements OnInit {
  private api = inject(SecuApiService);

  allPageActions = signal<SecuPageActionDto[]>([]);
  allPages = signal<SecuPageDto[]>([]);
  allActions = signal<SecuActionDto[]>([]);
  loading = signal(true);

  viewMode = signal<ViewMode>('matrix');
  includeInactive = false;

  // Matrix state
  matrixPageFilter = signal(new Set<number>());
  /** Map key: `pageId_actionId` → cell state */
  cellMap = signal(new Map<string, MatrixCell>());

  // List state
  listSearch = '';
  listPageFilter: number | null = null;
  listPage = 1;
  pageSize = 20;

  // Modal
  createOpen = signal(false);
  createError = signal<string | null>(null);
  creating = signal(false);
  createForm: { pageId: number | null; actionId: number | null } = { pageId: null, actionId: null };
  deleteTarget = signal<SecuPageActionDto | null>(null);

  totalLinks = computed(() => this.allPageActions().filter((pa) => pa.isActive).length);

  filteredMatrixPages = computed(() => {
    const filter = this.matrixPageFilter();
    if (!filter.size) return this.allPages();
    return this.allPages().filter((p) => filter.has(p.idPage));
  });

  filteredList = computed(() => {
    const q = this.listSearch.trim().toLowerCase();
    return this.allPageActions().filter((pa) => {
      if (this.listPageFilter && pa.pageId !== this.listPageFilter) return false;
      if (!q) return true;
      return (
        pa.pageCode.toLowerCase().includes(q) ||
        pa.actionCode.toLowerCase().includes(q) ||
        pa.pageName.toLowerCase().includes(q)
      );
    });
  });

  pagedList = computed(() => {
    const start = (this.listPage - 1) * this.pageSize;
    return this.filteredList().slice(start, start + this.pageSize);
  });

  listTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredList().length / this.pageSize)),
  );

  availableActionsForCreate = computed(() => {
    if (!this.createForm.pageId) return this.allActions();
    const linked = new Set(
      this.allPageActions()
        .filter((pa) => pa.pageId === this.createForm.pageId && pa.isActive)
        .map((pa) => pa.actionId),
    );
    return this.allActions().filter((a) => !linked.has(a.idAction) && a.isActive);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      pas: this.api
        .getPageActions({ size: 1000, includeInactive: this.includeInactive })
        .pipe(catchError(() => of(null))),
      pages: this.api.getPages({ size: 500 }).pipe(catchError(() => of(null))),
      actions: this.api.getActionsCatalog({ size: 200 }).pipe(catchError(() => of(null))),
    }).subscribe((r) => {
      if (r.pas) this.allPageActions.set(r.pas.data);
      if (r.pages)
        this.allPages.set(r.pages.data.sort((a, b) => a.pageCode.localeCompare(b.pageCode)));
      if (r.actions)
        this.allActions.set(
          r.actions.data.sort((a, b) => a.actionCode.localeCompare(b.actionCode)),
        );
      this.buildCellMap(r.pas?.data ?? []);
      this.loading.set(false);
    });
  }

  buildCellMap(pas: SecuPageActionDto[]) {
    const map = new Map<string, MatrixCell>();
    // Init all cells as empty
    for (const p of this.allPages()) {
      for (const a of this.allActions()) {
        map.set(`${p.idPage}_${a.idAction}`, { exists: false, idPageAction: null, saving: false });
      }
    }
    // Mark existing links
    for (const pa of pas) {
      if (pa.isActive) {
        const key = `${pa.pageId}_${pa.actionId}`;
        map.set(key, { exists: true, idPageAction: pa.idPageAction, saving: false });
      }
    }
    this.cellMap.set(map);
  }

  getCell(pageId: number, actionId: number): MatrixCell {
    return (
      this.cellMap().get(`${pageId}_${actionId}`) ?? {
        exists: false,
        idPageAction: null,
        saving: false,
      }
    );
  }

  togglePageFilter(id: number) {
    const s = new Set(this.matrixPageFilter());
    s.has(id) ? s.delete(id) : s.add(id);
    this.matrixPageFilter.set(s);
  }

  clearMatrixPageFilter() {
    this.matrixPageFilter.set(new Set<number>());
  }

  toggleCell(page: SecuPageDto, action: SecuActionDto) {
    const key = `${page.idPage}_${action.idAction}`;
    const cell = this.cellMap().get(key);
    if (!cell || cell.saving) return;

    // Optimistic update
    const newMap = new Map(this.cellMap());
    newMap.set(key, { ...cell, saving: true });
    this.cellMap.set(newMap);

    if (cell.exists && cell.idPageAction) {
      // Delete
      this.api
        .deletePageAction(cell.idPageAction)
        .pipe(catchError(() => of(null)))
        .subscribe(() => {
          const m = new Map(this.cellMap());
          m.set(key, { exists: false, idPageAction: null, saving: false });
          this.cellMap.set(m);
          this.allPageActions.update((list) =>
            list.filter((pa) => pa.idPageAction !== cell.idPageAction),
          );
        });
    } else {
      // Create
      this.api
        .createPageAction({ pageId: page.idPage, actionId: action.idAction })
        .pipe(catchError(() => of(null)))
        .subscribe((pa) => {
          const m = new Map(this.cellMap());
          if (pa) {
            m.set(key, { exists: true, idPageAction: pa.idPageAction, saving: false });
            this.allPageActions.update((list) => [...list, pa]);
          } else {
            m.set(key, { ...cell, saving: false });
          }
          this.cellMap.set(m);
        });
    }
  }

  openCreate() {
    this.createForm = { pageId: null, actionId: null };
    this.createError.set(null);
    this.createOpen.set(true);
  }

  doCreate() {
    if (!this.createForm.pageId || !this.createForm.actionId) return;
    this.creating.set(true);
    this.api
      .createPageAction({ pageId: this.createForm.pageId, actionId: this.createForm.actionId })
      .pipe(
        catchError((e) => {
          this.createError.set(e.message);
          this.creating.set(false);
          return of(null);
        }),
      )
      .subscribe((pa) => {
        this.creating.set(false);
        if (pa) {
          this.createOpen.set(false);
          this.allPageActions.update((list) => [...list, pa]);
          const key = `${pa.pageId}_${pa.actionId}`;
          const m = new Map(this.cellMap());
          m.set(key, { exists: true, idPageAction: pa.idPageAction, saving: false });
          this.cellMap.set(m);
        }
      });
  }

  askDelete(pa: SecuPageActionDto) {
    this.deleteTarget.set(pa);
  }

  doDelete() {
    const pa = this.deleteTarget()!;
    this.api
      .deletePageAction(pa.idPageAction)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.allPageActions.update((list) =>
          list.filter((x) => x.idPageAction !== pa.idPageAction),
        );
        const key = `${pa.pageId}_${pa.actionId}`;
        const m = new Map(this.cellMap());
        m.set(key, { exists: false, idPageAction: null, saving: false });
        this.cellMap.set(m);
      });
  }

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.createOpen.set(false);
      this.deleteTarget.set(null);
    }
  }

  // needed for template
  protected readonly newSet = (v: Set<number>) => new Set(v);
  new = Set;
}

