import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, shareReplay, switchMap, throwError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { AuthStore } from '../stores/auth.store';

let refreshInFlight: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  const ensureHeaders = (request: HttpRequest<unknown>): HttpRequest<unknown> => {
    const token = authStore.accessToken();
    const tenantId = authStore.currentTenantId() ?? authStore.currentUser()?.tenant?.id ?? '';
    const clientVersion = 'car-rental-ui/1.0';
    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    let headers = request.headers
      .set('X-Client-Version', clientVersion)
      .set('X-Request-ID', requestId);

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (tenantId) {
      headers = headers.set('X-Tenant-ID', tenantId);
    }

    return request.clone({ headers });
  };

  const triggerRefresh = (): Observable<string> => {
    const refreshToken = authStore.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Missing refresh token'));
    }
    if (!refreshInFlight) {
      refreshInFlight = authService.refreshToken(refreshToken).pipe(
        map((res) => {
          authStore.setAuth(res, {
            source: authStore.authSource(),
          });
          return res.tokens.accessToken;
        }),
        finalize(() => {
          refreshInFlight = null;
        }),
        shareReplay(1),
      );
    }
    return refreshInFlight;
  };

  const handleWithFreshToken = (): Observable<HttpEvent<unknown>> => {
    return triggerRefresh().pipe(
      switchMap(() => next(ensureHeaders(req))),
      catchError((refreshErr) => {
        authStore.clearAuth();
        void router.navigate(['/login'], {
          queryParams: { redirectUrl: router.url },
        });
        return throwError(() => refreshErr) as Observable<HttpEvent<unknown>>;
      }),
    );
  };

  // Pre-emptive refresh if token is near expiry
  if (authStore.isAccessExpired(5_000) && authStore.refreshToken()) {
    return handleWithFreshToken();
  }

  return next(ensureHeaders(req)).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        authStore.refreshToken()
      ) {
        return handleWithFreshToken();
      }

      if (error instanceof HttpErrorResponse && error.status === 401) {
        authStore.clearAuth();
        void router.navigate(['/login'], {
          queryParams: { redirectUrl: router.url },
        });
      }

      return throwError(() => error) as Observable<HttpEvent<unknown>>;
    }),
  );
};
