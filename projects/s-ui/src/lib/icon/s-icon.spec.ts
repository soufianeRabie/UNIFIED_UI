import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SIcon } from './s-icon';

@Component({
  imports: [SIcon],
  template: `<s-icon name="search" /><s-icon name="spinner" spin label="Loading" />`,
})
class Host {}

describe('SIcon', () => {
  it('renders the glyph and is decorative unless labelled', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [plain, labelled] = fixture.nativeElement.querySelectorAll(
      's-icon',
    ) as NodeListOf<HTMLElement>;
    expect(plain.querySelector('i')?.className).toBe('pi pi-search');
    expect(plain.getAttribute('aria-hidden')).toBe('true');
    const glyph = labelled.querySelector('i') as HTMLElement;
    expect([...glyph.classList]).toEqual(expect.arrayContaining(['pi', 'pi-spinner', 'pi-spin']));
    expect(labelled.getAttribute('role')).toBe('img');
    expect(labelled.getAttribute('aria-label')).toBe('Loading');
    expect(labelled.hasAttribute('aria-hidden')).toBe(false);
  });
});
