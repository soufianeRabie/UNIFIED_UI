import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { I18nStore } from './i18n-store';

/**
 * Tells every API which language the user reads (ADR 0006 §5), so error
 * messages and notification templates come back localised.
 */
export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const locale = inject(I18nStore).locale();
  if (!locale || req.headers.has('Accept-Language')) return next(req);
  return next(req.clone({ setHeaders: { 'Accept-Language': locale } }));
};
