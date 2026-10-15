import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SFilterBar } from './s-filter-bar';

@Component({
  imports: [SFilterBar],
  template: `<s-filter-bar><input aria-label="Find" /></s-filter-bar>`,
})
class Host {}

describe('SFilterBar', () => {
  it('is a search landmark holding its filters', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('s-filter-bar') as HTMLElement;
    expect(bar.getAttribute('role')).toBe('search');
    expect(bar.querySelector('input')).not.toBeNull();
  });
});
