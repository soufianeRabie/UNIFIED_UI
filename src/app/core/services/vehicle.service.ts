import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import {
  CreateVehicleRequest,
  PatchVehicleStatusRequest,
  UpdateVehicleRequest,
  VehicleResponse,
  VehicleSearchParams
} from '../models/fleet.models';
import { OccupiedDateRangeResponse } from '../models/rental.models';
import { PageResponse, PaginationParams } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/vehicles`;

  getAllVehicles(params: PaginationParams = {}): Observable<PageResponse<VehicleResponse>> {
    return this.http.get<PageResponse<VehicleResponse>>(this.apiUrl, {
      params: this.buildPaginationParams(params)
    }).pipe(
      catchError(() =>
        this.http.get<PageResponse<VehicleResponse>>(this.apiUrl, {
          params: this.buildLegacyPaginationParams(params)
        })
      )
    );
  }

  getVehicleById(id: string): Observable<VehicleResponse> {
    return this.http.get<VehicleResponse>(`${this.apiUrl}/${id}`);
  }

  createVehicle(payload: CreateVehicleRequest): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(this.apiUrl, payload);
  }

  updateVehicle(id: string, payload: UpdateVehicleRequest): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getVehicleAvailability(id: string): Observable<OccupiedDateRangeResponse[]> {
    return this.http.get<OccupiedDateRangeResponse[]>(`${this.apiUrl}/${id}/availability`);
  }

  searchVehicles(
    filters: VehicleSearchParams = {},
    params: PaginationParams = {}
  ): Observable<PageResponse<VehicleResponse>> {
    let httpParams = this.buildPaginationParams(params);
    const page = params.page ?? 0;
    const size = params.size ?? 10;

    if (filters.searchTerm) {
      httpParams = httpParams.set('brand', filters.searchTerm);
    }
    if (filters.status) {
      httpParams = httpParams.set('status', filters.status);
    }
    if (filters.fuelType) {
      httpParams = httpParams.set('fuelType', filters.fuelType);
    }
    if (filters.transmission) {
      httpParams = httpParams.set('transmission', filters.transmission);
    }

    return this.http.get<PageResponse<VehicleResponse>>(`${this.apiUrl}/search`, {
      params: httpParams
    }).pipe(
      // Backend may fail to bind query argument names depending on compiler flags.
      // Fallback keeps search/filter UX available in the frontend.
      catchError(() =>
        this.getAllVehicles({ page: 0, size: 1000 }).pipe(
          map((response) => this.filterAndPaginateVehicles(response.content, filters, page, size))
        )
      )
    );
  }

  patchStatus(id: string, status: PatchVehicleStatusRequest): Observable<VehicleResponse> {
    return this.http.patch<VehicleResponse>(`${this.apiUrl}/${id}/status`, status);
  }

  private buildPaginationParams(params: PaginationParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.sort) {
      for (const sortValue of params.sort) {
        httpParams = httpParams.append('sort', sortValue);
      }
    }

    return httpParams;
  }

  private buildLegacyPaginationParams(params: PaginationParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('arg0.page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('arg0.size', params.size.toString());
    }
    if (params.sort) {
      for (const sortValue of params.sort) {
        httpParams = httpParams.append('arg0.sort', sortValue);
      }
    }

    return httpParams;
  }

  private filterAndPaginateVehicles(
    vehicles: VehicleResponse[],
    filters: VehicleSearchParams,
    page: number,
    size: number
  ): PageResponse<VehicleResponse> {
    const safeSize = size > 0 ? size : 10;
    const safePage = page >= 0 ? page : 0;
    const searchTerm = filters.searchTerm?.trim().toLowerCase();

    const filtered = vehicles.filter((vehicle) => {
      const matchesSearch =
        !searchTerm ||
        `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate} ${vehicle.vin}`
          .toLowerCase()
          .includes(searchTerm);
      const matchesStatus = !filters.status || vehicle.status === filters.status;
      const matchesFuelType = !filters.fuelType || vehicle.fuelType === filters.fuelType;
      const matchesTransmission =
        !filters.transmission || vehicle.transmission === filters.transmission;

      return matchesSearch && matchesStatus && matchesFuelType && matchesTransmission;
    });

    const start = safePage * safeSize;
    const content = filtered.slice(start, start + safeSize);
    const totalElements = filtered.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / safeSize);
    const sort = { empty: true, sorted: false, unsorted: true };

    return {
      totalPages,
      totalElements,
      size: safeSize,
      content,
      number: safePage,
      sort,
      first: safePage === 0,
      last: start + content.length >= totalElements,
      numberOfElements: content.length,
      pageable: {
        offset: start,
        sort,
        pageSize: safeSize,
        pageNumber: safePage,
        unpaged: false,
        paged: true
      },
      empty: totalElements === 0
    };
  }
}
