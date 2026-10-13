import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotifConfigService } from './notif-config.service';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private http: HttpClient, private config: NotifConfigService) {}

  get<T>(path: string, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), this.withDefaultHeaders(options));
  }

  post<T>(path: string, body?: unknown, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body ?? {}, this.withDefaultHeaders(options));
  }

  put<T>(path: string, body?: unknown, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body ?? {}, this.withDefaultHeaders(options));
  }

  delete<T>(path: string, options?: { params?: HttpParams; headers?: HttpHeaders }): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), this.withDefaultHeaders(options));
  }

  /** GET that returns the raw response (blob + headers) — used for file downloads. */
  getBlob(path: string): Observable<HttpResponse<Blob>> {
    const opts = this.withDefaultHeaders();
    return this.http.get(this.buildUrl(path), {
      headers: opts.headers,
      responseType: 'blob',
      observe: 'response',
    });
  }

  private buildUrl(path: string): string {
    if (!path) return this.config.effectiveApiBaseUrl;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = this.config.effectiveApiBaseUrl;
    const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${trimmedBase}/${trimmedPath}`;
  }

  private withDefaultHeaders(
    options?: { params?: HttpParams; headers?: HttpHeaders }
  ): { params?: HttpParams; headers?: HttpHeaders } {
    let headers = options?.headers ?? new HttpHeaders();
    const tenantId = this.config.effectiveTenantId;
    if (tenantId) headers = headers.set('X-Tenant-Id', tenantId);
    if (this.config.authToken) headers = headers.set('Authorization', `Bearer ${this.config.authToken}`);
    return { ...options, headers };
  }
}
