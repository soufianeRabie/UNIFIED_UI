import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SecuAuditLogDto } from '../../models/secu.models';
import { SecuApiService } from '../../services/secu-api.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-audit-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [`
    .report-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
    @media (max-width: 980px) { .report-grid { grid-template-columns:1fr 1fr; } }
    @media (max-width: 560px) { .report-grid { grid-template-columns:1fr; } }
    .report-card { border:1px solid var(--s-border); border-radius:var(--s-radius-lg); background:var(--s-bg-2); padding:16px; }
    .report-title { font-size:11px; font-weight:700; color:var(--s-text-3); letter-spacing:.08em; text-transform:uppercase; }
    .report-value { font-size:30px; font-weight:800; color:var(--s-text); margin-top:8px; }
    .bar-row { display:grid; grid-template-columns:160px 1fr 50px; gap:10px; align-items:center; padding:8px 0; border-bottom:1px solid var(--s-border); }
    .bar-track { height:8px; border-radius:999px; background:var(--s-bg-4); overflow:hidden; }
    .bar-fill { height:100%; background:var(--s-accent); border-radius:999px; }
  `],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_216' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'DOM_FALLBACK.TEXT_217' | translate }}</p>
      </div>
      <button class="s-btn s-btn-ghost" (click)="load()">{{ 'DOM_FALLBACK.TEXT_031' | translate }}</button>
    </div>

    <div class="s-toolbar" style="margin-bottom:16px;gap:8px;flex-wrap:wrap;">
      <input class="s-input" style="width:180px;" type="date" [(ngModel)]="dateFrom" />
      <input class="s-input" style="width:180px;" type="date" [(ngModel)]="dateTo" />
      <button class="s-btn s-btn-primary s-btn-sm" (click)="load()">{{ 'DOM_FALLBACK.TEXT_218' | translate }}</button>
    </div>

    @if (loading()) {
      <div class="s-card"><div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_219' | translate }}</div></div></div>
    } @else {
      <div class="report-grid">
        <div class="report-card"><div class="report-title">{{ 'DOM_FALLBACK.TEXT_220' | translate }}</div><div class="report-value">{{ logs().length }}</div></div>
        <div class="report-card"><div class="report-title">{{ 'DOM_FALLBACK.TEXT_221' | translate }}</div><div class="report-value">{{ countOp('UPDATE') }}</div></div>
        <div class="report-card"><div class="report-title">{{ 'DOM_FALLBACK.TEXT_222' | translate }}</div><div class="report-value">{{ countOp('DELETE') }}</div></div>
        <div class="report-card"><div class="report-title">{{ 'DOM_FALLBACK.TEXT_223' | translate }}</div><div class="report-value">{{ usersCount() }}</div></div>
      </div>

      <div class="s-card">
        <h2 style="font-size:14px;margin:0 0 12px;color:var(--s-text);">{{ 'DOM_FALLBACK.TEXT_224' | translate }}</h2>
        @for (row of entityReport(); track row.name) {
          <div class="bar-row">
            <span class="mono" style="font-size:11px;color:var(--s-accent);overflow:hidden;text-overflow:ellipsis;">{{ row.name }}</span>
            <div class="bar-track"><div class="bar-fill" [style.width.%]="barWidth(row.count)"></div></div>
            <span class="mono" style="font-size:11px;color:var(--s-text-2);text-align:right;">{{ row.count }}</span>
          </div>
        } @empty {
          <div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_225' | translate }}</div></div>
        }
      </div>
    }
  `,
})
export class AuditReportsComponent implements OnInit {
  private readonly api = inject(SecuApiService);

  logs = signal<SecuAuditLogDto[]>([]);
  loading = signal(true);
  dateFrom = '';
  dateTo = '';

  entityReport = computed(() => {
    const counts = new Map<string, number>();
    for (const log of this.logs()) {
      const key = log.entityName || log.tableName || 'Unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  });

  usersCount = computed(() => new Set(this.logs().map(log => log.performedById || log.performedBy).filter(Boolean)).size);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getAuditLogs({
      size: 5000,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo ? `${this.dateTo}T23:59:59` : undefined,
    }).pipe(catchError(() => of(null))).subscribe(result => {
      if (result) this.logs.set(result.data);
      this.loading.set(false);
    });
  }

  countOp(operation: string) {
    return this.logs().filter(log => log.operation === operation).length;
  }

  barWidth(count: number) {
    const max = Math.max(...this.entityReport().map(row => row.count), 1);
    return Math.max(6, (count / max) * 100);
  }
}

