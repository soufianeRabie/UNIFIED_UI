import { computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { SUiI18n } from '@s/ui';
import { I18nStore } from './i18n-store';

/**
 * Bridges @s/ui's own labels (`S.*` keys) to the app's languages (ADR 0006).
 * Pass to `provideSUi({ i18n: sUiI18nAdapter })`.
 */
export function sUiI18nAdapter(): SUiI18n {
  const store = inject(I18nStore);
  const translate = inject(TranslateService);
  return {
    version: computed(() => store.current()?.code),
    translate: (key, params) => translate.instant(key, params ? { ...params } : undefined),
    locale: computed(() => store.locale() || 'en-GB'),
  };
}
