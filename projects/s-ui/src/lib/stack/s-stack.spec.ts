import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SStack } from './s-stack';

@Component({
  imports: [SStack],
  template: `<s-stack gap="5" align="center"><span>a</span></s-stack
    ><s-stack />`,
})
class Host {}

describe('SStack', () => {
  it('exposes gap and alignment as data attributes, with a default gap', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [custom, plain] = fixture.nativeElement.querySelectorAll(
      's-stack',
    ) as NodeListOf<HTMLElement>;
    expect(custom.dataset['gap']).toBe('5');
    expect(custom.dataset['align']).toBe('center');
    expect(custom.textContent).toBe('a');
    expect(plain.dataset['gap']).toBe('3');
    expect(plain.hasAttribute('data-align')).toBe(false);
  });
});
