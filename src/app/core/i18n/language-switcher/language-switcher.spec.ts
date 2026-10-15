import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { I18nStore } from '../i18n-store';
import type { Language } from '../language';
import { LanguageSwitcher } from './language-switcher';

const FR: Language = { code: 'fr', label: 'Français', dir: 'ltr', locale: 'fr-FR', enabled: true };
const AR: Language = { code: 'ar', label: 'العربية', dir: 'rtl', locale: 'ar-MA', enabled: true };

function render(languages: Language[]) {
  const current = signal<Language>(languages[0]);
  const store = {
    languages: signal(languages),
    current: computed(() => current()),
    use: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [LanguageSwitcher],
    providers: [provideTranslateService(), { provide: I18nStore, useValue: store }],
  });
  const fixture = TestBed.createComponent(LanguageSwitcher);
  fixture.detectChanges();
  return { host: fixture.nativeElement as HTMLElement, store };
}

describe('LanguageSwitcher', () => {
  it('is hidden when only one language is enabled', () => {
    const { host } = render([FR]);
    expect(host.querySelector('select')).toBeNull();
  });

  it('lists every enabled language in its own script and direction, with a label', () => {
    const { host } = render([FR, AR]);
    const select = host.querySelector('select') as HTMLSelectElement;
    const options = [...select.options];
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Français', 'العربية']);
    expect(options[1].getAttribute('dir')).toBe('rtl');
    expect(options[1].getAttribute('lang')).toBe('ar');
    expect(host.querySelector(`label[for="${select.id}"]`)).not.toBeNull();
  });

  it('switches language on change', () => {
    const { host, store } = render([FR, AR]);
    const select = host.querySelector('select') as HTMLSelectElement;
    select.value = 'ar';
    select.dispatchEvent(new Event('change'));
    expect(store.use).toHaveBeenCalledWith('ar');
  });
});
