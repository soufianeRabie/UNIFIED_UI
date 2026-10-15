/** Writing direction of a language (ADR 0006). */
export type TextDirection = 'ltr' | 'rtl';

/** One entry of `public/i18n/languages.json`. */
export interface Language {
  /** File name and ngx-translate language id, e.g. `fr` → `/i18n/fr.json`. */
  readonly code: string;
  /** Name of the language in that language ("Français", "العربية"). */
  readonly label: string;
  readonly dir: TextDirection;
  /** BCP 47 locale for formatting and the `Accept-Language` header, e.g. `fr-FR`. */
  readonly locale: string;
  /** Disabled languages are being translated and are not offered to users yet. */
  readonly enabled: boolean;
}

/** Shape of `public/i18n/languages.json`. */
export interface LanguageConfig {
  readonly defaultLanguage: string;
  readonly fallbackLanguage: string;
  readonly languages: readonly Language[];
}
