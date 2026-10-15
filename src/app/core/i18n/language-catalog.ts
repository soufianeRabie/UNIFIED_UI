import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { I18N_ASSETS_PATH, I18N_SAFETY_CONFIG } from './i18n.tokens';
import type { Language, LanguageConfig } from './language';

/**
 * The language registry (`public/i18n/languages.json`, ADR 0006).
 * Loaded once at startup; every consumer reads it through signals.
 */
@Injectable({ providedIn: 'root' })
export class LanguageCatalog {
  private readonly http = inject(HttpClient);
  private readonly assetsPath = inject(I18N_ASSETS_PATH);
  private readonly safetyConfig = inject(I18N_SAFETY_CONFIG);

  private readonly config = signal<LanguageConfig | null>(null);
  private loading: Promise<void> | null = null;

  /** Languages offered to users. */
  readonly enabled = computed<readonly Language[]>(() =>
    (this.config()?.languages ?? []).filter((l) => l.enabled),
  );
  readonly defaultCode = computed(
    () => this.config()?.defaultLanguage ?? this.safetyConfig.defaultLanguage,
  );
  readonly fallbackCode = computed(
    () => this.config()?.fallbackLanguage ?? this.safetyConfig.fallbackLanguage,
  );

  /** Idempotent: concurrent callers share one request. */
  load(): Promise<void> {
    this.loading ??= firstValueFrom(
      this.http.get<LanguageConfig>(`${this.assetsPath}languages.json`),
    )
      .then((config) => this.config.set(isUsable(config) ? config : this.safetyConfig))
      .catch(() => this.config.set(this.safetyConfig));
    return this.loading;
  }

  /** An enabled language by code, or `undefined`. */
  find(code: string | null | undefined): Language | undefined {
    if (!code) return undefined;
    return this.enabled().find((l) => l.code === code);
  }
}

function isUsable(config: LanguageConfig | null): config is LanguageConfig {
  if (!config || !Array.isArray(config.languages)) return false;
  const enabled = new Set(config.languages.filter((l) => l.enabled).map((l) => l.code));
  return enabled.has(config.defaultLanguage) && enabled.has(config.fallbackLanguage);
}
