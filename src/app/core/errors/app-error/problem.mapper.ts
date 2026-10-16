import type { AppError, AppErrorKind, FieldError } from './app-error';
import { COMMON_AREA } from './error-codes';

/** The transport facts needed to read an error, independent of Angular's HTTP types. */
export interface ProblemInput {
  readonly status: number;
  readonly body: unknown;
  /** Raw `Retry-After` header (seconds). */
  readonly retryAfter: string | null;
}

const KIND_BY_STATUS: Readonly<Record<number, AppErrorKind>> = {
  0: 'network',
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  413: 'too-large',
  422: 'validation',
  429: 'rate-limited',
  504: 'timeout',
};

const CODE_BY_KIND: Readonly<Record<AppErrorKind, string>> = {
  network: `${COMMON_AREA}.UNAVAILABLE`,
  validation: `${COMMON_AREA}.VALIDATION_FAILED`,
  unauthorized: `${COMMON_AREA}.UNAUTHORIZED`,
  forbidden: `${COMMON_AREA}.FORBIDDEN`,
  'not-found': `${COMMON_AREA}.NOT_FOUND`,
  conflict: `${COMMON_AREA}.CONFLICT`,
  'too-large': `${COMMON_AREA}.PAYLOAD_TOO_LARGE`,
  'rate-limited': `${COMMON_AREA}.RATE_LIMITED`,
  timeout: `${COMMON_AREA}.TIMEOUT`,
  unknown: `${COMMON_AREA}.UNEXPECTED`,
};

/** RFC 9457 problem details (handbook 08 §4) → `AppError`. Total: any input yields an error. */
export function toAppError(input: ProblemInput): AppError {
  const kind = KIND_BY_STATUS[input.status] ?? 'unknown';
  const body = asRecord(input.body);
  return {
    kind,
    status: input.status,
    code: text(body['code']) ?? CODE_BY_KIND[kind],
    args: asRecord(body['args']),
    message: text(body['title']),
    fieldErrors: asArray(body['errors']).map(toFieldError),
    retryAfterSeconds: seconds(input.retryAfter),
    correlationId: text(body['correlationId']),
  };
}

function toFieldError(raw: unknown): FieldError {
  const item = asRecord(raw);
  return {
    path: text(item['path']) ?? '',
    code: text(item['code']) ?? `${COMMON_AREA}.VALIDATION_FAILED`,
    args: asRecord(item['args']),
    message: text(item['message']),
  };
}

function seconds(header: string | null): number | null {
  const value = Number(header);
  return header !== null && Number.isFinite(value) && value >= 0 ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}
