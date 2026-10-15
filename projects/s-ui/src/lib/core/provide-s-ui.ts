import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { S_UI_I18N, type SUiI18n } from './s-ui-i18n';

export interface SUiOptions {
  /** Factory (runs in an injection context) returning the host's i18n bridge. */
  readonly i18n?: () => SUiI18n;
}

/** One-line setup in the host's `app.config.ts`. */
export function provideSUi(options: SUiOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders(
    options.i18n ? [{ provide: S_UI_I18N, useFactory: options.i18n }] : [],
  );
}
