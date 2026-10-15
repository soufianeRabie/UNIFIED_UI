import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SButton } from './s-button';

@Component({
  imports: [SButton],
  template: `
    <button
      type="submit"
      s-button
      variant="primary"
      icon="plus"
      [loading]="busy()"
      (click)="clicks = clicks + 1"
    >
      Save
    </button>
    <a s-button href="/back">Back</a>
  `,
})
class Host {
  readonly busy = signal(false);
  clicks = 0;
}

describe('SButton', () => {
  it('keeps the native element and its behaviour, with variant data attributes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [button, link] = fixture.nativeElement.querySelectorAll(
      '[s-button]',
    ) as NodeListOf<HTMLElement>;
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.dataset['variant']).toBe('primary');
    expect(link.tagName).toBe('A');
    expect(link.dataset['variant']).toBe('secondary');
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('swaps the icon for a spinner and sets aria-busy while loading', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(button.querySelector('i')?.className).toBe('pi pi-plus');
    expect(button.hasAttribute('aria-busy')).toBe(false);

    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();
    const glyph = button.querySelector('i') as HTMLElement;
    expect([...glyph.classList]).toEqual(expect.arrayContaining(['pi', 'pi-spinner', 'pi-spin']));
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
