import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { SDateRange } from '@s/core';
import { SDatePicker } from './s-date-picker';
import { pickerText } from '@s/core';

@Component({
  imports: [SDatePicker, ReactiveFormsModule],
  template: `
    <s-date-picker class="single" aria-label="Born on" [formControl]="born" />
    <s-date-picker class="range" aria-label="Period" mode="range" [(range)]="period" />
  `,
})
class Host {
  readonly born = new FormControl<string | null>('2026-10-15');
  readonly period = signal<SDateRange | null>(null);
}

describe('SDatePicker', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  it('shows the form value in the locale format and opens a calendar', () => {
    const { fixture, el } = render();
    const trigger = el('.single .trigger') as HTMLButtonElement;
    expect(trigger.textContent).toContain('15 Oct 2026');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

    trigger.click();
    fixture.detectChanges();
    expect(document.querySelector('[role="grid"]')).not.toBeNull();
  });

  it('writes the picked day to the form and closes', () => {
    const { fixture, el, host } = render();
    (el('.single .trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (document.querySelector('[data-iso="2026-10-20"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.born.value).toBe('2026-10-20');
    expect(document.querySelector('[role="grid"]')).toBeNull();
  });

  it('clears the value', () => {
    const { fixture, el, host } = render();
    (el('.single .clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.born.value).toBeNull();
    expect(el('.single .trigger').textContent).toContain('Choose a date');
  });

  it('formats ranges, open or complete', () => {
    expect(pickerText('en-GB', 'range', null, { start: '2026-10-01', end: null })).toBe(
      '1 Oct 2026 – …',
    );
    expect(pickerText('en-GB', 'range', null, { start: '2026-10-01', end: '2026-10-15' })).toBe(
      '1 Oct 2026 – 15 Oct 2026',
    );
    expect(pickerText('en-GB', 'single', null, null)).toBeNull();
  });
});
