import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { acceptLanguageInterceptor } from './accept-language.interceptor';
import { I18nStore } from './i18n-store';

describe('acceptLanguageInterceptor', () => {
  const locale = signal('ar-MA');
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([acceptLanguageInterceptor])),
        provideHttpClientTesting(),
        { provide: I18nStore, useValue: { locale } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the active locale', () => {
    client.get('/api/users').subscribe();
    expect(http.expectOne('/api/users').request.headers.get('Accept-Language')).toBe('ar-MA');
  });

  it('keeps an explicit Accept-Language header', () => {
    client.get('/api/users', { headers: { 'Accept-Language': 'en' } }).subscribe();
    expect(http.expectOne('/api/users').request.headers.get('Accept-Language')).toBe('en');
  });

  it('sends nothing before a language is known', () => {
    locale.set('');
    client.get('/api/users').subscribe();
    expect(http.expectOne('/api/users').request.headers.has('Accept-Language')).toBe(false);
  });
});
