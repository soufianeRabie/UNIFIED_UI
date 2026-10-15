import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SPopover } from './s-popover';
import type { PopoverCloseReason } from './s-popover.types';

@Component({
  imports: [SPopover],
  template: `
    <button #trigger type="button" class="trigger" (click)="open.set(!open())">Open</button>
    <button type="button" class="elsewhere">Elsewhere</button>
    <s-popover
      [(open)]="open"
      [anchor]="trigger"
      label="Filter by status"
      (closed)="reasons.push($event)"
    >
      <input aria-label="Value" class="value" />
    </s-popover>
  `,
})
class Host {
  readonly open = signal(false);
  readonly reasons: PopoverCloseReason[] = [];
}

describe('SPopover', () => {
  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove()));

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const panel = () =>
      document.querySelector('.s-popover-pane [role="dialog"]') as HTMLElement | null;
    const trigger = fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement;
    return { fixture, panel, trigger, host: fixture.componentInstance };
  }

  it('renders nothing until opened, then a labelled dialog panel with the content', () => {
    const { fixture, panel, trigger } = render();
    expect(panel()).toBeNull();
    trigger.click();
    fixture.detectChanges();
    expect(panel()?.getAttribute('aria-label')).toBe('Filter by status');
    expect(panel()?.querySelector('.value')).not.toBeNull();
  });

  it('closes on Escape, returns focus to the trigger and reports why', () => {
    const { fixture, panel, trigger, host } = render();
    trigger.click();
    fixture.detectChanges();
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.open()).toBe(false);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(host.reasons).toEqual(['escape']);
  });

  it('closes when the model is set to false', () => {
    const { fixture, panel, host } = render();
    host.open.set(true);
    fixture.detectChanges();
    host.open.set(false);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});
