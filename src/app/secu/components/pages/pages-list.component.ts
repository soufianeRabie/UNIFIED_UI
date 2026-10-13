import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { PermissionService } from '../../services/permission.service';
import {
  SecuPageDto,
  CreateSecuPageRequest,
  UpdateSecuPageRequest,
  SecuPageType,
} from '../../models/secu.models';
import { TranslatePipe } from '@ngx-translate/core';

interface TreeNode extends SecuPageDto {
  children: TreeNode[];
  depth: number;
  expanded: boolean;
}

@Component({
  selector: 'app-pages-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, PermActionDirective, TranslatePipe],
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

      /* Tree */
      .tree-table {
        width: 100%;
        border-collapse: collapse;
      }
      .tree-table th {
        padding: 9px 14px;
        font-size: 11px;
        font-weight: 600;
        color: var(--s-text-3);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        background: var(--s-bg-3);
        border-bottom: 1px solid var(--s-border);
      }
      .tree-row td {
        padding: 9px 14px;
        border-bottom: 1px solid var(--s-border);
        vertical-align: middle;
        font-size: 13px;
      }
      .tree-row:last-child td {
        border-bottom: none;
      }
      .tree-row:hover td {
        background: var(--s-bg-3);
      }
      .tree-row.is-child td:first-child {
        position: relative;
      }

      .indent-guide {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .indent-bar {
        display: inline-block;
        width: 1px;
        height: 16px;
        background: var(--s-border);
        margin-right: 3px;
        vertical-align: middle;
      }
      .toggle-btn {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: transparent;
        border: 1px solid var(--s-border);
        color: var(--s-text-3);
        cursor: pointer;
        font-size: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.12s;
      }
      .toggle-btn:hover {
        background: var(--s-bg-4);
        color: var(--s-text);
      }

      .sort-btns {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .sort-btn {
        width: 18px;
        height: 14px;
        border: none;
        background: transparent;
        color: var(--s-text-3);
        cursor: pointer;
        font-size: 9px;
        line-height: 1;
        padding: 0;
        transition: color 0.12s;
      }
      .sort-btn:hover:not(:disabled) {
        color: var(--s-accent);
      }
      .sort-btn:disabled {
        opacity: 0.2;
        cursor: default;
      }

      /* Modal parent picker */
      .parent-option {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: background 0.12s;
      }
      .parent-option:hover {
        background: var(--s-bg-3);
      }
      .parent-option.selected {
        background: var(--s-accent-glow);
        color: var(--s-accent);
      }
      .parent-option.root-opt {
        font-weight: 500;
        border-bottom: 1px solid var(--s-border);
        margin-bottom: 4px;
        padding-bottom: 10px;
      }
    `,
  ],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_284' | translate }}</h1>
        <p class="s-page-subtitle">
          {{ flatPages().length }} pages �· hierarchy defines menu structure
        </p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="view-toggle">
          <button
            class="vt-btn"
            [class.active]="viewMode() === 'tree'"
            (click)="viewMode.set('tree')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.TREE' | translate }}
          </button>
          <button
            class="vt-btn"
            [class.active]="viewMode() === 'flat'"
            (click)="viewMode.set('flat')"
          >
            {{ 'AUTO_INLINE_SECURITY_UI.FLAT' | translate }}
          </button>
        </div>
        <button
          class="s-btn s-btn-primary"
          [permAction]="permissionService.canCreate(effectivePageCode())"
          (click)="openCreate()"
        >
          {{ 'DOM_FALLBACK.TEXT_287' | translate }}
        </button>
      </div>
    </div>

    <div class="s-card">
      <!-- Toolbar -->
      <div class="s-toolbar">
        <div class="s-search">
          <span class="s-search-icon">�</span>
          <input
            placeholder="{{ 'AUTO_INLINE_SECURITY_UI.SEARCH_PAGES' | translate }}"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
          />
        </div>
        <label class="s-toggle">
          <input type="checkbox" [(ngModel)]="includeInactive" (change)="reload()" />
          <div class="s-toggle-track"></div>
          <div class="s-toggle-thumb"></div>
        </label>
        <span style="font-size:12px;color:var(--s-text-2)">{{ 'DOM_FALLBACK.TEXT_288' | translate }}</span>
        @if (viewMode() === 'tree') {
          <button class="s-btn s-btn-ghost s-btn-sm" (click)="treeExpandAll()">{{ 'DOM_FALLBACK.TEXT_289' | translate }}</button>
          <button class="s-btn s-btn-ghost s-btn-sm" (click)="treeCollapseAll()">
            {{ 'DOM_FALLBACK.TEXT_290' | translate }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
      } @else if (viewMode() === 'flat') {
        <!-- ── FLAT TABLE ──────────────────────────────────────────── -->
        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ 'DOM_FALLBACK.TEXT_035' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_043' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_232' | translate }}</th>
                <th>URL</th>
                <th>{{ 'DOM_FALLBACK.TEXT_292' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_231' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_293' | translate }}</th>
                <th>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of pagedFlat(); track p.idPage) {
                <tr>
                  <td style="color:var(--s-text-3);font-size:12px">{{ p.idPage }}</td>
                  <td>
                    <span class="mono">{{ p.pageCode }}</span>
                  </td>
                  <td>{{ p.pageName }}</td>
                  <td>
                    <span class="s-chip">{{ p.pageType ?? 'PAGE' }}</span>
                  </td>
                  <td style="font-family:var(--s-mono);font-size:11px;color:var(--s-text-2)">
                    {{ p.pageUrl ?? '—' }}
                  </td>
                  <td style="font-size:16px">{{ p.icon ?? '—' }}</td>
                  <td>
                    @if (p.parentId) {
                      <span class="mono" style="font-size:11px;color:var(--s-purple)">{{
                        parentLabel(p.parentId)
                      }}</span>
                    } @else {
                      <span style="font-size:11px;color:var(--s-text-3)">{{ 'AUTO_INLINE_SECURITY_UI.ROOT' | translate }}</span>
                    }
                  </td>
                  <td style="color:var(--s-text-2);font-size:12px">{{ p.sortOrder ?? 0 }}</td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="p.isActive"
                      [class.inactive]="!p.isActive"
                      >{{ p.isActive ? 'Active' : 'Inactive' }}</span
                    >
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;justify-content:flex-end;">
                      <button
                        class="s-btn-icon"
                        [permAction]="permissionService.canUpdate(effectivePageCode())"
                        (click)="openEdit(p)"
                      >
                        �
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(effectivePageCode())"
                        (click)="askDelete(p)"
                      >
                        �—‘
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10">
                    <div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_294' | translate }}</div></div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <secu-pagination
          [page]="page"
          [size]="pageSize"
          [totalRecords]="filteredFlat().length"
          [totalPages]="flatTotalPages()"
          (pageChange)="onPageChange($event)"
        />
      } @else {
        <!-- ── TREE VIEW ───────────────────────────────────────────── -->
        <div class="s-table-wrap">
          <table class="tree-table">
            <thead>
              <tr>
                <th>{{ 'SECU.PAGE_ACTIONS.COLUMNS.PAGE' | translate }}</th>
                <th style="width:200px">URL</th>
                <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_232' | translate }}</th>
                <th style="width:60px">{{ 'DOM_FALLBACK.TEXT_292' | translate }}</th>
                <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_293' | translate }}</th>
                <th style="width:80px">{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              @for (row of treeRows(); track row.idPage) {
                <tr class="tree-row" [class.is-child]="row.depth > 0">
                  <td>
                    <div class="indent-guide">
                      @for (d of depthArray(row.depth); track d) {
                        <span class="indent-bar"></span>
                      }
                      @if (row.children.length) {
                        <button class="toggle-btn" (click)="toggleNode(row)">
                          {{ row.expanded ? '�–¾' : '�–¸' }}
                        </button>
                      } @else {
                        <span style="width:18px;display:inline-block;"></span>
                      }
                      <span style="font-size:13px;margin-left:4px;">{{ row.icon ?? '📄' }}</span>
                      <span class="mono" style="color:var(--s-accent);margin-left:4px;">{{
                        row.pageCode
                      }}</span>
                      <span style="color:var(--s-text);margin-left:6px;font-size:13px;">{{
                        row.pageName
                      }}</span>
                    </div>
                  </td>
                  <td style="font-family:var(--s-mono);font-size:11px;color:var(--s-text-2)">
                    {{ row.pageUrl ?? '—' }}
                  </td>
                  <td>
                    <span class="s-chip">{{ row.pageType ?? 'PAGE' }}</span>
                  </td>
                  <td style="font-size:16px">{{ row.icon ?? '' }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:12px;color:var(--s-text-2);min-width:24px;">{{
                        row.sortOrder ?? 0
                      }}</span>
                      <div class="sort-btns">
                        <button
                          class="sort-btn"
                          (click)="moveUp(row)"
                          [disabled]="!canMoveUp(row)"
                          title="{{ 'DOM_FALLBACK.TEXT_387' | translate }}"
                        >
                          �–²
                        </button>
                        <button
                          class="sort-btn"
                          (click)="moveDown(row)"
                          [disabled]="!canMoveDown(row)"
                          title="{{ 'DOM_FALLBACK.TEXT_388' | translate }}"
                        >
                          �–¼
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      class="s-badge"
                      [class.active]="row.isActive"
                      [class.inactive]="!row.isActive"
                      >{{ row.isActive ? 'Active' : 'Inactive' }}</span
                    >
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;justify-content:flex-end;">
                      <button
                        class="s-btn-icon"
                        [permAction]="permissionService.canUpdate(effectivePageCode())"
                        (click)="openEdit(row)"
                        title="{{ 'DOM_FALLBACK.TEXT_324' | translate }}"
                      >
                        �
                      </button>
                      <button
                        class="s-btn-icon danger"
                        [permAction]="permissionService.canDelete(effectivePageCode())"
                        (click)="askDelete(row)"
                        title="{{ 'COMMON.DELETE' | translate }}"
                      >
                        �—‘
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!treeRows().length) {
          <div class="s-empty">
            <div class="s-empty-icon">📄</div>
            <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_294' | translate }}</div>
          </div>
        }
      }
    </div>

    <!-- ── Create / Edit Modal ──────────────────────────────────────── -->
    @if (modalOpen()) {
      <div class="s-modal-backdrop" (click)="onBackdrop($event)">
        <div class="s-modal" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ editPage() ? 'Edit Page' : 'New Page' }}</span>
            <button class="s-btn-icon" (click)="closeModal()">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) {
              <div class="s-alert error">�  {{ saveError() }}</div>
            }

            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_295' | translate }}</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.pageCode"
                  placeholder="FLEET_DASHBOARD"
                  maxlength="100"
                  style="text-transform:uppercase"
                  (blur)="form.pageCode = form.pageCode.toUpperCase()"
                />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_296' | translate }}</label>
                <input
                  class="s-input"
                  [(ngModel)]="form.pageName"
                  placeholder="{{ 'AUTO_INLINE_SECURITY_UI.FLEET_DASHBOARD' | translate }}"
                  maxlength="200"
                />
              </div>
            </div>

            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">URL</label>
                <input
                  class="s-input mono"
                  [(ngModel)]="form.pageUrl"
                  placeholder="{{ 'AUTO_INLINE_SECURITY_UI.FLEET_DASHBOARD_2' | translate }}"
                  maxlength="500"
                />
              </div>
              <div class="s-field">
                <label class="s-label"
                  >{{ 'DOM_FALLBACK.TEXT_292' | translate }}
                  <span style="color:var(--s-text-3);font-size:11px"
                    >{{ 'DOM_FALLBACK.TEXT_297' | translate }}</span
                  ></label
                >
                <input
                  class="s-input"
                  [(ngModel)]="form.icon"
                  placeholder="{{ 'AUTO_INLINE_SECURITY_UI.OR_PI_PI_CAR' | translate }}"
                  maxlength="100"
                />
              </div>
            </div>

            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_298' | translate }}</label>
                <select class="s-select" [(ngModel)]="form.pageType">
                  <option value="PAGE">{{ 'DOM_FALLBACK.TEXT_299' | translate }}</option>
                  <option value="MODEL">{{ 'DOM_FALLBACK.TEXT_300' | translate }}</option>
                </select>
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_301' | translate }}</label>
                <input
                  class="s-input"
                  type="number"
                  [(ngModel)]="form.sortOrder"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <!-- Parent picker -->
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label"
                  >{{ 'DOM_FALLBACK.TEXT_302' | translate }}
                  <span style="color:var(--s-text-3);font-size:11px"
                    >{{ 'DOM_FALLBACK.TEXT_303' | translate }}</span
                  ></label
                >
                <div style="position:relative;">
                  <button
                    class="s-input"
                    style="text-align:left;cursor:pointer;display:flex;align-items:center;gap:8px;"
                    (click)="parentPickerOpen.set(!parentPickerOpen())"
                  >
                    @if (form.parentId) {
                      <span class="mono" style="color:var(--s-accent)">{{
                        parentLabel(form.parentId)
                      }}</span>
                    } @else {
                      <span style="color:var(--s-text-3)">{{ 'DOM_FALLBACK.TEXT_304' | translate }}</span>
                    }
                    <span style="margin-left:auto;color:var(--s-text-3);font-size:10px">�–¾</span>
                  </button>
                  @if (parentPickerOpen()) {
                    <div
                      style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--s-bg-2);border:1px solid var(--s-accent);border-radius:var(--s-radius);z-index:10;max-height:220px;overflow-y:auto;padding:8px;"
                    >
                      <div
                        class="parent-option root-opt"
                        [class.selected]="!form.parentId"
                        (click)="selectParent(null)"
                      >
                        <span>�</span> <span>{{ 'DOM_FALLBACK.TEXT_304' | translate }}</span>
                      </div>
                      @for (p of parentOptions(); track p.idPage) {
                        @if (p.idPage !== editPage()?.idPage) {
                          <div
                            class="parent-option"
                            [class.selected]="form.parentId === p.idPage"
                            (click)="selectParent(p.idPage)"
                            [style.paddingLeft.px]="p.depth * 14 + 10"
                          >
                            <span
                              style="color:var(--s-accent);font-family:var(--s-mono);font-size:12px;"
                              >{{ p.pageCode }}</span
                            >
                            <span style="color:var(--s-text-2);font-size:12px;">{{
                              p.pageName
                            }}</span>
                          </div>
                        }
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (editPage()) {
              <div class="s-form-row single">
                <div class="s-field" style="justify-content:flex-end;">
                  <label class="s-label">{{ 'DOM_FALLBACK.TEXT_026' | translate }}</label>
                  <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                    <label class="s-toggle">
                      <input type="checkbox" [(ngModel)]="formActive" />
                      <div class="s-toggle-track"></div>
                      <div class="s-toggle-thumb"></div>
                    </label>
                    <span style="font-size:13px;color:var(--s-text-2);">{{
                      formActive ? 'Active' : 'Inactive'
                    }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="closeModal()">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button
              class="s-btn s-btn-primary"
              [permAction]="
                editPage()
                  ? permissionService.canUpdate(effectivePageCode())
                  : permissionService.canCreate(effectivePageCode())
              "
              (click)="save()"
              [disabled]="saving()"
            >
              {{ saving() ? 'Saving�¦' : editPage() ? 'Update' : 'Create' }}
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
            <span class="s-modal-title">{{ 'DOM_FALLBACK.TEXT_305' | translate }}</span>
            <button class="s-btn-icon" (click)="deleteTarget.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2);">
              {{ 'DOM_FALLBACK.TEXT_306' | translate }}
              <strong class="mono" style="color:var(--s-accent)">{{
                deleteTarget()!.pageCode
              }}</strong
              >?
              @if (childCount(deleteTarget()!) > 0) {
                <br /><br /><span style="color:var(--s-amber);font-size:12px;"
                  >�  This page has {{ childCount(deleteTarget()!) }} child page(s). They will become
                  root-level pages.</span
                >
              }
            </p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteTarget.set(null)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="doDelete()">{{ 'COMMON.DELETE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PagesListComponent implements OnInit {
  private api = inject(SecuApiService);
  private router = inject(Router);
  public permissionService = inject(PermissionService);

  readonly defaultPageCode = 'SECU_PAGES';

  flatPages = signal<SecuPageDto[]>([]);
  loading = signal(true);
  viewMode = signal<'tree' | 'flat'>('tree');
  searchTerm = '';
  includeInactive = false;
  page = 1;
  pageSize = 20;

  modalOpen = signal(false);
  editPage = signal<SecuPageDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  deleteTarget = signal<SecuPageDto | null>(null);
  parentPickerOpen = signal(false);

  form: {
    pageCode: string;
    pageName: string;
    pageUrl: string | null;
    icon: string | null;
    pageType: SecuPageType;
    parentId: number | null;
    sortOrder: number | null;
  } = {
    pageCode: '',
    pageName: '',
    pageUrl: null,
    icon: null,
    pageType: 'PAGE',
    parentId: null,
    sortOrder: 0,
  };
  formActive = true;

  // ── Tree state ────────────────────────────────────────────────────────────
  private treeRoots = signal<TreeNode[]>([]);

  treeRows = computed(() => this.flattenTree(this.treeRoots()));

  filteredFlat = computed(() => {
    const q = this.searchTerm.trim().toLowerCase();
    const pages = this.flatPages();
    if (!q) return pages;
    return pages.filter(
      (p) =>
        p.pageCode.toLowerCase().includes(q) ||
        p.pageName.toLowerCase().includes(q) ||
        (p.pageUrl ?? '').toLowerCase().includes(q),
    );
  });

  pagedFlat = computed(() => {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredFlat().slice(start, start + this.pageSize);
  });

  flatTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredFlat().length / this.pageSize)),
  );

  /** Flat list ordered by hierarchy depth for use in parent picker */
  parentOptions = computed((): (SecuPageDto & { depth: number })[] => {
    const result: (SecuPageDto & { depth: number })[] = [];
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const n of nodes) {
        result.push({ ...n, depth });
        walk(n.children, depth + 1);
      }
    };
    walk(this.treeRoots(), 0);
    return result;
  });

  readonly effectivePageCode = computed(() => {
    this.permissionService.loaded();
    return this.permissionService.getPageCodeForUrl(this.router.url) ?? this.defaultPageCode;
  });

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api
      .getPages({ size: 500, includeInactive: this.includeInactive })
      .pipe(catchError(() => of(null)))
      .subscribe((r) => {
        this.loading.set(false);
        if (r) {
          this.flatPages.set(r.data);
          this.treeRoots.set(this.buildTree(r.data));
        }
      });
  }

  buildTree(pages: SecuPageDto[]): TreeNode[] {
    const map = new Map<number, TreeNode>();
    pages.forEach((p) => map.set(p.idPage, { ...p, children: [], depth: 0, expanded: true }));
    const roots: TreeNode[] = [];
    pages.forEach((p) => {
      const node = map.get(p.idPage)!;
      if (p.parentId && map.has(p.parentId)) {
        map.get(p.parentId)!.children.push(node);
      } else roots.push(node);
    });
    const setDepth = (nodes: TreeNode[], d: number) =>
      nodes.forEach((n) => {
        n.depth = d;
        setDepth(n.children, d + 1);
      });
    setDepth(roots, 0);
    roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return roots;
  }

  flattenTree(nodes: TreeNode[]): TreeNode[] {
    const q = this.searchTerm.trim().toLowerCase();
    const result: TreeNode[] = [];
    const walk = (ns: TreeNode[]) => {
      for (const n of ns) {
        const match =
          !q || n.pageCode.toLowerCase().includes(q) || n.pageName.toLowerCase().includes(q);
        if (match) result.push(n);
        if (n.expanded || q) walk(n.children);
      }
    };
    walk(nodes);
    return result;
  }

  depthArray(d: number): number[] {
    return Array.from({ length: d }, (_, i) => i);
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    this.treeRoots.set([...this.treeRoots()]);
  }

  treeExpandAll() {
    const expand = (ns: TreeNode[]) =>
      ns.forEach((n) => {
        n.expanded = true;
        expand(n.children);
      });
    expand(this.treeRoots());
    this.treeRoots.set([...this.treeRoots()]);
  }

  treeCollapseAll() {
    const collapse = (ns: TreeNode[]) =>
      ns.forEach((n) => {
        n.expanded = false;
        collapse(n.children);
      });
    collapse(this.treeRoots());
    this.treeRoots.set([...this.treeRoots()]);
  }

  canMoveUp(node: TreeNode): boolean {
    const siblings = this.getSiblings(node);
    return siblings.indexOf(node) > 0;
  }

  canMoveDown(node: TreeNode): boolean {
    const siblings = this.getSiblings(node);
    const idx = siblings.indexOf(node);
    return idx < siblings.length - 1;
  }

  getSiblings(node: TreeNode): TreeNode[] {
    if (!node.parentId) return this.treeRoots();
    const parent = this.findNode(this.treeRoots(), node.parentId);
    return parent ? parent.children : [];
  }

  findNode(nodes: TreeNode[], id: number): TreeNode | null {
    for (const n of nodes) {
      if (n.idPage === id) return n;
      const found = this.findNode(n.children, id);
      if (found) return found;
    }
    return null;
  }

  moveUp(node: TreeNode) {
    const siblings = this.getSiblings(node);
    const idx = siblings.indexOf(node);
    if (idx <= 0) return;
    const prev = siblings[idx - 1];
    // Swap sort orders then save both
    const prevSort = prev.sortOrder ?? 0;
    const curSort = node.sortOrder ?? 0;
    this.api.updatePage(node.idPage, { ...node, sortOrder: prevSort } as any).subscribe();
    this.api
      .updatePage(prev.idPage, { ...prev, sortOrder: curSort } as any)
      .subscribe(() => this.reload());
    // Optimistic
    siblings.splice(idx, 1);
    siblings.splice(idx - 1, 0, node);
    this.treeRoots.set([...this.treeRoots()]);
  }

  moveDown(node: TreeNode) {
    const siblings = this.getSiblings(node);
    const idx = siblings.indexOf(node);
    if (idx >= siblings.length - 1) return;
    const next = siblings[idx + 1];
    const nextSort = next.sortOrder ?? 0;
    const curSort = node.sortOrder ?? 0;
    this.api.updatePage(node.idPage, { ...node, sortOrder: nextSort } as any).subscribe();
    this.api
      .updatePage(next.idPage, { ...next, sortOrder: curSort } as any)
      .subscribe(() => this.reload());
    siblings.splice(idx, 1);
    siblings.splice(idx + 1, 0, node);
    this.treeRoots.set([...this.treeRoots()]);
  }

  parentLabel(id: number | null): string {
    if (!id) return '';
    const p = this.flatPages().find((x) => x.idPage === id);
    return p ? p.pageCode : String(id);
  }

  childCount(page: SecuPageDto): number {
    return this.flatPages().filter((p) => p.parentId === page.idPage).length;
  }

  onSearch() {
    this.page = 1;
    this.treeRoots.set([...this.treeRoots()]);
  }
  onPageChange(p: number) {
    this.page = p;
  }

  openCreate() {
    this.editPage.set(null);
    this.form = {
      pageCode: '',
      pageName: '',
      pageUrl: null,
      icon: null,
      pageType: 'PAGE',
      parentId: null,
      sortOrder: 0,
    };
    this.formActive = true;
    this.saveError.set(null);
    this.parentPickerOpen.set(false);
    this.modalOpen.set(true);
  }

  openEdit(p: SecuPageDto) {
    this.editPage.set(p);
    this.form = {
      pageCode: p.pageCode,
      pageName: p.pageName,
      pageUrl: p.pageUrl,
      icon: p.icon,
      pageType: p.pageType ?? 'PAGE',
      parentId: p.parentId,
      sortOrder: p.sortOrder,
    };
    this.formActive = p.isActive;
    this.saveError.set(null);
    this.parentPickerOpen.set(false);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
    this.parentPickerOpen.set(false);
  }

  selectParent(id: number | null) {
    this.form.parentId = id;
    this.parentPickerOpen.set(false);
  }

  onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.modalOpen.set(false);
      this.deleteTarget.set(null);
      this.parentPickerOpen.set(false);
    }
  }

  save() {
    if (!this.form.pageCode.trim() || !this.form.pageName.trim()) {
      this.saveError.set('Code and Name are required.');
      return;
    }
    this.saving.set(true);
    const payload = { ...this.form, pageCode: this.form.pageCode.toUpperCase() };
    const req = this.editPage()
      ? this.api.updatePage(this.editPage()!.idPage, {
          ...payload,
          isActive: this.formActive,
        } as UpdateSecuPageRequest)
      : this.api.createPage(payload as CreateSecuPageRequest);
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

  askDelete(p: SecuPageDto) {
    this.deleteTarget.set(p);
  }

  doDelete() {
    this.api
      .deletePage(this.deleteTarget()!.idPage)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.deleteTarget.set(null);
        this.reload();
      });
  }
}

