import { TestBed } from '@angular/core/testing';
import { SUiGallery } from './s-ui-gallery';

describe('SUiGallery', () => {
  it('renders every section of the design system', () => {
    const fixture = TestBed.createComponent(SUiGallery);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toBe('S UI gallery');
    expect(host.querySelectorAll('s-kpi').length).toBe(4);
    expect(host.querySelectorAll('s-data-table tbody tr').length).toBe(4);
    expect(host.querySelectorAll('s-field').length).toBeGreaterThan(3);
    expect(host.querySelectorAll('s-notice').length).toBe(4);
  });
});
