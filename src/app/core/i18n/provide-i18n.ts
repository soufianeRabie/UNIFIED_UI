import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { I18nStore } from './i18n-store';
import { DEFAULT_I18N_ASSETS_PATH } from './i18n.tokens';

/**
 * Translation setup for the app. Languages come from
 * `public/i18n/languages.json` (ADR 0006), never from code.
 * Register `acceptLanguageInterceptor` in `provideHttpClient` as well.
 */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: DEFAULT_I18N_ASSETS_PATH, suffix: '.json' }),
    }),
    provideAppInitializer(() => inject(I18nStore).init()),
  ]);
}
