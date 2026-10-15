import { InjectionToken, type Signal, signal } from '@angular/core';

/**
 * How @s/ui gets text for the labels it renders itself (pagination, empty
 * states, dialog buttons, filters, calendars). The library has no i18n
 * dependency: the host app provides this contract through `provideSUi({ i18n })`.
 */
export interface SUiI18n {
  /** Changes whenever the active language changes; labels recompute on it. */
  readonly version: Signal<unknown>;
  /** Returns the translation, or the key itself when there is none. */
  translate(key: string, params?: Readonly<Record<string, unknown>>): string;
  /**
   * BCP 47 locale of the active language (`fr-FR`, `ar-MA`). Drives every `Intl` formatter: month and weekday
   * names, first day of the week, number and date formats (ADR 0008 §2). Defaults to `en-GB`.
   */
  readonly locale?: Signal<string>;
}

const ENGLISH_ONLY: SUiI18n = {
  version: signal(0).asReadonly(),
  translate: (key) => key,
};

export const S_UI_I18N = new InjectionToken<SUiI18n>('S_UI_I18N', {
  factory: () => ENGLISH_ONLY,
});
