import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { PermissionService } from '../../core/services/permission.service';
import { NotifConfigService } from '../../core/services/notif-config.service';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { AuthStore } from '../../../core/stores/auth.store';

const PAGE_CODE = 'NOTIF_SETTINGS';

@Component({
  selector: 'notif-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    PermActionDirective
  ],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly config = inject(NotifConfigService);
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  readonly resolvedTenantId = this.config.effectiveTenantId;
  readonly sessionTenantId = this.authStore.currentTenantId();

  form = this.fb.group({
    apiBaseUrl: [this.config.effectiveApiBaseUrl, [Validators.required]],
    tenantId: [this.config.effectiveTenantId, [Validators.required]]
  });

  save(): void {
    if (this.form.invalid) {
      this.status = { type: 'error', message: 'Please fill in the required fields.' };
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    try {
      localStorage.setItem('notification-admin-config', JSON.stringify({
        apiBaseUrl: value.apiBaseUrl?.trim() || '',
        tenantId: value.tenantId?.trim() || ''
      }));
    } catch { /* ignore */ }
    this.status = { type: 'success', message: 'Configuration saved. Reload to apply.' };
  }

  resetDefaults(): void {
    this.form.reset({
      apiBaseUrl: 'http://localhost:5003',
      tenantId: ''
    });
    this.status = { type: 'info', message: 'Restored defaults. Click save to apply.' };
  }
}


