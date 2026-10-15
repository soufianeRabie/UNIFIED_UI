import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SCalendar } from './s-calendar';
import type { SDateRange } from '@s/core';

@Component({
  imports: [SCalendar],
  template: `
    <s-calendar class="single" [(value)]="day" min="2026-10-03" (picked)="picks = picks + 1" />
    <s-calendar class="range" mode="range" [(range)]="period" />
  `,
})
class Host {
  readonly day = signal<string | null>('2026-10-15');
  readonly period = signal<SDateRange | null>(null);
  picks = 0;
}

describe('SCalendar', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = (name: string) => fixture.nativeElement.querySelector(`.${name}`) as HTMLElement;
    const day = (name: string, iso: string) =>
      root(name).querySelector(`[data-iso="${iso}"]`) as HTMLButtonElement;
    return { fixture, root, day, host: fixture.componentInstance };
  }

  it('shows the month of the value as a labelled grid with one tab stop', () => {
    const { root, day } = render();
    const grid = root('single').querySelector('[role="grid"]')!;
    const title = root('single').querySelector(`#${grid.getAttribute('aria-labelledby')}`);
    expect(title?.textContent?.trim()).toBe('October 2026');
    expect(day('single', '2026-10-15').getAttribute('tabindex')).toBe('0');
    expect(root('single').querySelectorAll('.day[tabindex="0"]')).toHaveLength(1);
    expect(day('single', '2026-10-15').closest('td')?.getAttribute('aria-selected')).toBe('true');
    expect(day('single', '2026-10-02').disabled).toBe(true);
  });

  it('selects a day on click and reports it', () => {
    const { fixture, day, host } = render();
    day('single', '2026-10-20').click();
    fixture.detectChanges();
    expect(host.day()).toBe('2026-10-20');
    expect(host.picks).toBe(1);
  });

  it('moves the focus with the keyboard and changes month when needed', async () => {
    const { fixture, root, day } = render();
    day('single', '2026-10-15').focus();
    day('single', '2026-10-15').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root('single').querySelector('.title')?.textContent?.trim()).toBe('November 2026');
    expect(document.activeElement).toBe(day('single', '2026-11-15'));
  });

  it('picks a range in two clicks', () => {
    const { fixture, day, host } = render();
    const pick = (iso: string) => {
      day('range', iso).click();
      fixture.detectChanges();
    };
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    pick(`${month}-12`);
    pick(`${month}-05`);
    expect(host.period()).toEqual({ start: `${month}-05`, end: `${month}-12` });
  });
});
