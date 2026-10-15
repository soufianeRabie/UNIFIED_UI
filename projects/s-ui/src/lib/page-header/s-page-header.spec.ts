import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SPageHeader } from './s-page-header';

@Component({
  imports: [SPageHeader],
  template: `
    <s-page-header title="Users" subtitle="Manage accounts" eyebrow="Security">
      <button type="button" s-page-actions>New user</button>
    </s-page-header>
    <s-page-header title="Bare" />
  `,
})
class Host {}

describe('SPageHeader', () => {
  it('renders the title as the page h1 with optional eyebrow, subtitle and actions', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [full, bare] = fixture.nativeElement.querySelectorAll(
      's-page-header',
    ) as NodeListOf<HTMLElement>;
    expect(full.querySelector('h1')?.textContent).toBe('Users');
    expect(full.querySelector('.eyebrow')?.textContent).toBe('Security');
    expect(full.querySelector('.subtitle')?.textContent).toBe('Manage accounts');
    expect(full.querySelector('.actions button')?.textContent).toBe('New user');
    expect(bare.querySelector('.eyebrow')).toBeNull();
    expect(bare.querySelector('.subtitle')).toBeNull();
  });
});
