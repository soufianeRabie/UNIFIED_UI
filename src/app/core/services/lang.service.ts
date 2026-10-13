import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'en' | 'fr';
const STORAGE_KEY = 'app_lang';
const DEFAULT_LANG: AppLang = 'fr';

@Injectable({ providedIn: 'root' })
export class LangService {
  private readonly translate = inject(TranslateService);

  /** Read the stored preference, falling back to browser language then default. */
  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLang | null;
    const browserLang = navigator.language.slice(0, 2) as AppLang;
    const lang = stored ?? (['en', 'fr'].includes(browserLang) ? browserLang : DEFAULT_LANG);

    this.translate.addLangs(['en', 'fr']);
    this.translate.setFallbackLang(DEFAULT_LANG).subscribe();
    this.translate.use(lang).subscribe();

    // [SRB ] Listen for language changes fired by the React host shell so both
    //        apps stay in sync without a full page reload.
    window.addEventListener('appLangChange', (e: Event) => {
      const lang = (e as CustomEvent<{ lang: AppLang }>).detail.lang;
      if (lang && lang !== this.current) {
        this.translate.use(lang).subscribe();
        localStorage.setItem(STORAGE_KEY, lang);
      }
    });
  }

  get current(): AppLang {
    return (this.translate.currentLang() ?? DEFAULT_LANG) as AppLang;
  }

  toggle(): void {
    this.use(this.current === 'fr' ? 'en' : 'fr');
  }

  use(lang: AppLang): void {
    this.translate.use(lang).subscribe();
    localStorage.setItem(STORAGE_KEY, lang);
    // [SRB ] Broadcast so the React host picks up the change without a page reload.
    window.dispatchEvent(new CustomEvent('appLangChange', { detail: { lang } }));
  }
}
