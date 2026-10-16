import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { AppError, FieldError } from './app-error';
import { COMMON_AREA } from './error-codes';

const UNEXPECTED_KEY = 'ERRORS.COMMON.UNEXPECTED';
/** Errors the server has not migrated to codes yet: their own text is the only precise message. */
const LEGACY_CODE = `${COMMON_AREA}.LEGACY`;

/**
 * Turns an error code into the user's language: `ERRORS.<code>` with its arguments (ADR 0009). The server text is
 * only a fallback for a code the UI does not know yet. Not reactive on its own: call it inside a `computed()` that
 * also reads the active language.
 */
@Injectable({ providedIn: 'root' })
export class ErrorMessages {
  private readonly translate = inject(TranslateService);

  text(error: Pick<AppError | FieldError, 'code' | 'args' | 'message'>): string {
    if (error.code === LEGACY_CODE && error.message) return error.message;
    const key = `ERRORS.${error.code}`;
    const translated = this.translate.instant(key, error.args) as string;
    if (translated !== key) return translated;
    return error.message ?? (this.translate.instant(UNEXPECTED_KEY) as string);
  }
}
