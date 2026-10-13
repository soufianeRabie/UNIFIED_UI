import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasAction]',
  standalone: true
})
export class HasActionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private requiredPage = '';
  private requiredAction = '';
  private isVisible = false;

  constructor() {
    // Automatically re-evaluate when permissions signal changes
    effect(() => {
      // Must read the signals inside the effect to track it
      const loaded = this.permissionService.loaded();
      this.updateView();
    });
  }

  @Input() set hasAction(value: string | undefined | null) {
    if (!value || !value.includes(':')) {
      this.requiredPage = '';
      this.requiredAction = '';
    } else {
      const parts = value.split(':');
      this.requiredPage = parts[0].trim();
      this.requiredAction = parts[1].trim();
    }
    this.updateView();
  }

  private updateView() {
    if (!this.requiredPage || !this.requiredAction) {
      this.clear();
      return;
    }

    const allowed = this.permissionService.hasPermission(this.requiredPage, this.requiredAction);

    if (allowed && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!allowed && this.isVisible) {
      this.clear();
    }
  }

  private clear() {
    this.viewContainer.clear();
    this.isVisible = false;
  }
}
