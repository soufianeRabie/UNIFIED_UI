import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSUi } from './provide-s-ui';
import { SUiLabels } from './s-ui-labels';

describe('SUiLabels', () => {
  it('falls back to the English default and interpolates parameters', () => {
    const labels = TestBed.inject(SUiLabels);
    expect(labels.get('S.PAGINATION.PAGE', { page: 3 })).toBe('Page 3');
  });

  it('uses the host translation when there is one', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSUi({
          i18n: () => ({
            version: signal(1),
            translate: (key) => (key === 'S.DIALOG.CANCEL' ? 'Annuler' : key),
          }),
        }),
      ],
    });
    const labels = TestBed.inject(SUiLabels);
    expect(labels.get('S.DIALOG.CANCEL')).toBe('Annuler');
    expect(labels.get('S.DIALOG.CLOSE')).toBe('Close');
  });
});
