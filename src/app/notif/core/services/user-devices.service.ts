import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { UserDevice } from '../models/user-device';

@Injectable({ providedIn: 'root' })
export class UserDevicesService {
  constructor(private api: ApiClientService) {}

  getByUser(userId: string): Observable<UserDevice[]> {
    return this.api.get<UserDevice[]>(`/api/user-devices/${userId}`);
  }

  register(payload: Partial<UserDevice>): Observable<UserDevice> {
    return this.api.post<UserDevice>('/api/user-devices', payload);
  }

  markSeen(id: string): Observable<void> {
    return this.api.post<void>(`/api/user-devices/${id}/seen`);
  }

  deactivate(id: string): Observable<void> {
    return this.api.post<void>(`/api/user-devices/${id}/deactivate`);
  }

  /** VAPID public key for browser Web Push subscription (Phase D backend). */
  getVapidPublicKey(): Observable<{ publicKey: string }> {
    return this.api.get<{ publicKey: string }>(`/api/webpush/vapid-public-key`);
  }
}
