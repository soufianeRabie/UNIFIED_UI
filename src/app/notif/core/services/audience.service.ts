import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { AudienceGroup, AudienceRole, AudienceUser } from '../models/audience';

@Injectable({ providedIn: 'root' })
export class AudienceService {
  constructor(private api: ApiClientService) {}

  listUsers(): Observable<AudienceUser[]> {
    return this.api.get<AudienceUser[]>('/api/audience/users');
  }

  listRoles(appCode?: string | null): Observable<AudienceRole[]> {
    const query = appCode ? `?appCode=${encodeURIComponent(appCode)}` : '';
    return this.api.get<AudienceRole[]>(`/api/audience/roles${query}`);
  }

  listGroups(appCode?: string | null): Observable<AudienceGroup[]> {
    const query = appCode ? `?appCode=${encodeURIComponent(appCode)}` : '';
    return this.api.get<AudienceGroup[]>(`/api/audience/groups${query}`);
  }

  listUsersByRole(roleCode: string, appCode?: string | null): Observable<AudienceUser[]> {
    const query = appCode ? `?appCode=${encodeURIComponent(appCode)}` : '';
    return this.api.get<AudienceUser[]>(`/api/audience/users/by-role/${encodeURIComponent(roleCode)}${query}`);
  }

  listUsersByGroup(groupCode: string, appCode?: string | null): Observable<AudienceUser[]> {
    const query = appCode ? `?appCode=${encodeURIComponent(appCode)}` : '';
    return this.api.get<AudienceUser[]>(`/api/audience/users/by-group/${encodeURIComponent(groupCode)}${query}`);
  }
}
