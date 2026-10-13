import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { UserPreference } from '../models/user-preference';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  constructor(private api: ApiClientService) {}

  getByUser(userId: string): Observable<UserPreference[]> {
    return this.api.get<UserPreference[]>(`/api/user-preferences/${userId}`);
  }

  upsert(payload: UserPreference): Observable<UserPreference> {
    return this.api.post<UserPreference>('/api/user-preferences', payload);
  }
}
