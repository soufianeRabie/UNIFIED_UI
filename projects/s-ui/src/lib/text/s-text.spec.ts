import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SText } from './s-text';

@Component({
  imports: [SText],
  template: `<s-text size="sm" tone="muted" weight="semibold" mono truncate>admin</s-text
    ><s-text>plain</s-text>`,
})
class Host {}

describe('SText', () => {
  it('maps every input to a data attribute and leaves unset ones off', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [styled, plain] = fixture.nativeElement.querySelectorAll(
      's-text',
    ) as NodeListOf<HTMLElement>;
    expect(styled.dataset).toMatchObject({ size: 'sm', tone: 'muted', weight: 'semibold' });
    expect(styled.hasAttribute('data-mono')).toBe(true);
    expect(styled.hasAttribute('data-truncate')).toBe(true);
    expect(styled.textContent).toBe('admin');
    expect(plain.getAttributeNames().filter((n) => n.startsWith('data-'))).toEqual([]);
  });
});
