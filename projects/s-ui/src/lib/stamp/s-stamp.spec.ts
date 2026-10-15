import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SStamp } from './s-stamp';

@Component({
  imports: [SStamp],
  template: `<s-stamp tone="success" dot>Active</s-stamp><s-stamp>Draft</s-stamp>`,
})
class Host {}

describe('SStamp', () => {
  it('shows text with a tone and an optional decorative dot', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [active, draft] = fixture.nativeElement.querySelectorAll(
      's-stamp',
    ) as NodeListOf<HTMLElement>;
    expect(active.dataset['tone']).toBe('success');
    expect(active.textContent?.trim()).toBe('Active');
    expect(active.querySelector('.dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(draft.dataset['tone']).toBe('neutral');
    expect(draft.querySelector('.dot')).toBeNull();
  });
});
