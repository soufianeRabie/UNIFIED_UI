import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ScheduledReportsService } from '../../core/services/scheduled-reports.service';
import { DataSourcesService } from '../../core/services/data-sources.service';
import { ScheduledReport, ReportScheduleType } from '../../core/models/scheduled-report';
import { DataSource } from '../../core/models/data-source';
import { formatHttpError, unwrapList } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'notif-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TranslatePipe
  ],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  private readonly service = inject(ScheduledReportsService);
  private readonly dataSourcesService = inject(DataSourcesService);
  private readonly fb = inject(FormBuilder);

  readonly reports = signal<ScheduledReport[]>([]);
  readonly dataSources = signal<DataSource[]>([]);
  readonly loading = signal(false);
  dialogVisible = false;

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  readonly scheduleTypes: ReportScheduleType[] = ['Immediate', 'Scheduled', 'Recurring'];

  form = this.fb.group({
    name: ['', Validators.required],
    dataSourceId: ['', Validators.required],
    fileName: ['report.xlsx', Validators.required],
    sheetName: ['Sheet1', Validators.required],
    recipients: ['', Validators.required],
    emailSubject: ['Your scheduled report', Validators.required],
    emailBody: ['Please find the attached report.'],
    scheduleType: ['Recurring' as ReportScheduleType, Validators.required],
    cronExpression: ['0 8 * * *'],
    delayMinutes: [60]
  });

  ngOnInit(): void {
    this.loadReports();
    this.loadDataSources();
  }

  loadReports(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (res) => {
        this.reports.set(unwrapList<ScheduledReport>(res));
        this.loading.set(false);
      },
      error: (err) => {
        // Backend ships in the Reports phase; show an informative empty state.
        this.reports.set([]);
        this.loading.set(false);
        this.status = { type: 'info', message: `Reports API not available yet: ${formatHttpError(err)}` };
      }
    });
  }

  loadDataSources(): void {
    this.dataSourcesService.list(1, 100).subscribe({
      next: (res) => this.dataSources.set(unwrapList<DataSource>(res)),
      error: () => this.dataSources.set([])
    });
  }

  openCreate(): void {
    this.form.reset({
      name: '',
      dataSourceId: '',
      fileName: 'report.xlsx',
      sheetName: 'Sheet1',
      recipients: '',
      emailSubject: 'Your scheduled report',
      emailBody: 'Please find the attached report.',
      scheduleType: 'Recurring',
      cronExpression: '0 8 * * *',
      delayMinutes: 60
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: Partial<ScheduledReport> = {
      name: v.name ?? '',
      dataSourceId: v.dataSourceId ?? '',
      fileName: v.fileName ?? 'report.xlsx',
      sheetName: v.sheetName ?? 'Sheet1',
      recipients: (v.recipients ?? '')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
      emailSubject: v.emailSubject ?? '',
      emailBody: v.emailBody ?? '',
      scheduleType: v.scheduleType ?? 'Recurring',
      cronExpression: v.scheduleType === 'Recurring' ? v.cronExpression : null,
      delayMinutes: v.scheduleType === 'Scheduled' ? Number(v.delayMinutes) : null,
      isActive: true
    };

    this.service.create(payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Scheduled report created.' };
        this.dialogVisible = false;
        this.loadReports();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  runNow(report: ScheduledReport): void {
    this.service.runNow(report.id).subscribe({
      next: () => (this.status = { type: 'success', message: `Report "${report.name}" queued.` }),
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  remove(report: ScheduledReport): void {
    this.service.delete(report.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Report deleted.' };
        this.loadReports();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  get scheduleType(): ReportScheduleType {
    return this.form.controls.scheduleType.value as ReportScheduleType;
  }
}


