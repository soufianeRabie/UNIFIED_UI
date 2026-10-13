import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  effect,
  inject,
} from '@angular/core';

import { PERMISSION_CONFIG, PermissionDenyMode } from '../permissions/permission.config';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[permAction]',
  standalone: true,
})
export class PermActionDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly permissionService = inject(PermissionService);
  private readonly config = inject(PERMISSION_CONFIG);

  private page = '';
  private action = '';
  private explicitAllowed: boolean | null = null;
  private modeOverride: PermissionDenyMode | null = null;
  private allowed = true;
  private originalDisplay: string | null = null;
  private originalTabIndex: string | null = null;

  constructor() {
    effect(() => {
      // Re-evaluate whenever permissions load or update.
      this.permissionService.loaded();
      this.updateView();
    });
  }

  @Input() set permAction(value: boolean | string | undefined | null) {
    if (typeof value === 'boolean') {
      this.explicitAllowed = value;
      this.page = '';
      this.action = '';
    } else if (typeof value === 'string' && value.includes(':')) {
      this.explicitAllowed = null;
      const [page, action] = value.split(':', 2);
      this.page = (page ?? '').trim();
      this.action = (action ?? '').trim();
    } else {
      this.explicitAllowed = null;
      this.page = '';
      this.action = '';
    }
    this.updateView();
  }

  @Input() set permActionMode(value: PermissionDenyMode | undefined | null) {
    this.modeOverride = (value ?? null) as PermissionDenyMode | null;
    this.updateView();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const mode = this.modeOverride ?? this.config.denyMode;
    if (!this.allowed && mode === 'disable') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private updateView(): void {
    // When no page:action string is set, only act if explicitAllowed is a boolean.
    if (!this.page || !this.action) {
      if (this.explicitAllowed === null) {
        this.reset();
        return;
      }
      // Fall through — use the explicit boolean below.
    }

    // While loading, default to denying to avoid "permission flash".
    const isLoaded = this.permissionService.loaded();
    const actionAllowed =
      this.explicitAllowed !== null
        ? this.explicitAllowed
        : isLoaded && this.permissionService.hasPermission(this.page, this.action);
    this.allowed = actionAllowed;

    const mode = this.modeOverride ?? this.config.denyMode;
    if (this.allowed) {
      this.reset();
      return;
    }

    if (mode === 'hide') {
      this.applyHide();
    } else {
      this.applyDisable();
    }
  }

  private applyHide(): void {
    if (this.originalDisplay === null) {
      this.originalDisplay = this.el.nativeElement.style.display || '';
    }
    this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    this.renderer.setAttribute(this.el.nativeElement, 'aria-hidden', 'true');
  }

  private applyDisable(): void {
    this.renderer.addClass(this.el.nativeElement, 'perm-disabled');
    this.renderer.setAttribute(this.el.nativeElement, 'aria-disabled', 'true');

    if (this.originalTabIndex === null) {
      const ti = this.el.nativeElement.getAttribute('tabindex');
      this.originalTabIndex = ti === null ? '' : ti;
    }
    this.renderer.setAttribute(this.el.nativeElement, 'tabindex', '-1');

    // Buttons/inputs support disabled; anchors don't, so the click handler also prevents navigation.
    const anyEl = this.el.nativeElement as any;
    if ('disabled' in anyEl) {
      this.renderer.setProperty(anyEl, 'disabled', true);
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', '');
    }
  }

  private reset(): void {
    this.renderer.removeClass(this.el.nativeElement, 'perm-disabled');
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-disabled');
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-hidden');

    if (this.originalDisplay !== null) {
      this.renderer.setStyle(this.el.nativeElement, 'display', this.originalDisplay);
      this.originalDisplay = null;
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'display');
    }

    if (this.originalTabIndex !== null) {
      if (this.originalTabIndex === '') {
        this.renderer.removeAttribute(this.el.nativeElement, 'tabindex');
      } else {
        this.renderer.setAttribute(this.el.nativeElement, 'tabindex', this.originalTabIndex);
      }
      this.originalTabIndex = null;
    } else {
      this.renderer.removeAttribute(this.el.nativeElement, 'tabindex');
    }

    const anyEl = this.el.nativeElement as any;
    if ('disabled' in anyEl) {
      this.renderer.setProperty(anyEl, 'disabled', false);
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
    }

    this.allowed = true;
  }
}
