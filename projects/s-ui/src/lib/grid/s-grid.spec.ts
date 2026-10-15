import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SGrid } from './s-grid';

@Component({
  imports: [SGrid],
  template: `<s-grid columns="4" gap="6" aside /><s-grid />`,
})
class Host {}

describe('SGrid', () => {
  it('exposes columns, gap and aside as data attributes, with defaults', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [custom, plain] = fixture.nativeElement.querySelectorAll(
      's-grid',
    ) as NodeListOf<HTMLElement>;
    expect(custom.dataset['columns']).toBe('4');
    expect(custom.dataset['gap']).toBe('6');
    expect(custom.hasAttribute('data-aside')).toBe(true);
    expect(plain.dataset['columns']).toBe('2');
    expect(plain.hasAttribute('data-aside')).toBe(false);
  });
});
