import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import {
  CreateVehicleCategoryRequest,
  UpdateVehicleCategoryRequest,
  VehicleCategoryResponse
} from '../models/fleet.models';

@Injectable({ providedIn: 'root' })
export class VehicleCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/vehicle-categories`;

  getAll(): Observable<VehicleCategoryResponse[]> {
    return this.http.get<VehicleCategoryResponse[]>(this.apiUrl);
  }

  getById(id: string): Observable<VehicleCategoryResponse> {
    return this.http.get<VehicleCategoryResponse>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateVehicleCategoryRequest): Observable<VehicleCategoryResponse> {
    return this.http.post<VehicleCategoryResponse>(this.apiUrl, payload);
  }

  update(id: string, payload: UpdateVehicleCategoryRequest): Observable<VehicleCategoryResponse> {
    return this.http.put<VehicleCategoryResponse>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
