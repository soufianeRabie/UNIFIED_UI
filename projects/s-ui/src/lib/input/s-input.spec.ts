import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SInput } from './s-input';

@Component({
  imports: [SInput],
  template: `
    <input s-input id="code" controlSize="sm" mono invalid aria-label="Code" />
    <select s-input aria-label="Type">
      <option>A</option>
    </select>
  `,
})
class Host {}

describe('SInput (outside a field)', () => {
  it('styles native controls and keeps an explicit id', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;
    const select = host.querySelector('select') as HTMLSelectElement;
    expect(input.id).toBe('code');
    expect(input.classList).toContain('s-control');
    expect(input.dataset['size']).toBe('sm');
    expect(input.hasAttribute('data-mono')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(select.classList).toContain('s-control');
    expect(select.hasAttribute('id')).toBe(false);
  });
});
