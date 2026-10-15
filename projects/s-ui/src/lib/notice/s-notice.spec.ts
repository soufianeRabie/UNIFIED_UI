import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SNotice } from './s-notice';

@Component({
  imports: [SNotice],
  template: `<s-notice tone="danger">Could not save.</s-notice><s-notice>Saved.</s-notice>`,
})
class Host {}

describe('SNotice', () => {
  it('announces danger as an alert and everything else as a status, with a matching icon', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [danger, info] = fixture.nativeElement.querySelectorAll(
      's-notice',
    ) as NodeListOf<HTMLElement>;
    expect(danger.getAttribute('role')).toBe('alert');
    expect(danger.querySelector('i')?.className).toContain('pi-exclamation-circle');
    expect(danger.textContent).toContain('Could not save.');
    expect(info.getAttribute('role')).toBe('status');
    expect(info.querySelector('i')?.className).toContain('pi-info-circle');
  });
});
