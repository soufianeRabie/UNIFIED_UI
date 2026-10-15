import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { LANGUAGE_CHANGE_EVENT, LANGUAGE_STORAGE_KEY } from './i18n.tokens';
import type { Language, TextDirection } from './language';
import { LanguageCatalog } from './language-catalog';

interface LanguageChangeDetail {
  lang?: string;
}

/**
 * The active language (ADR 0006). The only place that knows which language is
 * in use; everything else reads `current`, `dir`, `locale` and calls `use()`.
 */
@Injectable({ providedIn: 'root' })
export class I18nStore {
  private readonly translate = inject(TranslateService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  private readonly currentCode = signal<string | null>(null);

  /** Languages the user can choose from. */
  readonly languages = this.catalog.enabled;
  readonly current = computed<Language | undefined>(
    () => this.catalog.find(this.currentCode()) ?? this.catalog.find(this.catalog.defaultCode()),
  );
  readonly dir = computed<TextDirection>(() => this.current()?.dir ?? 'ltr');
  readonly locale = computed(() => this.current()?.locale ?? '');

  /** App initializer: load the registry and the starting language before first render. */
  async init(): Promise<void> {
    await this.catalog.load();
    this.translate.addLangs(this.languages().map((l) => l.code));
    await firstValueFrom(this.translate.setFallbackLang(this.catalog.fallbackCode()));
    await this.apply(this.initialCode());
    this.window?.addEventListener(LANGUAGE_CHANGE_EVENT, (event) => {
      const code = (event as CustomEvent<LanguageChangeDetail>).detail?.lang;
      if (code && code !== this.currentCode()) void this.apply(code, { persist: true });
    });
  }

  /** Switch language; unknown or disabled codes are ignored. */
  async use(code: string): Promise<void> {
    if (!this.catalog.find(code) || code === this.currentCode()) return;
    await this.apply(code, { persist: true });
    this.window?.dispatchEvent(
      new CustomEvent<LanguageChangeDetail>(LANGUAGE_CHANGE_EVENT, { detail: { lang: code } }),
    );
  }

  private async apply(code: string, options: { persist?: boolean } = {}): Promise<void> {
    const language = this.catalog.find(code);
    if (!language) return;
    await firstValueFrom(this.translate.use(language.code));
    this.currentCode.set(language.code);
    const html = this.document.documentElement;
    html.lang = language.code;
    html.dir = language.dir;
    if (options.persist) this.write(language.code);
  }

  /** Stored choice → browser language → registry default. */
  private initialCode(): string {
    const stored = this.read();
    if (this.catalog.find(stored)) return stored as string;
    const browser = (this.window?.navigator.languages ?? []).map((l) =>
      l.slice(0, 2).toLowerCase(),
    );
    return browser.find((code) => this.catalog.find(code)) ?? this.catalog.defaultCode();
  }

  private read(): string | null {
    try {
      return this.window?.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private write(code: string): void {
    try {
      this.window?.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      // Storage unavailable (private mode): the choice lasts for this session only.
    }
  }
}
