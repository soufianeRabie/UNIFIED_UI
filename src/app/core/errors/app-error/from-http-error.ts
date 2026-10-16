import type { HttpErrorResponse } from '@angular/common/http';
import type { AppError } from './app-error';
import { toAppError } from './problem.mapper';

/** The only place an `HttpErrorResponse` is read; `data-access` calls this in its `catchError`. */
export function fromHttpError(error: unknown): AppError {
  const http = error as Partial<HttpErrorResponse> | null;
  return toAppError({
    status: typeof http?.status === 'number' ? http.status : 0,
    body: http?.error,
    retryAfter: http?.headers?.get?.('Retry-After') ?? null,
  });
}
