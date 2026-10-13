import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { NotificationEvent } from '../models/event';

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private api: ApiClientService) {}

  publish(payload: NotificationEvent): Observable<unknown> {
    return this.api.post('/api/events', payload);
  }
}
