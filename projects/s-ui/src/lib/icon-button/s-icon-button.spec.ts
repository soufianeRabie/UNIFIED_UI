import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SIconButton } from './s-icon-button';

@Component({
  imports: [SIconButton],
  template: `<button
    type="button"
    s-icon-button
    icon="trash"
    aria-label="Delete user"
    variant="danger"
  ></button>`,
})
class Host {}

describe('SIconButton', () => {
  it('names the button for assistive tech and as a tooltip, with a decorative icon', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(button.getAttribute('aria-label')).toBe('Delete user');
    expect(button.getAttribute('title')).toBe('Delete user');
    expect(button.dataset['variant']).toBe('danger');
    expect(button.querySelector('s-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(button.querySelector('i')?.className).toBe('pi pi-trash');
  });
});
