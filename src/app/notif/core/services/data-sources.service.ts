import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { DataSource } from '../models/data-source';

@Injectable({ providedIn: 'root' })
export class DataSourcesService {
  constructor(private api: ApiClientService) {}

  list(page = 1, pageSize = 50): Observable<DataSource[] | { items: DataSource[] }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.api.get<DataSource[] | { items: DataSource[] }>(`/api/datasources?${params.toString()}`);
  }

  create(payload: Partial<DataSource>): Observable<DataSource> {
    return this.api.post<DataSource>('/api/datasources', payload);
  }

  update(id: string, payload: Partial<DataSource>): Observable<void> {
    return this.api.put<void>(`/api/datasources/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/datasources/${id}`);
  }

  test(id: string, payload: unknown): Observable<unknown> {
    return this.api.post(`/api/datasources/${id}/test`, payload);
  }
}
