import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { SmsProvider } from '../models/sms-provider';

@Injectable({ providedIn: 'root' })
export class SmsProvidersService {
  constructor(private api: ApiClientService) {}

  list(): Observable<SmsProvider[]> {
    return this.api.get<SmsProvider[]>('/api/sms-providers');
  }

  create(payload: Partial<SmsProvider>): Observable<SmsProvider> {
    return this.api.post<SmsProvider>('/api/sms-providers', payload);
  }

  update(id: string, payload: Partial<SmsProvider>): Observable<void> {
    return this.api.put<void>(`/api/sms-providers/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/sms-providers/${id}`);
  }
}
