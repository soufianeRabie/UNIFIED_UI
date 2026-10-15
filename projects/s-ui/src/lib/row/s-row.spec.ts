import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SRow } from './s-row';

@Component({
  imports: [SRow],
  template: `<s-row gap="4" justify="between" wrap /><s-row />`,
})
class Host {}

describe('SRow', () => {
  it('maps inputs to data attributes and omits wrap unless set', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [custom, plain] = fixture.nativeElement.querySelectorAll(
      's-row',
    ) as NodeListOf<HTMLElement>;
    expect(custom.dataset['gap']).toBe('4');
    expect(custom.dataset['justify']).toBe('between');
    expect(custom.hasAttribute('data-wrap')).toBe(true);
    expect(plain.dataset['gap']).toBe('2');
    expect(plain.hasAttribute('data-wrap')).toBe(false);
  });
});
