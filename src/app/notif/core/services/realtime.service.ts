import { Injectable, inject, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { NotifConfigService } from './notif-config.service';
import { NotificationItem } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly config = inject(NotifConfigService);
  private readonly zone = inject(NgZone);

  private connection?: signalR.HubConnection;

  readonly notification$ = new Subject<NotificationItem>();
  readonly unreadCount$ = new Subject<number>();
  readonly connected$ = new Subject<boolean>();

  start(): void {
    if (this.connection) return;

    const apiBase = this.config.effectiveApiBaseUrl.replace(/\/$/, '');
    const hubBase = apiBase.replace(/\/api$/, '');
    const hubUrl = `${hubBase}/hubs/notifications`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => this.config.authToken })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('ReceiveNotification', (payload: NotificationItem) => {
      this.zone.run(() => this.notification$.next(payload));
    });

    this.connection.on('UnreadCount', (count: number) => {
      this.zone.run(() => this.unreadCount$.next(count));
    });

    this.connection.onreconnected(() => this.zone.run(() => this.connected$.next(true)));
    this.connection.onclose(() => this.zone.run(() => this.connected$.next(false)));

    this.connection
      .start()
      .then(() => this.zone.run(() => this.connected$.next(true)))
      .catch((err) => {
        console.warn('NOTIF: SignalR connection failed.', err);
        this.zone.run(() => this.connected$.next(false));
      });
  }

  stop(): void {
    this.connection?.stop().catch(() => undefined);
    this.connection = undefined;
  }
}
