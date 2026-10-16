/** One problem attached to a request member (`errors[]` of an RFC 9457 response, ADR 0009). */
export interface FieldError {
  /** JSON path as the server reports it, e.g. `username`, `filter.conditions[1].value`. */
  readonly path: string;
  readonly code: string;
  readonly args: Readonly<Record<string, unknown>>;
  /** Server-localized text; only a fallback when the UI has no `ERRORS.<code>` key. */
  readonly message: string | null;
}

export type AppErrorKind =
  | 'network'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'too-large'
  | 'rate-limited'
  | 'timeout'
  | 'unknown';

/** What every store keeps and every page renders. Features never read `HttpErrorResponse`. */
export interface AppError {
  readonly kind: AppErrorKind;
  readonly status: number;
  readonly code: string;
  readonly args: Readonly<Record<string, unknown>>;
  readonly message: string | null;
  readonly fieldErrors: readonly FieldError[];
  readonly retryAfterSeconds: number | null;
  readonly correlationId: string | null;
}
