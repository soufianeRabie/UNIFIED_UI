import { InjectionToken } from '@angular/core';
import type { LanguageConfig } from './language';

/** Folder that holds `languages.json` and one `<code>.json` per language. */
export const DEFAULT_I18N_ASSETS_PATH = '/i18n/';

export const I18N_ASSETS_PATH = new InjectionToken<string>('I18N_ASSETS_PATH', {
  factory: () => DEFAULT_I18N_ASSETS_PATH,
});

/**
 * Used only when `languages.json` cannot be loaded, so the app still starts
 * in its default language instead of failing.
 */
export const I18N_SAFETY_CONFIG = new InjectionToken<LanguageConfig>('I18N_SAFETY_CONFIG', {
  factory: () => ({
    defaultLanguage: 'fr',
    fallbackLanguage: 'fr',
    languages: [{ code: 'fr', label: 'Français', dir: 'ltr', locale: 'fr-FR', enabled: true }],
  }),
});

/** localStorage key holding the user's chosen language code. */
export const LANGUAGE_STORAGE_KEY = 'app_lang';

/** Window event used to keep a host shell (React) and this app on the same language. */
export const LANGUAGE_CHANGE_EVENT = 'appLangChange';
