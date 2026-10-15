import { Injectable, computed, inject } from '@angular/core';
import { S_UI_DEFAULT_LABELS, S_UI_I18N, type SUiLabelKey } from './s-ui-i18n';

const DEFAULT_LOCALE = 'en-GB';

/**
 * Resolves library labels: host translation first, English default otherwise.
 * Read `version` (or `locale`) inside a `computed()` so labels follow language changes.
 */
@Injectable({ providedIn: 'root' })
export class SUiLabels {
  private readonly i18n = inject(S_UI_I18N);

  readonly version = this.i18n.version;

  /** Active BCP 47 locale for `Intl` formatters. */
  readonly locale = computed(() => this.i18n.locale?.() || DEFAULT_LOCALE);

  get(key: SUiLabelKey, params?: Readonly<Record<string, unknown>>): string {
    const translated = this.i18n.translate(key, params);
    if (translated && translated !== key) return translated;
    return interpolate(S_UI_DEFAULT_LABELS[key], params);
  }

  /**
   * Message of a server error code (`QUERY.RANGE_INVERTED`) from the host's `ERRORS.<code>` key (UI ADR 0009);
   * the code itself when the host has no translation.
   */
  error(code: string, params?: Readonly<Record<string, unknown>>): string {
    const key = `ERRORS.${code}`;
    const translated = this.i18n.translate(key, params);
    return translated && translated !== key ? translated : code;
  }
}

function interpolate(text: string, params?: Readonly<Record<string, unknown>>): string {
  if (!params) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(params[name] ?? ''));
}
