import { HttpClient, type HttpResourceRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { SQuery } from '@s/core';
import { type Observable, catchError, throwError } from 'rxjs';
import { getAppConfig } from '../../../core/config/app-config';
import { fromHttpError } from '../../../core/errors/app-error';
import { toQueryRequestDto } from '../../../core/query';
import type { UserDraft, UserId } from '../domain/user';
import { toCreateRequest, toUpdateRequest } from './mappers/user.mapper';

/** HTTP only: builds requests and maps failures to `AppError`. Holds no state. */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${getAppConfig().apiUrl}/secu/users`;
  }

  /** Request of the list resource (handbook 08): re-evaluated when the query signal changes. */
  queryRequest(query: SQuery): HttpResourceRequest {
    return { url: `${this.base}/query`, method: 'POST', body: toQueryRequestDto(query) };
  }

  schemaRequest(): HttpResourceRequest {
    return { url: `${this.base}/query/schema` };
  }

  create(draft: UserDraft): Observable<unknown> {
    return this.http.post(this.base, toCreateRequest(draft)).pipe(asAppError());
  }

  update(id: UserId, draft: UserDraft): Observable<unknown> {
    return this.http.put(`${this.base}/${id}`, toUpdateRequest(draft)).pipe(asAppError());
  }

  remove(id: UserId): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`).pipe(asAppError());
  }
}

function asAppError() {
  return catchError<unknown, Observable<never>>((error) => throwError(() => fromHttpError(error)));
}
