import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { TemplateDetail, TemplateSummary } from '../models/template';

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  constructor(private api: ApiClientService) {}

  list(page = 1, pageSize = 50, search?: string): Observable<TemplateSummary[] | { items: TemplateSummary[] }> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) {
      params.set('search', search);
    }
    return this.api.get<TemplateSummary[] | { items: TemplateSummary[] }>(`/api/templates?${params.toString()}`);
  }

  getById(id: string): Observable<TemplateDetail> {
    return this.api.get<TemplateDetail>(`/api/templates/${id}`);
  }

  create(payload: unknown): Observable<TemplateDetail> {
    return this.api.post<TemplateDetail>('/api/templates', payload);
  }

  update(id: string, payload: unknown): Observable<void> {
    return this.api.put<void>(`/api/templates/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/templates/${id}`);
  }

  addLocale(id: string, payload: unknown): Observable<void> {
    return this.api.post<void>(`/api/templates/${id}/locales`, payload);
  }

  updateLocale(id: string, localeId: string, payload: unknown): Observable<void> {
    return this.api.put<void>(`/api/templates/${id}/locales/${localeId}`, payload);
  }

  addBinding(id: string, payload: unknown): Observable<void> {
    return this.api.post<void>(`/api/templates/${id}/bindings`, payload);
  }

  addResolver(id: string, payload: unknown): Observable<void> {
    return this.api.post<void>(`/api/templates/${id}/resolvers`, payload);
  }

  deleteBinding(id: string, bindingId: string): Observable<void> {
    return this.api.delete<void>(`/api/templates/${id}/bindings/${bindingId}`);
  }

  deleteResolver(id: string, resolverId: string): Observable<void> {
    return this.api.delete<void>(`/api/templates/${id}/resolvers/${resolverId}`);
  }

  activate(id: string): Observable<void> {
    return this.api.post<void>(`/api/templates/${id}/activate`);
  }

  deactivate(id: string): Observable<void> {
    return this.api.post<void>(`/api/templates/${id}/deactivate`);
  }

  toggle(id: string, isActive: boolean): Observable<void> {
    return this.api.post<void>(`/api/templates/${id}/toggle`, { isActive });
  }

  preview(id: string, payload: unknown): Observable<unknown> {
    return this.api.post(`/api/templates/${id}/preview`, payload);
  }
}
