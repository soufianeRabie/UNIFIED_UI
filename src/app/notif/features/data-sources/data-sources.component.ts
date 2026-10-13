import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../../core/services/permission.service';
import { DataSourcesService } from '../../core/services/data-sources.service';
import { DataSource } from '../../core/models/data-source';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { formatHttpError, unwrapList } from '../../shared/utils/api-utils';

const PAGE_CODE = 'NOTIF_DATASOURCES';

type ParamRow = { key: string; value: string };

@Component({
  selector: 'notif-data-sources',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DividerModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TableModule,
    TagModule,
    PermActionDirective
  ],
  templateUrl: './data-sources.component.html'
})
export class DataSourcesComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly service = inject(DataSourcesService);
  private readonly fb = inject(FormBuilder);

  items: DataSource[] = [];
  selected: DataSource | null = null;
  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  testResult: unknown | null = null;
  testParamRows: ParamRow[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    sqlQuery: ['', Validators.required],
    description: [''],
    isActive: [true],
    createdBy: ['ui']
  });

  testForm = this.fb.group({
    sampleParams: ['{}']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status = { type: 'info', message: 'Loading data sources...' };
    this.service.list().subscribe({
      next: (response) => {
        this.items = unwrapList<DataSource>(response);
        this.status = null;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  edit(item: DataSource): void {
    this.selected = item;
    this.form.patchValue({
      name: item.name,
      sqlQuery: item.sqlQuery,
      description: item.description || '',
      isActive: item.isActive ?? true,
      createdBy: item.createdBy || 'ui'
    });
  }

  resetForm(): void {
    this.selected = null;
    this.form.reset({
      name: '',
      sqlQuery: '',
      description: '',
      isActive: true,
      createdBy: 'ui'
    });
    this.testResult = null;
    this.testParamRows = [];
  }

  save(): void {
    if (this.form.invalid) {
      this.status = { type: 'error', message: 'Please fill in required fields.' };
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (this.selected) {
      const payload: Partial<DataSource> = {
        name: value.name ?? '',
        sqlQuery: value.sqlQuery ?? '',
        description: value.description ?? undefined,
        isActive: value.isActive ?? true
      };
      this.service.update(this.selected.id, payload).subscribe({
        next: () => {
          this.status = { type: 'success', message: 'Data source updated.' };
          this.load();
          this.resetForm();
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
        }
      });
      return;
    }

    const payload: Partial<DataSource> = {
      name: value.name ?? '',
      sqlQuery: value.sqlQuery ?? '',
      description: value.description ?? undefined,
      createdBy: value.createdBy || 'ui'
    };
    this.service.create(payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Data source created.' };
        this.load();
        this.resetForm();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  remove(item: DataSource): void {
    if (!confirm(`Delete data source ${item.name}?`)) {
      return;
    }
    this.service.delete(item.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Data source deleted.' };
        this.load();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  test(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Select a data source first.' };
      return;
    }
    const sampleParams = this.buildSampleParams();
    this.service.test(this.selected.id, { sampleParams }).subscribe({
      next: (result) => {
        this.testResult = result;
        this.status = { type: 'success', message: 'Test completed.' };
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  get detectedParams(): string[] {
    const sql = this.form.controls.sqlQuery.value || '';
    return this.extractParamsFromSql(sql);
  }

  get hasSqlQuery(): boolean {
    return !!(this.form.controls.sqlQuery.value || '').trim();
  }

  get detectedColumns(): string[] {
    const sql = this.form.controls.sqlQuery.value || '';
    return this.extractColumnsFromSql(sql);
  }

  addTestParam(key = '', value = ''): void {
    this.testParamRows = [...this.testParamRows, { key, value }];
  }

  removeTestParam(index: number): void {
    this.testParamRows = this.testParamRows.filter((_, i) => i !== index);
  }

  autoFillTestParams(): void {
    const params = this.detectedParams;
    if (params.length === 0) {
      this.addTestParam();
      return;
    }
    this.testParamRows = params.map((key) => ({ key, value: this.exampleValueFor(key) }));
  }

  get testResultRows(): Record<string, unknown>[] {
    if (Array.isArray(this.testResult)) {
      return this.testResult.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row));
    }
    if (this.testResult && typeof this.testResult === 'object') {
      const value = this.testResult as Record<string, unknown>;
      const items = value['items'] || value['rows'] || value['data'];
      if (Array.isArray(items)) {
        return items.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row));
      }
      return [value];
    }
    return [];
  }

  get testResultColumns(): string[] {
    return Array.from(new Set(this.testResultRows.flatMap((row) => Object.keys(row))));
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private buildSampleParams(): Record<string, string> {
    const params: Record<string, string> = {};
    for (const row of this.testParamRows) {
      const key = row.key.trim();
      if (!key) {
        continue;
      }
      params[key] = row.value ?? '';
    }
    return params;
  }

  private exampleValueFor(key: string): string {
    const normalized = key.toLowerCase();
    if (normalized.includes('id')) {
      return '12345';
    }
    if (normalized.includes('date')) {
      return '2026-06-02';
    }
    if (normalized.includes('email')) {
      return 'user@example.com';
    }
    return `sample ${key}`;
  }

  private extractParamsFromSql(sql: string): string[] {
    if (!sql) {
      return [];
    }
    const matches = sql.match(/@([A-Za-z0-9_]+)/g) || [];
    const params = matches.map((m) => m.replace('@', '').trim()).filter(Boolean);
    return Array.from(new Set(params.map((p) => p.toLowerCase()))).map((p) => params.find((x) => x.toLowerCase() === p) || p);
  }

  private extractColumnsFromSql(sql: string): string[] {
    if (!sql) {
      return [];
    }
    const match = sql.match(/select\s+([\s\S]+?)(?:\s+from\s+|$)/i);
    if (!match) {
      return [];
    }
    const selectClause = match[1];
    const parts = this.splitSelectParts(selectClause);
    const columns: string[] = [];
    for (const part of parts) {
      const aliasMatch = part.match(/\s+as\s+\"?([A-Za-z0-9_]+)\"?/i);
      if (aliasMatch && aliasMatch[1]) {
        columns.push(aliasMatch[1]);
        continue;
      }
      const quotedMatch = part.match(/\"([A-Za-z0-9_]+)\"/);
      if (quotedMatch && quotedMatch[1]) {
        columns.push(quotedMatch[1]);
      }
    }
    return Array.from(new Set(columns.map((c) => c.toLowerCase()))).map((c) => columns.find((x) => x.toLowerCase() === c) || c);
  }

  private splitSelectParts(selectClause: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    for (const ch of selectClause) {
      if (ch === '(') {
        depth += 1;
      } else if (ch === ')') {
        depth = Math.max(0, depth - 1);
      }
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) {
      parts.push(current.trim());
    }
    return parts;
  }
}


