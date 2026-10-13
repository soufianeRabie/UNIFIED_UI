import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import {
  AvailabilityCheckResponse,
  CreateReservationRequest,
  ReservationResponse
} from '../models/rental.models';
import { PageResponse, PaginationParams } from '../models/page-response.model';

export interface ReservationAvailabilityParams {
  vehicleId: string;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/reservations`;

  getAllReservations(params: PaginationParams = {}): Observable<PageResponse<ReservationResponse>> {
    return this.http
      .get<PageResponse<ReservationResponse>>(this.apiUrl, {
        params: this.buildPaginationParams(params)
      })
      .pipe(
        catchError(() =>
          this.http.get<PageResponse<ReservationResponse>>(this.apiUrl, {
            params: this.buildLegacyPaginationParams(params)
          })
        )
      );
  }

  getReservationById(id: string): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.apiUrl}/${id}`);
  }

  createReservation(payload: CreateReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(this.apiUrl, payload);
  }

  getReservationsByVehicle(
    vehicleId: string,
    params: PaginationParams = {}
  ): Observable<PageResponse<ReservationResponse>> {
    return this.http.get<PageResponse<ReservationResponse>>(`${this.apiUrl}/vehicle/${vehicleId}`, {
      params: this.buildPaginationParams(params)
    });
  }

  getReservationsByCustomer(
    customerId: string,
    params: PaginationParams = {}
  ): Observable<PageResponse<ReservationResponse>> {
    return this.http.get<PageResponse<ReservationResponse>>(`${this.apiUrl}/customer/${customerId}`, {
      params: this.buildPaginationParams(params)
    });
  }

  checkAvailability(params: ReservationAvailabilityParams): Observable<AvailabilityCheckResponse> {
    const httpParams = new HttpParams()
      .set('vehicleId', params.vehicleId)
      .set('startDate', params.startDate)
      .set('endDate', params.endDate);

    return this.http.get<AvailabilityCheckResponse>(`${this.apiUrl}/availability/check`, {
      params: httpParams
    });
  }

  confirmReservation(id: string): Observable<ReservationResponse> {
    return this.postReservationAction(id, 'confirm');
  }

  completeReservation(id: string): Observable<ReservationResponse> {
    return this.postReservationAction(id, 'complete');
  }

  cancelReservation(id: string): Observable<ReservationResponse> {
    return this.postReservationAction(id, 'cancel');
  }

  activateReservation(id: string): Observable<ReservationResponse> {
    return this.postReservationAction(id, 'activate');
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

  private postReservationAction(id: string, action: 'confirm' | 'complete' | 'cancel' | 'activate'): Observable<ReservationResponse> {
    const endpoint = `${this.apiUrl}/${id}/${action}`;
    return this.http.post<ReservationResponse>(endpoint, {});
  }
}
