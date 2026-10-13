import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TabsModule, TabPanel, TabPanels, TabList, Tab, Tabs } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { NotifConfigService } from '../../core/services/notif-config.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { UserDevicesService } from '../../core/services/user-devices.service';
import { ReferenceService } from '../../core/services/reference.service';
import { ReferenceItem } from '../../core/models/reference';
import { UserPreference } from '../../core/models/user-preference';
import { UserDevice } from '../../core/models/user-device';
import { formatHttpError } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'notif-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    SelectModule,
    InputTextModule,
    MessageModule,
    TabsModule, TabPanel, TabPanels, TabList, Tab, Tabs,
    TableModule,
    DividerModule,
    TranslatePipe
  ],
  templateUrl: './users.component.html'
})
export class UsersComponent {
  private readonly config = inject(NotifConfigService);
  private readonly prefsService = inject(UserPreferencesService);
  private readonly devicesService = inject(UserDevicesService);
  private readonly referenceService = inject(ReferenceService);
  private readonly fb = inject(FormBuilder);

  channels: ReferenceItem[] = [];
  preferences: UserPreference[] = [];
  devices: UserDevice[] = [];

  preferenceUserId = '';
  deviceUserId = '';

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  preferenceForm = this.fb.group({
    userId: ['', Validators.required],
    channelId: [1, Validators.required],
    isEnabled: [true],
    preferredLanguage: ['en']
  });

  deviceForm = this.fb.group({
    userId: ['', Validators.required],
    token: ['', Validators.required],
    platform: ['WEB', Validators.required],
    deviceName: ['']
  });

  ngOnInit(): void {
    this.referenceService.getChannels().subscribe({
      next: (channels) => {
        this.channels = channels;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
    this.preferenceForm.patchValue({ userId: this.preferenceUserId || '' });
    this.deviceForm.patchValue({ userId: this.deviceUserId || '' });
  }

  loadPreferences(): void {
    if (!this.preferenceUserId) {
      this.status = { type: 'error', message: 'Enter a user ID.' };
      return;
    }
    this.status = { type: 'info', message: 'Loading preferences...' };
    this.prefsService.getByUser(this.preferenceUserId).subscribe({
      next: (prefs) => {
        this.preferences = prefs;
        this.status = null;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  savePreference(): void {
    if (this.preferenceForm.invalid) {
      this.preferenceForm.markAllAsTouched();
      return;
    }
    const value = this.preferenceForm.getRawValue();
    const payload = {
      userId: value.userId ?? '',
      channelId: Number(value.channelId ?? 1),
      isEnabled: value.isEnabled ?? true,
      preferredLanguage: value.preferredLanguage || 'en'
    };
    this.prefsService.upsert(payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Preference saved.' };
        this.preferenceUserId = value.userId ?? '';
        this.loadPreferences();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  loadDevices(): void {
    if (!this.deviceUserId) {
      this.status = { type: 'error', message: 'Enter a user ID.' };
      return;
    }
    this.status = { type: 'info', message: 'Loading devices...' };
    this.devicesService.getByUser(this.deviceUserId).subscribe({
      next: (devices) => {
        this.devices = devices;
        this.status = null;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  registerDevice(): void {
    if (this.deviceForm.invalid) {
      this.deviceForm.markAllAsTouched();
      return;
    }
    const value = this.deviceForm.getRawValue();
    const payload = {
      userId: value.userId ?? '',
      token: value.token ?? '',
      platform: value.platform ?? '',
      deviceName: value.deviceName ?? undefined
    };
    this.devicesService.register(payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Device registered.' };
        this.deviceUserId = value.userId ?? '';
        this.loadDevices();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  markSeen(device: UserDevice): void {
    this.devicesService.markSeen(device.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Device marked as seen.' };
        this.loadDevices();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  deactivate(device: UserDevice): void {
    this.devicesService.deactivate(device.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Device deactivated.' };
        this.loadDevices();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }
}


