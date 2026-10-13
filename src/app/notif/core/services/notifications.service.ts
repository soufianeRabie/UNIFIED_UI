import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from './api-client.service';
import { NotificationDetail, NotificationItem } from '../models/notification';
import { DeadLetterItem } from '../models/deadletter';
import { NotificationStats } from '../models/notification-stats';

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private api: ApiClientService) {}

  list(page = 1, pageSize = 50): Observable<NotificationItem[] | { items: NotificationItem[] }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.api.get<NotificationItem[] | { items: NotificationItem[] }>(`/api/notifications?${params.toString()}`);
  }

  /** Paged inbox with optional page-scope filter (global notifications always included). */
  listPaged(page = 1, pageSize = 20, pageCode?: string): Observable<PagedResult<NotificationItem>> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (pageCode) {
      params.set('pageCode', pageCode);
    }
    return this.api.get<PagedResult<NotificationItem>>(`/api/notifications?${params.toString()}`);
  }

  getStats(): Observable<NotificationStats> {
    return this.api.get<NotificationStats>(`/api/notifications/stats`);
  }

  unreadCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>(`/api/notifications/unread-count`);
  }

  getById(id: string): Observable<NotificationDetail> {
    return this.api.get<NotificationDetail>(`/api/notifications/${id}`);
  }

  /** Downloads the notification's regenerated Excel attachment (triggers a browser save). */
  downloadAttachment(id: string, fallbackName = 'rapport.xlsx'): Observable<void> {
    return this.api.getBlob(`/api/notifications/${id}/attachment`).pipe(
      map((res) => {
        const blob = res.body ?? new Blob();
        const name = this.fileNameFromDisposition(res.headers.get('content-disposition')) ?? fallbackName;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }),
    );
  }

  private fileNameFromDisposition(disposition: string | null): string | null {
    if (!disposition) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return match ? decodeURIComponent(match[1]) : null;
  }

  markRead(id: string): Observable<void> {
    return this.api.post<void>(`/api/notifications/${id}/read`);
  }

  cancel(id: string): Observable<void> {
    return this.api.post<void>(`/api/notifications/${id}/cancel`);
  }

  getDeadLetters(resolved = false): Observable<DeadLetterItem[]> {
    const params = new URLSearchParams();
    params.set('resolved', String(resolved));
    return this.api.get<DeadLetterItem[]>(`/api/deadletter?${params.toString()}`);
  }

  replayDeadLetter(id: string, reviewedBy: string): Observable<void> {
    return this.api.post<void>(`/api/deadletter/${id}/replay`, { reviewedBy });
  }

  resolveDeadLetter(id: string, reviewedBy: string): Observable<void> {
    return this.api.post<void>(`/api/deadletter/${id}/resolve`, { reviewedBy });
  }
}
