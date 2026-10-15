import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SEmpty } from './s-empty';

@Component({
  imports: [SEmpty],
  template: `<s-empty icon="users" title="No users yet">Invite someone to get started.</s-empty>`,
})
class Host {}

describe('SEmpty', () => {
  it('shows the icon, the title and the projected sentence', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('s-empty') as HTMLElement;
    expect(empty.querySelector('i')?.className).toBe('pi pi-users');
    expect(empty.querySelector('.title')?.textContent).toBe('No users yet');
    expect(empty.querySelector('.text')?.textContent).toBe('Invite someone to get started.');
  });
});
