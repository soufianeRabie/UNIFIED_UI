import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { AuthStore } from '../../../core/stores/auth.store';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { UserDevicesService } from '../../core/services/user-devices.service';
import { ReferenceService } from '../../core/services/reference.service';
import { WebPushService } from '../../core/services/web-push.service';
import { ReferenceItem } from '../../core/models/reference';
import { UserPreference } from '../../core/models/user-preference';
import { UserDevice } from '../../core/models/user-device';
import { formatHttpError } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

interface ChannelPref {
  channelId: number;
  label: string;
  isEnabled: boolean;
}

@Component({
  selector: 'notif-my-preferences',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ToggleSwitchModule,
    TableModule,
    TagModule,
    MessageModule,
    TranslatePipe
  ],
  templateUrl: './my-preferences.component.html'
})
export class MyPreferencesComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly prefs = inject(UserPreferencesService);
  private readonly devicesService = inject(UserDevicesService);
  private readonly reference = inject(ReferenceService);
  readonly webPush = inject(WebPushService);

  readonly userId = signal<string>('');
  readonly channels = signal<ChannelPref[]>([]);
  readonly devices = signal<UserDevice[]>([]);
  readonly busy = signal(false);

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  ngOnInit(): void {
    const user = this.authStore.currentUser();
    this.userId.set(user?.username ?? '');
    if (!this.userId()) {
      this.status = { type: 'error', message: 'No signed-in user found in the security session.' };
      return;
    }
    this.loadChannels();
    this.loadDevices();
  }

  private loadChannels(): void {
    this.reference.getChannels().subscribe({
      next: (channels: ReferenceItem[]) => {
        this.prefs.getByUser(this.userId()).subscribe({
          next: (saved) => this.mergeChannels(channels, saved),
          error: () => this.mergeChannels(channels, [])
        });
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }

  private mergeChannels(channels: ReferenceItem[], saved: UserPreference[]): void {
    const byChannel = new Map(saved.map((p) => [p.channelId, p]));
    this.channels.set(
      channels.map((c) => ({
        channelId: c.id,
        label: c.label,
        isEnabled: byChannel.get(c.id)?.isEnabled ?? true
      }))
    );
  }

  toggleChannel(pref: ChannelPref): void {
    this.busy.set(true);
    this.prefs
      .upsert({
        userId: this.userId(),
        channelId: pref.channelId,
        isEnabled: pref.isEnabled,
        preferredLanguage: 'en'
      })
      .subscribe({
        next: () => {
          this.status = { type: 'success', message: `${pref.label} ${pref.isEnabled ? 'enabled' : 'disabled'}.` };
          this.busy.set(false);
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
          this.busy.set(false);
        }
      });
  }

  loadDevices(): void {
    this.devicesService.getByUser(this.userId()).subscribe({
      next: (devices) => this.devices.set(devices),
      error: () => this.devices.set([])
    });
  }

  async enableBrowserPush(): Promise<void> {
    this.busy.set(true);
    try {
      const result = await this.webPush.subscribe(this.userId());
      this.status = { type: result.ok ? 'success' : 'error', message: result.message };
      if (result.ok) {
        this.loadDevices();
      }
    } catch (err) {
      this.status = { type: 'error', message: formatHttpError(err) };
    } finally {
      this.busy.set(false);
    }
  }

  deactivateDevice(device: UserDevice): void {
    this.devicesService.deactivate(device.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Device deactivated.' };
        this.loadDevices();
      },
      error: (err) => (this.status = { type: 'error', message: formatHttpError(err) })
    });
  }
}


