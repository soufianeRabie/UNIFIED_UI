import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { SUiLabels, provideSUi } from '@s/ui';
import { I18nStore } from './i18n-store';
import { sUiI18nAdapter } from './s-ui-i18n.adapter';

describe('sUiI18nAdapter', () => {
  const code = signal('fr');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideSUi({ i18n: sUiI18nAdapter }),
        { provide: I18nStore, useValue: { current: computed(() => ({ code: code() })) } },
      ],
    });
    TestBed.inject(TranslateService).setTranslation('fr', { S: { DIALOG: { CANCEL: 'Annuler' } } });
    TestBed.inject(TranslateService).use('fr');
  });

  it('serves library labels from the app translations, English default otherwise', () => {
    const labels = TestBed.inject(SUiLabels);
    expect(labels.get('S.DIALOG.CANCEL')).toBe('Annuler');
    expect(labels.get('S.DIALOG.CLOSE')).toBe('Close');
  });

  it('bumps its version when the language changes, so labels recompute', () => {
    const labels = TestBed.inject(SUiLabels);
    const seen = computed(() => labels.version());
    expect(seen()).toBe('fr');
    code.set('en');
    expect(seen()).toBe('en');
  });
});
