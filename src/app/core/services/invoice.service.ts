import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import { CreateInvoiceRequest, InvoiceResponse, InvoiceStatus } from '../models/billing.models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/invoices`;

  getAllInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(this.apiUrl);
  }

  getInvoiceById(id: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/${id}`);
  }

  createInvoice(payload: CreateInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.apiUrl, payload);
  }

  issueInvoice(id: string): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${id}/issue`, {});
  }

  cancelInvoice(id: string): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getInvoiceByReservation(reservationId: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/reservation/${reservationId}`);
  }

  createInvoiceForReservation(reservationId: string): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/reservation/${reservationId}`, {});
  }

  getInvoicesByStatus(status: InvoiceStatus): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(`${this.apiUrl}/status/${status}`);
  }
}
