import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { RecipientGroup, RecipientGroupMember } from '../models/recipient-group';

@Injectable({ providedIn: 'root' })
export class RecipientGroupsService {
  constructor(private api: ApiClientService) {}

  list(): Observable<RecipientGroup[]> {
    return this.api.get<RecipientGroup[]>('/api/recipient-groups');
  }

  create(payload: Partial<RecipientGroup>): Observable<RecipientGroup> {
    return this.api.post<RecipientGroup>('/api/recipient-groups', payload);
  }

  update(id: string, payload: Partial<RecipientGroup>): Observable<void> {
    return this.api.put<void>(`/api/recipient-groups/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/recipient-groups/${id}`);
  }

  getMembers(id: string): Observable<RecipientGroupMember[]> {
    return this.api.get<RecipientGroupMember[]>(`/api/recipient-groups/${id}/members`);
  }

  addMember(id: string, payload: { userId: string; addedBy?: string }): Observable<RecipientGroupMember> {
    return this.api.post<RecipientGroupMember>(`/api/recipient-groups/${id}/members`, payload);
  }

  removeMember(id: string, userId: string): Observable<void> {
    return this.api.delete<void>(`/api/recipient-groups/${id}/members/${userId}`);
  }
}
