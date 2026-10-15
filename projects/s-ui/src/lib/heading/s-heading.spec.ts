import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SHeading } from './s-heading';

@Component({
  imports: [SHeading],
  template: `<s-heading level="1">Users</s-heading><s-heading>Section</s-heading
    ><s-heading level="9">Clamped</s-heading>`,
})
class Host {}

describe('SHeading', () => {
  it('is a heading for assistive tech with the requested level', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [h1, h2, clamped] = fixture.nativeElement.querySelectorAll(
      's-heading',
    ) as NodeListOf<HTMLElement>;
    expect(h1.getAttribute('role')).toBe('heading');
    expect(h1.getAttribute('aria-level')).toBe('1');
    expect(h2.getAttribute('aria-level')).toBe('2');
    expect(clamped.getAttribute('aria-level')).toBe('4');
  });
});
