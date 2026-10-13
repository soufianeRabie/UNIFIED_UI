import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { EventType } from '../models/event-type';

@Injectable({ providedIn: 'root' })
export class EventTypesService {
  constructor(private api: ApiClientService) {}

  list(): Observable<EventType[]> {
    return this.api.get<EventType[]>('/api/eventtypes');
  }

  getById(id: string): Observable<EventType> {
    return this.api.get<EventType>(`/api/eventtypes/${id}`);
  }

  create(payload: Partial<EventType>): Observable<EventType> {
    return this.api.post<EventType>('/api/eventtypes', payload);
  }

  update(id: string, payload: Partial<EventType>): Observable<void> {
    return this.api.put<void>(`/api/eventtypes/${id}`, payload);
  }
}
