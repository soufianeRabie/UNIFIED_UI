import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { ReferenceItem } from '../models/reference';

@Injectable({ providedIn: 'root' })
export class ReferenceService {
  constructor(private api: ApiClientService) {}

  getChannels(): Observable<ReferenceItem[]> {
    return this.api.get<ReferenceItem[]>('/api/reference/channels');
  }

  getPriorities(): Observable<ReferenceItem[]> {
    return this.api.get<ReferenceItem[]>('/api/reference/priorities');
  }
}
