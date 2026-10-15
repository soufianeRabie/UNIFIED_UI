import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { provideTranslateService } from '@ngx-translate/core';
import { I18nStore } from './i18n-store';
import { LANGUAGE_CHANGE_EVENT, LANGUAGE_STORAGE_KEY } from './i18n.tokens';
import type { LanguageConfig } from './language';

const REGISTRY: LanguageConfig = {
  defaultLanguage: 'fr',
  fallbackLanguage: 'fr',
  languages: [
    { code: 'fr', label: 'Français', dir: 'ltr', locale: 'fr-FR', enabled: true },
    { code: 'en', label: 'English', dir: 'ltr', locale: 'en-GB', enabled: true },
    { code: 'ar', label: 'العربية', dir: 'rtl', locale: 'ar-MA', enabled: true },
    { code: 'de', label: 'Deutsch', dir: 'ltr', locale: 'de-DE', enabled: false },
  ],
};

describe('I18nStore', () => {
  let store: I18nStore;
  let http: HttpTestingController;
  let html: HTMLElement;

  async function start(registry: LanguageConfig | 'error' = REGISTRY): Promise<void> {
    const done = store.init();
    const req = http.expectOne('/i18n/languages.json');
    if (registry === 'error') req.flush('missing', { status: 404, statusText: 'Not Found' });
    else req.flush(registry);
    await done;
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTranslateService()],
    });
    store = TestBed.inject(I18nStore);
    http = TestBed.inject(HttpTestingController);
    html = TestBed.inject(DOCUMENT).documentElement;
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['xx-XX']);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('offers only enabled languages from the registry', async () => {
    await start();
    expect(store.languages().map((l) => l.code)).toEqual(['fr', 'en', 'ar']);
  });

  it('starts in the registry default when nothing is stored and the browser language is unknown', async () => {
    await start();
    expect(store.current()?.code).toBe('fr');
    expect(html.lang).toBe('fr');
    expect(html.dir).toBe('ltr');
  });

  it('prefers the stored choice, then the browser language', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    await start();
    expect(store.current()?.code).toBe('en');
  });

  it('uses the browser language when it is enabled', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ar-MA', 'fr']);
    await start();
    expect(store.current()?.code).toBe('ar');
  });

  it('ignores a stored language that is disabled', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'de');
    await start();
    expect(store.current()?.code).toBe('fr');
  });

  it('switches to a right-to-left language, persists it and notifies a host shell', async () => {
    await start();
    const heard: string[] = [];
    const listener = (e: Event) => heard.push((e as CustomEvent<{ lang: string }>).detail.lang);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, listener);

    await store.use('ar');

    expect(store.dir()).toBe('rtl');
    expect(store.locale()).toBe('ar-MA');
    expect(html.dir).toBe('rtl');
    expect(html.lang).toBe('ar');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');
    expect(heard).toEqual(['ar']);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, listener);
  });

  it('ignores unknown and disabled languages', async () => {
    await start();
    await store.use('de');
    await store.use('zz');
    expect(store.current()?.code).toBe('fr');
  });

  it('still starts in the safety language when the registry cannot be loaded', async () => {
    await start('error');
    expect(store.current()?.code).toBe('fr');
    expect(store.languages().length).toBe(1);
  });
});
