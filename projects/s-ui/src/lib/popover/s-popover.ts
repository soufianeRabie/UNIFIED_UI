import { FocusTrapFactory, type FocusTrap } from '@angular/cdk/a11y';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { popoverPositions } from './s-popover.positions';
import type { PopoverCloseReason, PopoverPlacement, PopoverWidth } from './s-popover.types';

/**
 * A floating panel anchored to a trigger (CDK overlay). Focus moves inside when it opens and is trapped there;
 * Escape closes it and returns focus to the trigger; a click outside closes it. Flips and stays in the viewport.
 *
 *   <button #trigger type="button" s-button [attr.aria-expanded]="open()" (click)="open.set(!open())">…</button>
 *   <s-popover [(open)]="open" [anchor]="trigger" [label]="'Filter by status'">…content…</s-popover>
 */
@Component({
  selector: 's-popover',
  templateUrl: './s-popover.html',
  styleUrl: './s-popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SPopover {
  private readonly overlay = inject(Overlay);
  private readonly focusTraps = inject(FocusTrapFactory);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly document = inject(DOCUMENT);

  readonly open = model(false);
  readonly anchor = input.required<HTMLElement>();
  /** Accessible name of the panel (`role="dialog"`). */
  readonly label = input.required<string>();
  readonly placement = input<PopoverPlacement>('below');
  readonly width = input<PopoverWidth>('auto');
  /** Role of the panel; `dialog` for editors, `none` when the content brings its own (a listbox). */
  readonly panelRole = input<'dialog' | 'none'>('dialog');
  readonly closed = output<PopoverCloseReason>();

  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private ref: OverlayRef | null = null;
  private trap: FocusTrap | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.hide()));
    });
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  /** Closes and, for keyboard dismissals, gives focus back to the trigger. */
  close(reason: PopoverCloseReason = 'programmatic'): void {
    if (!this.open()) return;
    this.open.set(false);
    if (reason !== 'outside') this.anchor().focus();
    this.closed.emit(reason);
  }

  private show(): void {
    if (this.ref) return;
    const anchor = this.anchor();
    const ref = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(anchor)
        .withPositions(popoverPositions(this.placement()))
        .withPush(true)
        .withViewportMargin(8),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      direction: this.document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr',
      panelClass: 's-popover-pane',
      minWidth: this.width() === 'trigger' ? anchor.getBoundingClientRect().width : undefined,
    });
    ref.attach(new TemplatePortal(this.panel(), this.viewContainer));
    ref.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close('escape');
      }
    });
    ref.outsidePointerEvents().subscribe((event) => {
      if (!anchor.contains(event.target as Node)) this.close('outside');
    });
    this.ref = ref;
    this.trap = this.focusTraps.create(ref.overlayElement);
    void this.trap.focusInitialElementWhenReady();
  }

  private hide(): void {
    this.trap?.destroy();
    this.trap = null;
    this.ref?.dispose();
    this.ref = null;
  }
}
