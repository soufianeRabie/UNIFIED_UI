import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { PermissionService } from '../../core/services/permission.service';
import { EmailProvidersService } from '../../core/services/email-providers.service';
import { SmsProvidersService } from '../../core/services/sms-providers.service';
import { EmailProvider } from '../../core/models/email-provider';
import { SmsProvider } from '../../core/models/sms-provider';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { formatHttpError } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'NOTIF_PROVIDERS';

@Component({
  selector: 'notif-providers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    TabsModule,
    TableModule,
    PermActionDirective,
    TranslatePipe
  ],
  templateUrl: './providers.component.html'
})
export class ProvidersComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly emailService = inject(EmailProvidersService);
  private readonly smsService = inject(SmsProvidersService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  emailProviders: EmailProvider[] = [];
  smsProviders: SmsProvider[] = [];
  selectedEmail: EmailProvider | null = null;
  selectedSms: SmsProvider | null = null;
  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  emailForm = this.fb.group({
    name: ['', Validators.required],
    host: ['', Validators.required],
    port: [587, Validators.required],
    username: [''],
    password: [''],
    fromAddress: ['', Validators.required],
    fromName: [''],
    useSsl: [true],
    isDefault: [false],
    isActive: [true],
    priorityOrder: [1, Validators.required]
  });

  smsForm = this.fb.group({
    name: ['', Validators.required],
    providerType: ['TWILIO', Validators.required],
    apiUrl: [''],
    apiKey: [''],
    apiSecret: [''],
    senderId: [''],
    isDefault: [false],
    isActive: [true],
    priorityOrder: [1, Validators.required]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status = { type: 'info', message: 'Loading providers...' };
    this.emailService.list().subscribe({
      next: (providers) => {
        this.emailProviders = providers;
        this.cdr.detectChanges();
        this.smsService.list().subscribe({
          next: (sms) => {
            this.smsProviders = sms;
            this.status = null;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.status = { type: 'error', message: formatHttpError(err) };
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.detectChanges();
      }
    });
  }

  editEmail(provider: EmailProvider): void {
    this.selectedEmail = provider;
    this.emailForm.patchValue({
      name: provider.name,
      host: provider.host,
      port: provider.port,
      username: provider.username || '',
      password: '',
      fromAddress: provider.fromAddress,
      fromName: provider.fromName || '',
      useSsl: provider.useSsl,
      isDefault: provider.isDefault,
      isActive: provider.isActive,
      priorityOrder: provider.priorityOrder
    });
    this.emailForm.controls.name.disable();
  }

  resetEmailForm(): void {
    this.selectedEmail = null;
    this.emailForm.reset({
      name: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      fromAddress: '',
      fromName: '',
      useSsl: true,
      isDefault: false,
      isActive: true,
      priorityOrder: 1
    });
    this.emailForm.controls.name.enable();
  }

  saveEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    const value = this.emailForm.getRawValue();
    if (this.selectedEmail) {
      const payload = {
        host: value.host ?? '',
        port: Number(value.port ?? 0),
        username: value.username ?? undefined,
        password: value.password ?? undefined,
        fromAddress: value.fromAddress ?? '',
        fromName: value.fromName ?? undefined,
        useSsl: value.useSsl ?? false,
        isDefault: value.isDefault ?? false,
        isActive: value.isActive ?? true,
        priorityOrder: Number(value.priorityOrder ?? 1)
      };
      this.emailService.update(this.selectedEmail.id, payload).subscribe({
        next: () => {
          this.status = { type: 'success', message: 'Email provider updated.' };
          this.load();
          this.resetEmailForm();
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
        }
      });
      return;
    }
    const createPayload = {
      name: value.name ?? '',
      host: value.host ?? '',
      port: Number(value.port ?? 0),
      username: value.username ?? undefined,
      password: value.password ?? undefined,
      fromAddress: value.fromAddress ?? '',
      fromName: value.fromName ?? undefined,
      useSsl: value.useSsl ?? false,
      isDefault: value.isDefault ?? false,
      isActive: value.isActive ?? true,
      priorityOrder: Number(value.priorityOrder ?? 1)
    };
    this.emailService.create(createPayload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Email provider created.' };
        this.load();
        this.resetEmailForm();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  deleteEmail(provider: EmailProvider): void {
    if (!confirm(`Delete email provider ${provider.name}?`)) {
      return;
    }
    this.emailService.delete(provider.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Email provider deleted.' };
        this.load();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  editSms(provider: SmsProvider): void {
    this.selectedSms = provider;
    this.smsForm.patchValue({
      name: provider.name,
      providerType: provider.providerType,
      apiUrl: provider.apiUrl || '',
      apiKey: provider.apiKey || '',
      apiSecret: provider.apiSecret || '',
      senderId: provider.senderId || '',
      isDefault: provider.isDefault,
      isActive: provider.isActive,
      priorityOrder: provider.priorityOrder
    });
    this.smsForm.controls.name.disable();
    this.smsForm.controls.providerType.disable();
  }

  resetSmsForm(): void {
    this.selectedSms = null;
    this.smsForm.reset({
      name: '',
      providerType: 'TWILIO',
      apiUrl: '',
      apiKey: '',
      apiSecret: '',
      senderId: '',
      isDefault: false,
      isActive: true,
      priorityOrder: 1
    });
    this.smsForm.controls.name.enable();
    this.smsForm.controls.providerType.enable();
  }

  saveSms(): void {
    if (this.smsForm.invalid) {
      this.smsForm.markAllAsTouched();
      return;
    }
    const value = this.smsForm.getRawValue();
    if (this.selectedSms) {
      const payload = {
        apiUrl: value.apiUrl ?? undefined,
        apiKey: value.apiKey ?? undefined,
        apiSecret: value.apiSecret ?? undefined,
        senderId: value.senderId ?? undefined,
        isDefault: value.isDefault ?? false,
        isActive: value.isActive ?? true,
        priorityOrder: Number(value.priorityOrder ?? 1)
      };
      this.smsService.update(this.selectedSms.id, payload).subscribe({
        next: () => {
          this.status = { type: 'success', message: 'SMS provider updated.' };
          this.load();
          this.resetSmsForm();
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
        }
      });
      return;
    }
    const smsCreatePayload = {
      name: value.name ?? '',
      providerType: value.providerType ?? '',
      apiUrl: value.apiUrl ?? undefined,
      apiKey: value.apiKey ?? undefined,
      apiSecret: value.apiSecret ?? undefined,
      senderId: value.senderId ?? undefined,
      isDefault: value.isDefault ?? false,
      isActive: value.isActive ?? true,
      priorityOrder: Number(value.priorityOrder ?? 1)
    };
    this.smsService.create(smsCreatePayload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'SMS provider created.' };
        this.load();
        this.resetSmsForm();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  deleteSms(provider: SmsProvider): void {
    if (!confirm(`Delete SMS provider ${provider.name}?`)) {
      return;
    }
    this.smsService.delete(provider.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'SMS provider deleted.' };
        this.load();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }
}


