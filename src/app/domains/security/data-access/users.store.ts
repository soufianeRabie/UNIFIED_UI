import { httpResource } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { createQuery, type SQuery } from '@s/core';
import type { Observable } from 'rxjs';
import { type AppError, fromHttpError } from '../../../core/errors/app-error';
import { fromQuerySchemaDto, type PagedResultDto, type QuerySchemaDto } from '../../../core/query';
import type { User, UserDraft, UserId, UserPage } from '../domain/user';
import { normalizeDraft } from '../domain/user.rules';
import type { UserDto } from './dto/user.dto';
import { toUserPage } from './mappers/user.mapper';
import { UsersApi } from './users.api';

const PAGE_SIZE = 20;
const NO_USERS: UserPage = { items: [], total: 0 };

/**
 * State of the users screen. Provided at the route, so it dies with the page. Components read signals and call
 * intents; they never see the API, the DTOs or `HttpErrorResponse`.
 */
@Injectable()
export class UsersStore {
  private readonly api = inject(UsersApi);
  private readonly destroyRef = inject(DestroyRef);

  private readonly queryState = signal<SQuery>(createQuery({ size: PAGE_SIZE }));
  private readonly commandState = signal<{ running: boolean; error: AppError | null }>({
    running: false,
    error: null,
  });

  private readonly list = httpResource<UserPage>(() => this.api.queryRequest(this.queryState()), {
    parse: (raw) => toUserPage(raw as PagedResultDto<UserDto>),
  });
  private readonly schemaResource = httpResource(() => this.api.schemaRequest(), {
    parse: (raw) => fromQuerySchemaDto(raw as QuerySchemaDto),
  });

  /** Keeps the previous page on screen while the next one loads, so paging does not flash the skeleton. */
  private readonly page = linkedSignal<UserPage | undefined, UserPage>({
    source: () => this.list.value(),
    computation: (next, previous) => next ?? previous?.value ?? NO_USERS,
  });

  readonly query = this.queryState.asReadonly();
  readonly users = computed<readonly User[]>(() => this.page().items);
  readonly total = computed(() => this.page().total);
  readonly loading = computed(() => this.list.isLoading());
  readonly error = computed<AppError | null>(() =>
    this.list.error() ? fromHttpError(this.list.error()) : null,
  );
  readonly fields = computed(() => this.schemaResource.value()?.fields ?? []);
  readonly limits = computed(() => this.schemaResource.value()?.limits ?? null);
  /** Last create/update/delete failure (field errors included); cleared by `clearCommandError()`. */
  readonly commandError = computed(() => this.commandState().error);
  readonly saving = computed(() => this.commandState().running);

  setQuery(query: SQuery): void {
    this.queryState.set(query);
  }

  reload(): void {
    this.list.reload();
  }

  save(draft: UserDraft, id: UserId | null, onDone: () => void): void {
    const clean = normalizeDraft(draft);
    this.run(id ? this.api.update(id, clean) : this.api.create(clean), onDone);
  }

  remove(id: UserId, onDone: () => void = () => undefined): void {
    this.run(this.api.remove(id), onDone);
  }

  clearCommandError(): void {
    this.commandState.update((state) => ({ ...state, error: null }));
  }

  private run(command: Observable<unknown>, onDone: () => void): void {
    this.commandState.set({ running: true, error: null });
    command.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.commandState.set({ running: false, error: null });
        this.list.reload();
        onDone();
      },
      error: (error: AppError) => this.commandState.set({ running: false, error }),
    });
  }
}
