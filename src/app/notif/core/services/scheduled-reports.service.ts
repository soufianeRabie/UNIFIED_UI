import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ScheduledReport, ScheduledReportRun } from '../models/scheduled-report';

/**
 * Scheduled Excel-email reports. Calls the /api/reports endpoints (backend lands
 * in the Reports phase). The UI is built against this contract now so it is ready
 * to light up as soon as the backend ships.
 */
@Injectable({ providedIn: 'root' })
export class ScheduledReportsService {
  constructor(private api: ApiClientService) {}

  list(): Observable<ScheduledReport[] | { items: ScheduledReport[] }> {
    return this.api.get<ScheduledReport[] | { items: ScheduledReport[] }>('/api/reports');
  }

  get(id: string): Observable<ScheduledReport> {
    return this.api.get<ScheduledReport>(`/api/reports/${id}`);
  }

  create(payload: Partial<ScheduledReport>): Observable<ScheduledReport> {
    return this.api.post<ScheduledReport>('/api/reports', payload);
  }

  update(id: string, payload: Partial<ScheduledReport>): Observable<void> {
    return this.api.put<void>(`/api/reports/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/reports/${id}`);
  }

  runNow(id: string): Observable<void> {
    return this.api.post<void>(`/api/reports/${id}/run`);
  }

  history(id: string): Observable<ScheduledReportRun[]> {
    return this.api.get<ScheduledReportRun[]>(`/api/reports/${id}/runs`);
  }
}
