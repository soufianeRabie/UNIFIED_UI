import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { EmailProvider } from '../models/email-provider';

@Injectable({ providedIn: 'root' })
export class EmailProvidersService {
  constructor(private api: ApiClientService) {}

  list(): Observable<EmailProvider[]> {
    return this.api.get<EmailProvider[]>('/api/email-providers');
  }

  create(payload: Partial<EmailProvider>): Observable<EmailProvider> {
    return this.api.post<EmailProvider>('/api/email-providers', payload);
  }

  update(id: string, payload: Partial<EmailProvider>): Observable<void> {
    return this.api.put<void>(`/api/email-providers/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/email-providers/${id}`);
  }
}
