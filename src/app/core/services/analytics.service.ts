import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import {
  BranchPerformanceDTO,
  OccupancyStatsDTO,
  RevenueStatsDTO,
  TenantDashboardDTO,
  VehicleStatsDTO
} from '../models/analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/analytics`;

  /** GET /api/v1/analytics/dashboard */
  getDashboard(): Observable<TenantDashboardDTO> {
    return this.http.get<TenantDashboardDTO>(`${this.apiUrl}/dashboard`);
  }

  /** GET /api/v1/analytics/tenant */
  getTenantAnalytics(): Observable<TenantDashboardDTO> {
    return this.http.get<TenantDashboardDTO>(`${this.apiUrl}/tenant`);
  }

  getBranchesPerformance(): Observable<BranchPerformanceDTO[]> {
    return this.http.get<BranchPerformanceDTO[]>(`${this.apiUrl}/branches`);
  }

  getTopBranches(limit?: number): Observable<BranchPerformanceDTO[]> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<BranchPerformanceDTO[]>(`${this.apiUrl}/branches/top`, { params });
  }

  getVehicleCategoriesStats(): Observable<VehicleStatsDTO[]> {
    return this.http.get<VehicleStatsDTO[]>(`${this.apiUrl}/vehicles/categories`);
  }

  getRevenueEvolution(months?: number): Observable<RevenueStatsDTO[]> {
    let params = new HttpParams();
    if (months !== undefined) {
      params = params.set('months', months.toString());
    }

    return this.http.get<RevenueStatsDTO[]>(`${this.apiUrl}/revenue/evolution`, { params });
  }

  getOccupancyTrend(startDate?: string, endDate?: string): Observable<OccupancyStatsDTO[]> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<OccupancyStatsDTO[]>(`${this.apiUrl}/occupancy/trend`, { params });
  }
}
