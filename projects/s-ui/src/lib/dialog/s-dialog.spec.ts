import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SDialog } from './s-dialog';

@Component({
  imports: [SDialog],
  template: `
    <s-dialog [(open)]="open" title="Edit user">
      <input aria-label="Name" class="name" />
      <button type="button" s-dialog-footer class="save">Save</button>
    </s-dialog>
  `,
})
class Host {
  readonly open = signal(false);
}

describe('SDialog', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const openIt = () => {
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
    };
    const dialog = () => document.querySelector('[role="dialog"]') as HTMLElement | null;
    return { fixture, openIt, dialog };
  }

  it('renders nothing until opened', () => {
    const { dialog } = render();
    expect(dialog()).toBeNull();
  });

  it('opens a labelled modal dialog with the body and footer content', () => {
    const { fixture, openIt, dialog } = render();
    openIt();
    const el = dialog() as HTMLElement;
    expect(el).not.toBeNull();
    // Modal for assistive tech: the rest of the page is hidden while it is open.
    const page = fixture.nativeElement as HTMLElement;
    const pageRoot = [...document.body.children].find((c) => c.contains(page)) as HTMLElement;
    expect(pageRoot.getAttribute('aria-hidden')).toBe('true');
    const title = document.getElementById(el.getAttribute('aria-labelledby') ?? '');
    expect(title?.textContent).toBe('Edit user');
    expect(el.querySelector('.body .name')).not.toBeNull();
    expect(el.querySelector('.foot .save')).not.toBeNull();
  });

  it('closes from the close button and reports it two-way', async () => {
    const { fixture, openIt, dialog } = render();
    openIt();
    const close = dialog()?.querySelector('.head button') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close');
    close.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('closes when the host sets open to false', async () => {
    const { fixture, openIt, dialog } = render();
    openIt();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialog()).toBeNull();
  });
});
