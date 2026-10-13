import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import { PaymentResponse, ProcessPaymentRequest } from '../models/billing.models';

interface ProcessPaymentWithInvoiceRequest extends ProcessPaymentRequest {
  invoiceId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/payments`;

  getAllPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(this.apiUrl);
  }

  getPaymentById(id: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${id}`);
  }

  getPaymentsByInvoice(invoiceId: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/invoice/${invoiceId}`);
  }

  processPaymentByInvoice(invoiceId: string, payload: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/invoice/${invoiceId}`, payload);
  }

  processPayment(invoiceId: string, payload: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.processPaymentByInvoice(invoiceId, payload).pipe(
      // Keep payment flow available when backend path-variable binding fails.
      catchError(() => {
        const request: ProcessPaymentWithInvoiceRequest = { ...payload, invoiceId };
        return this.http.post<PaymentResponse>(this.apiUrl, request);
      })
    );
  }

  processPaymentWithInvoice(payload: ProcessPaymentWithInvoiceRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.apiUrl, payload);
  }
}
