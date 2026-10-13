import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { getAppConfig } from '../config/app-config';
import { PageResponse, PaginationParams } from '../models/page-response.model';
import { CreateCustomerRequest, CustomerResponse, UpdateCustomerRequest } from '../models/rental.models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getAppConfig().apiUrl}/v1/customers`;
  private searchEndpointUnavailable = false;

  getAllCustomers(params: PaginationParams = {}): Observable<PageResponse<CustomerResponse>> {
    return this.http
      .get<PageResponse<CustomerResponse>>(this.apiUrl, {
        params: this.buildPaginationParams(params)
      })
      .pipe(
        catchError(() =>
          this.http.get<PageResponse<CustomerResponse>>(this.apiUrl, {
            params: this.buildLegacyPaginationParams(params)
          })
        )
      );
  }

  getCustomerById(id: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${id}`);
  }

  createCustomer(payload: CreateCustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.apiUrl, payload);
  }

  /** PUT /api/v1/customers/{id} */
  updateCustomer(id: string, payload: UpdateCustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}`, payload);
  }

  searchCustomers(
    query?: string,
    params: PaginationParams = {}
  ): Observable<PageResponse<CustomerResponse>> {
    if (this.searchEndpointUnavailable) {
      return this.searchCustomersLocally(query, params);
    }

    return this.searchCustomersRemote(query, params).pipe(
      catchError(() =>
        this.searchCustomersRemoteLegacy(query, params).pipe(
          catchError(() => {
            this.searchEndpointUnavailable = true;
            return this.searchCustomersLocally(query, params);
          })
        )
      )
    );
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

  private searchCustomersRemote(
    query?: string,
    params: PaginationParams = {}
  ): Observable<PageResponse<CustomerResponse>> {
    let httpParams = this.buildPaginationParams(params);
    if (query) {
      httpParams = httpParams.set('name', query);
    }
    return this.http.get<PageResponse<CustomerResponse>>(`${this.apiUrl}/search`, {
      params: httpParams
    });
  }

  private searchCustomersRemoteLegacy(
    query?: string,
    params: PaginationParams = {}
  ): Observable<PageResponse<CustomerResponse>> {
    let httpParams = this.buildLegacyPaginationParams(params);
    if (query) {
      httpParams = httpParams.set('name', query);
    }
    return this.http.get<PageResponse<CustomerResponse>>(`${this.apiUrl}/search`, {
      params: httpParams
    });
  }

  private searchCustomersLocally(
    query?: string,
    params: PaginationParams = {}
  ): Observable<PageResponse<CustomerResponse>> {
    const normalizedQuery = (query ?? '').trim().toLowerCase();

    return this.getAllCustomers({ page: 0, size: 1000 }).pipe(
      map((page) => page.content ?? []),
      map((rows) =>
        normalizedQuery.length
          ? rows.filter((customer) => this.matchesCustomerQuery(customer, normalizedQuery))
          : rows
      ),
      map((rows) => this.toPageResponse(rows, params)),
      catchError(() => of(this.toPageResponse([], params)))
    );
  }

  private matchesCustomerQuery(customer: CustomerResponse, query: string): boolean {
    return [
      customer.fullName,
      customer.firstName,
      customer.lastName,
      customer.email,
      customer.phone,
      customer.driverLicenseNumber
    ]
      .filter((value): value is string => typeof value === 'string')
      .some((value) => value.toLowerCase().includes(query));
  }

  private toPageResponse(
    rows: CustomerResponse[],
    params: PaginationParams = {}
  ): PageResponse<CustomerResponse> {
    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const start = page * size;
    const end = start + size;
    const content = rows.slice(start, end);

    return {
      content,
      number: page,
      size,
      totalElements: rows.length,
      totalPages: Math.ceil(rows.length / size),
      numberOfElements: content.length,
      first: page === 0,
      last: end >= rows.length,
      empty: content.length === 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true
      },
      pageable: {
        offset: start,
        pageNumber: page,
        pageSize: size,
        paged: true,
        unpaged: false,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true
        }
      }
    };
  }
}
