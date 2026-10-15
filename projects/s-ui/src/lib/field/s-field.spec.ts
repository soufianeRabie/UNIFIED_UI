import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SInput } from '../input/s-input';
import { SField } from './s-field';

@Component({
  imports: [SField, SInput],
  template: `
    <s-field label="Email" hint="Used for password resets" [error]="error()" required>
      <input s-input type="email" />
    </s-field>
  `,
})
class Host {
  readonly error = signal<string | null>(null);
}

describe('SField + SInput', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return { fixture, host, input: host.querySelector('input') as HTMLInputElement };
  }

  it('labels the projected control and describes it with the hint', () => {
    const { host, input } = render();
    const label = host.querySelector('label') as HTMLLabelElement;
    expect(input.id).toMatch(/^s-field-\d+$/);
    expect(label.htmlFor).toBe(input.id);
    expect(label.textContent).toContain('Email');
    expect(host.querySelector('.required')?.getAttribute('aria-hidden')).toBe('true');
    const hint = host.querySelector('.hint') as HTMLElement;
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.classList).toContain('s-control');
  });

  it('switches to the error: announced, linked and marked invalid', () => {
    const { fixture, host, input } = render();
    fixture.componentInstance.error.set('Enter a valid email');
    fixture.detectChanges();
    const error = host.querySelector('.error') as HTMLElement;
    expect(error.getAttribute('role')).toBe('alert');
    expect(host.querySelector('.hint')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
