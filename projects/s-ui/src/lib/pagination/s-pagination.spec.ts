import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SPagination } from './s-pagination';

@Component({
  imports: [SPagination],
  template: `<s-pagination [(page)]="page" pageSize="20" [total]="total()" />`,
})
class Host {
  readonly page = signal(1);
  readonly total = signal(145);
}

describe('SPagination', () => {
  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const buttons = () => [...host.querySelectorAll('button')] as HTMLButtonElement[];
    return { fixture, host, buttons };
  }

  it('shows the range and a window of pages with the current one marked', () => {
    const { host, buttons } = render();
    expect(host.querySelector('.range')?.textContent).toBe('1–20 of 145');
    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
    const numbers = buttons().filter((b) => /^\d+$/.test(b.textContent?.trim() ?? ''));
    expect(numbers.map((b) => b.textContent?.trim())).toEqual(['1', '2', '3', '4', '5']);
    expect(numbers[0].getAttribute('aria-current')).toBe('page');
    expect(buttons()[0].disabled).toBe(true);
  });

  it('moves the page two-way and clamps to the last page', () => {
    const { fixture, host, buttons } = render();
    buttons()[buttons().length - 1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(8);
    expect(host.querySelector('.range')?.textContent).toBe('141–145 of 145');
    expect(buttons()[buttons().length - 1].disabled).toBe(true);
  });

  it('hides navigation when everything fits on one page', () => {
    const { fixture, host } = render();
    fixture.componentInstance.total.set(12);
    fixture.detectChanges();
    expect(host.querySelector('nav')).toBeNull();
    expect(host.querySelector('.range')?.textContent).toBe('1–12 of 12');
  });
});
