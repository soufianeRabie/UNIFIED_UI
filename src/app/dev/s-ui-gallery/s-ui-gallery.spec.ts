import { TestBed } from '@angular/core/testing';
import { SUiGallery } from './s-ui-gallery';

describe('SUiGallery', () => {
  it('renders every section of the design system', () => {
    const fixture = TestBed.createComponent(SUiGallery);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toBe('S UI gallery');
    expect(host.querySelectorAll('s-kpi').length).toBe(4);
    expect(host.querySelector('s-data-table')?.querySelectorAll('tbody tr').length).toBe(4);
    expect(host.querySelector('app-gallery-query s-data-table th .filter')).not.toBeNull();
    expect(host.querySelector('app-gallery-widgets s-calendar')).not.toBeNull();
    expect(host.querySelectorAll('s-field').length).toBeGreaterThan(3);
    expect(host.querySelectorAll('s-notice').length).toBe(4);
  });
});
