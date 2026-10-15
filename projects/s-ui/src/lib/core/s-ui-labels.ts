import { Injectable, inject } from '@angular/core';
import { S_UI_DEFAULT_LABELS, S_UI_I18N, type SUiLabelKey } from './s-ui-i18n';

/**
 * Resolves library labels: host translation first, English default otherwise.
 * Read `version` inside a `computed()` so labels follow language changes.
 */
@Injectable({ providedIn: 'root' })
export class SUiLabels {
  private readonly i18n = inject(S_UI_I18N);

  readonly version = this.i18n.version;

  get(key: SUiLabelKey, params?: Readonly<Record<string, unknown>>): string {
    const translated = this.i18n.translate(key, params);
    if (translated && translated !== key) return translated;
    return interpolate(S_UI_DEFAULT_LABELS[key], params);
  }
}

function interpolate(text: string, params?: Readonly<Record<string, unknown>>): string {
  if (!params) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(params[name] ?? ''));
}
