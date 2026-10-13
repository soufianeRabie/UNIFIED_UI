export type ReportScheduleType = 'Immediate' | 'Scheduled' | 'Recurring';

export interface ScheduledReport {
  id: string;
  name: string;
  dataSourceId: string;
  dataSourceName?: string;
  fileName: string;
  sheetName: string;
  recipients: string[];
  emailSubject: string;
  emailBody?: string;
  scheduleType: ReportScheduleType;
  cronExpression?: string | null;
  delayMinutes?: number | null;
  isActive: boolean;
  lastRunAt?: string | null;
  createdAt?: string;
}

export interface ScheduledReportRun {
  id: string;
  reportId: string;
  status: string;
  rowCount?: number;
  error?: string | null;
  runAt: string;
}
