import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SSearch } from './s-search';

@Component({
  imports: [SSearch],
  template: `<s-search [(value)]="query" (searched)="searches.push($event)" debounce="200" />`,
})
class Host {
  readonly query = signal('');
  readonly searches: string[] = [];
}

describe('SSearch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;
    const type = (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    return { fixture, host, input, type };
  }

  it('is labelled with its placeholder (English default)', () => {
    const { input } = render();
    expect(input.getAttribute('aria-label')).toBe('Search…');
    expect(input.placeholder).toBe('Search…');
  });

  it('updates the value at once and searches once typing pauses', () => {
    const { fixture, type } = render();
    type('ad');
    type('admin ');
    expect(fixture.componentInstance.query()).toBe('admin ');
    expect(fixture.componentInstance.searches).toEqual([]);
    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.searches).toEqual(['admin']);
  });

  it('clears with the button: empties the value and searches immediately', () => {
    const { fixture, host, type } = render();
    type('admin');
    const clear = host.querySelector('.clear') as HTMLButtonElement;
    expect(clear.getAttribute('aria-label')).toBe('Clear search');
    clear.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.searches).toEqual(['']);
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.searches).toEqual(['']);
    expect(host.querySelector('.clear')).toBeNull();
  });
});
