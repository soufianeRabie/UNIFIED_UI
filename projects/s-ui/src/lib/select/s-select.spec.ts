import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SSelect } from './s-select';
import type { SSelectOption } from './s-select.types';

const STATUSES: SSelectOption<string>[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Locked', label: 'Locked' },
  { value: 'Disabled', label: 'Disabled', disabled: true },
];

@Component({
  imports: [SSelect, ReactiveFormsModule],
  template: `
    <s-select class="single" aria-label="Status" [options]="options" [(value)]="status" />
    <s-select
      class="multi"
      aria-label="Statuses"
      [options]="options"
      multiple
      [formControl]="many"
    />
  `,
})
class Host {
  readonly options = STATUSES;
  readonly status = signal<string | readonly string[] | null>(null);
  readonly many = new FormControl<readonly string[]>(['Active', 'Locked']);
}

describe('SSelect', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger = (name: string) =>
      fixture.nativeElement.querySelector(`.${name} .trigger`) as HTMLButtonElement;
    const options = () => [...document.querySelectorAll('[role="option"]')] as HTMLElement[];
    return { fixture, trigger, options, host: fixture.componentInstance };
  }

  it('shows the placeholder, opens a listbox and picks one value', () => {
    const { fixture, trigger, options, host } = render();
    expect(trigger('single').textContent).toContain('Select…');
    expect(trigger('single').getAttribute('aria-haspopup')).toBe('listbox');

    trigger('single').click();
    fixture.detectChanges();
    expect(trigger('single').getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe('Status');

    options()[1].click();
    fixture.detectChanges();
    expect(host.status()).toBe('Locked');
    expect(options()).toHaveLength(0);
    expect(trigger('single').textContent).toContain('Locked');
  });

  it('works as a multi-select form control and keeps the list open', () => {
    const { fixture, trigger, options, host } = render();
    expect(trigger('multi').textContent).toContain('Active, Locked');

    trigger('multi').click();
    fixture.detectChanges();
    expect(document.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe(
      'true',
    );
    options()[0].click();
    fixture.detectChanges();

    expect(host.many.value).toEqual(['Locked']);
    expect(options()).toHaveLength(3);
  });

  it('does not open when the form control is disabled', () => {
    const { fixture, trigger, host } = render();
    host.many.disable();
    fixture.detectChanges();
    expect(trigger('multi').disabled).toBe(true);
  });
});
