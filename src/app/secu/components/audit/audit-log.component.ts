import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { RefCompanyDto, SecuAuditLogDto } from '../../models/secu.models';
import { SecuApiService } from '../../services/secu-api.service';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';

type Operation = 'ALL' | 'INSERT' | 'UPDATE' | 'DELETE';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent],
  styles: [`
    .audit-filters { display:grid; grid-template-columns:2fr repeat(5, minmax(120px, 1fr)); gap:8px; padding:10px 14px; border-bottom:1px solid var(--s-border); background:var(--s-bg-3); align-items:end; }
    @media (max-width: 1100px) { .audit-filters { grid-template-columns:1fr 1fr; } }
    @media (max-width: 620px) { .audit-filters { grid-template-columns:1fr; } }
    .filter-field { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .filter-field label { font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--s-text-3); }
    .op-badge { font-family:var(--s-mono); font-size:10px; font-weight:700; padding:2px 7px; border-radius:5px; }
    .op-INSERT { background:var(--s-green-bg); color:var(--s-green); }
    .op-UPDATE { background:var(--s-accent-glow); color:var(--s-accent); }
    .op-DELETE { background:var(--s-red-bg); color:var(--s-red); }
    .audit-summary { display:flex; gap:14px; flex-wrap:wrap; align-items:center; padding:8px 14px; border-bottom:1px solid var(--s-border); background:var(--s-bg-2); font-size:12px; color:var(--s-text-2); }
    .log-row { cursor:pointer; }
    .log-row:hover td, .log-row.open td { background:var(--s-bg-3); }
    .expand-icon { color:var(--s-text-3); font-size:10px; display:inline-block; transition:transform .14s; }
    .expand-icon.open { transform:rotate(90deg); }
    .detail-row td { padding:0; }
    .detail-box { padding:12px 16px; background:var(--s-bg); border-top:1px solid var(--s-border); }
    .diff-table { width:100%; border-collapse:collapse; font-size:12px; }
    .diff-table th, .diff-table td { padding:8px 10px; border-bottom:1px solid var(--s-border); text-align:left; vertical-align:top; }
    .diff-table th { color:var(--s-text-3); font-size:10px; text-transform:uppercase; letter-spacing:.07em; }
    .diff-val { font-family:var(--s-mono); font-size:11px; white-space:pre-wrap; word-break:break-word; color:var(--s-text-2); }
  `],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">Audit Log</h1>
        <p class="s-page-subtitle">Security changes with field-level modification details</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="s-btn s-btn-ghost s-btn-sm" (click)="resetFilters()">Reset</button>
        <button class="s-btn s-btn-ghost s-btn-sm" (click)="reload()">Refresh</button>
      </div>
    </div>

    <div class="s-card" style="padding:0;overflow:visible;">
      <div class="audit-filters">
        <div class="filter-field">
          <label>Search</label>
          <div class="s-search">
            <span class="s-search-icon">Search</span>
            <input [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()" placeholder="User, entity, record id..." />
          </div>
        </div>
        <div class="filter-field">
          <label>Company</label>
          <select class="s-select" [(ngModel)]="filters.tenantId" (change)="onFilterChange()">
            <option value="">All companies</option>
            @for (company of companies(); track company.companyCode) {
              <option [value]="company.companyCode">{{ company.companyCode }}</option>
            }
          </select>
        </div>
        <div class="filter-field">
          <label>Table</label>
          <select class="s-select" [(ngModel)]="filters.tableName" (change)="onFilterChange()">
            <option value="">All tables</option>
            @for (table of tableOptions(); track table) {
              <option [value]="table">{{ table }}</option>
            }
          </select>
        </div>
        <div class="filter-field">
          <label>Operation</label>
          <select class="s-select" [(ngModel)]="filters.operation" (change)="onFilterChange()">
            <option value="ALL">All</option>
            <option value="INSERT">Insert</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>
        <div class="filter-field">
          <label>From</label>
          <input class="s-input" type="date" [(ngModel)]="filters.dateFrom" (change)="onFilterChange()" />
        </div>
        <div class="filter-field">
          <label>To</label>
          <input class="s-input" type="date" [(ngModel)]="filters.dateTo" (change)="onFilterChange()" />
        </div>
      </div>

      @if (!loading()) {
        <div class="audit-summary">
          <span><strong style="color:var(--s-text);">{{ filtered().length }}</strong> entries</span>
          <span>{{ opCount('INSERT') }} inserts</span>
          <span>{{ opCount('UPDATE') }} updates</span>
          <span>{{ opCount('DELETE') }} deletes</span>
          @if (filters.tenantId) { <span>Company {{ companyLabel(filters.tenantId) }}</span> }
        </div>
      }

      @if (loading()) {
        <div class="s-empty"><div class="s-empty-text">Loading...</div></div>
      } @else {
        <div class="s-table-wrap">
          <table class="s-table">
            <thead>
              <tr>
                <th style="width:28px;"></th>
                <th style="width:135px;" (click)="setSort('performedAt')" class="sortable">Date {{ sortIcon('performedAt') }}</th>
                <th style="width:90px;">Op</th>
                <th>Entity</th>
                <th style="width:130px;">Record</th>
                <th style="width:150px;">Company</th>
                <th style="width:160px;">Changed By</th>
              </tr>
            </thead>
            <tbody>
              @for (row of paged(); track row.idLog) {
                <tr class="log-row" [class.open]="expandedId() === row.idLog" (click)="toggleRow(row)">
                  <td style="text-align:center;">
                    @if (hasDetail(row)) {
                      <span class="expand-icon" [class.open]="expandedId() === row.idLog">></span>
                    }
                  </td>
                  <td class="mono" style="font-size:11px;color:var(--s-text-2);white-space:nowrap;">
                    {{ row.performedAt | date:'dd/MM/yy' }}<br><span style="color:var(--s-text-3);">{{ row.performedAt | date:'HH:mm:ss' }}</span>
                  </td>
                  <td><span class="op-badge" [class]="'op-badge op-' + row.operation">{{ row.operation }}</span></td>
                  <td>
                    <div class="mono" style="font-size:11px;color:var(--s-accent);">{{ row.entityName }}</div>
                    <div style="font-size:10px;color:var(--s-text-3);">{{ row.tableName || '-' }}</div>
                  </td>
                  <td class="mono" style="font-size:11px;color:var(--s-text-3);">{{ row.recordId || '-' }}</td>
                  <td class="mono" style="font-size:11px;color:var(--s-purple);">{{ companyLabel(row.tenantId) }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:7px;">
                      <div style="width:24px;height:24px;border-radius:50%;background:var(--s-accent-glow);color:var(--s-accent);display:grid;place-items:center;font-size:10px;font-weight:700;">
                        {{ (row.performedBy || '?')[0].toUpperCase() }}
                      </div>
                      <span class="mono" style="font-size:11px;color:var(--s-text-2);">{{ row.performedBy || row.performedById || '-' }}</span>
                    </div>
                  </td>
                </tr>

                @if (expandedId() === row.idLog && hasDetail(row)) {
                  <tr class="detail-row">
                    <td colspan="7">
                      <div class="detail-box">
                        @if (row.fields.length) {
                          <table class="diff-table">
                            <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
                            <tbody>
                              @for (field of row.fields; track field.idLogField) {
                                <tr>
                                  <td class="mono" style="font-size:11px;color:var(--s-accent);">{{ field.fieldName }}</td>
                                  <td class="diff-val">{{ field.oldValue || '-' }}</td>
                                  <td class="diff-val">{{ field.newValue || '-' }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        } @else {
                          <table class="diff-table">
                            <thead><tr><th>Before</th><th>After</th></tr></thead>
                            <tbody><tr><td class="diff-val">{{ formatJson(row.oldValue) || '-' }}</td><td class="diff-val">{{ formatJson(row.newValue) || '-' }}</td></tr></tbody>
                          </table>
                        }
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr><td colspan="7"><div class="s-empty" style="padding:42px;"><div class="s-empty-text">No audit entries match your filters</div></div></td></tr>
              }
            </tbody>
          </table>
        </div>
        <secu-pagination [page]="page" [size]="pageSize" [totalRecords]="filtered().length" [totalPages]="totalPages()" (pageChange)="onPageChange($event)" />
      }
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  private readonly api = inject(SecuApiService);

  allLogs = signal<SecuAuditLogDto[]>([]);
  companies = signal<RefCompanyDto[]>([]);
  loading = signal(true);
  expandedId = signal<number | null>(null);

  page = 1;
  pageSize = 25;
  sortBy = signal<keyof SecuAuditLogDto>('performedAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  filters = {
    search: '',
    tableName: '',
    tenantId: '',
    operation: 'ALL' as Operation,
    dateFrom: '',
    dateTo: '',
  };

  tableOptions = computed(() =>
    [...new Set(this.allLogs().map(log => log.tableName).filter((value): value is string => !!value))].sort());

  filtered = computed(() => {
    const q = this.filters.search.trim().toLowerCase();
    const from = this.filters.dateFrom ? new Date(this.filters.dateFrom).getTime() : null;
    const to = this.filters.dateTo ? new Date(this.filters.dateTo + 'T23:59:59').getTime() : null;
    return this.allLogs().filter(log => {
      if (this.filters.tableName && log.tableName !== this.filters.tableName) return false;
      if (this.filters.tenantId && log.tenantId !== this.filters.tenantId) return false;
      if (this.filters.operation !== 'ALL' && log.operation !== this.filters.operation) return false;
      if (from && new Date(log.performedAt).getTime() < from) return false;
      if (to && new Date(log.performedAt).getTime() > to) return false;
      if (q) {
        const haystack = [
          log.entityName,
          log.tableName ?? '',
          log.recordId ?? '',
          log.performedBy ?? '',
          log.performedById ?? '',
          log.tenantId ?? '',
          ...((log.fields ?? []).map(field => `${field.fieldName} ${field.oldValue ?? ''} ${field.newValue ?? ''}`)),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const field = this.sortBy();
      const av = a[field] as string | number | null;
      const bv = b[field] as string | number | null;
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      if ((av ?? '') < (bv ?? '')) return -dir;
      if ((av ?? '') > (bv ?? '')) return dir;
      return 0;
    });
  });

  paged = computed(() => this.filtered().slice((this.page - 1) * this.pageSize, this.page * this.pageSize));
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    forkJoin({
      logs: this.api.getAuditLogs({ size: 2000 }).pipe(catchError(() => of(null))),
      companies: this.api.getCompanies({ size: 1000 }).pipe(catchError(() => of(null))),
    }).subscribe(result => {
      if (result.logs) this.allLogs.set(result.logs.data);
      if (result.companies) this.companies.set(result.companies.data);
      this.loading.set(false);
    });
  }

  onFilterChange() {
    this.page = 1;
    this.expandedId.set(null);
  }

  resetFilters() {
    this.filters = { search: '', tableName: '', tenantId: '', operation: 'ALL', dateFrom: '', dateTo: '' };
    this.page = 1;
    this.expandedId.set(null);
  }

  setSort(field: keyof SecuAuditLogDto) {
    if (this.sortBy() === field) this.sortDir.update(dir => dir === 'asc' ? 'desc' : 'asc');
    else {
      this.sortBy.set(field);
      this.sortDir.set('desc');
    }
  }

  sortIcon(field: keyof SecuAuditLogDto) {
    if (this.sortBy() !== field) return '';
    return this.sortDir() === 'asc' ? '^' : 'v';
  }

  onPageChange(page: number) {
    this.page = page;
    this.expandedId.set(null);
  }

  toggleRow(row: SecuAuditLogDto) {
    if (!this.hasDetail(row)) return;
    this.expandedId.set(this.expandedId() === row.idLog ? null : row.idLog);
  }

  hasDetail(row: SecuAuditLogDto) {
    return !!(row.fields?.length || row.oldValue || row.newValue);
  }

  opCount(operation: string) {
    return this.filtered().filter(log => log.operation === operation).length;
  }

  companyLabel(companyCode: string | null) {
    if (!companyCode) return 'Global';
    const company = this.companies().find(item => item.companyCode === companyCode);
    return company ? `${company.companyCode} - ${company.companyName}` : companyCode;
  }

  formatJson(value: string | null | undefined) {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
}
