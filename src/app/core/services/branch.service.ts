import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import { VehicleResponse } from '../models/fleet.models';
import {
  BranchResponse,
  BranchStatus,
  CreateBranchRequest,
  TransferVehicleRequest,
  UpdateBranchRequest
} from '../models/organization.models';
import { PageResponse, PaginationParams } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/branches`;

  getAllBranches(params: PaginationParams = {}): Observable<PageResponse<BranchResponse>> {
    return this.http
      .get<PageResponse<BranchResponse>>(this.apiUrl, {
        params: this.buildPaginationParams(params)
      })
      .pipe(
        catchError(() =>
          this.http.get<PageResponse<BranchResponse>>(this.apiUrl, {
            params: this.buildLegacyPaginationParams(params)
          })
        )
      );
  }

  getBranchesByStatus(status: BranchStatus): Observable<BranchResponse[]> {
    return this.http.get<BranchResponse[]>(`${this.apiUrl}/status/${status}`).pipe(
      catchError(() =>
        this.getAllBranches({ page: 0, size: 100 }).pipe(
          map((response) => response.content.filter((branch) => branch.status === status))
        )
      )
    );
  }

  getBranchById(id: string): Observable<BranchResponse> {
    return this.http.get<BranchResponse>(`${this.apiUrl}/${id}`);
  }

  createBranch(payload: CreateBranchRequest): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(this.apiUrl, payload);
  }

  updateBranch(id: string, payload: UpdateBranchRequest): Observable<BranchResponse> {
    return this.http.put<BranchResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteBranch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvailableVehicles(branchId: string): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/${branchId}/vehicles/available`);
  }

  getVehicles(branchId: string): Observable<VehicleResponse[]> {
    return this.http.get<VehicleResponse[]>(`${this.apiUrl}/${branchId}/vehicles`);
  }

  transferVehicle(vehicleId: string, payload: TransferVehicleRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/vehicles/${vehicleId}/transfer`, payload);
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
}
