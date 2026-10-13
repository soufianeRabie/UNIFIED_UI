import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserDevicesService } from './user-devices.service';

/**
 * Browser Web Push subscription flow. Registers a service worker, requests
 * notification permission, subscribes with the server VAPID public key, and
 * registers the subscription as a user device (platform = WEB).
 *
 * The full VAPID send pipeline lands in Phase D; this is the client shell that
 * the My Preferences page drives. It degrades gracefully when push is
 * unsupported or the VAPID key endpoint is not yet available.
 */
@Injectable({ providedIn: 'root' })
export class WebPushService {
  private readonly devices = inject(UserDevicesService);

  get isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  get permission(): NotificationPermission {
    return this.isSupported ? Notification.permission : 'denied';
  }

  async subscribe(userId: string): Promise<{ ok: boolean; message: string }> {
    if (!this.isSupported) {
      return { ok: false, message: 'Web Push is not supported in this browser.' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, message: 'Notification permission was not granted.' };
    }

    let publicKey: string;
    try {
      const res = await firstValueFrom(this.devices.getVapidPublicKey());
      publicKey = res.publicKey;
    } catch {
      return {
        ok: false,
        message: 'Server VAPID key is not available yet (enabled in the WebPush phase).'
      };
    }

    if (!publicKey) {
      return { ok: false, message: 'Server returned an empty VAPID key.' };
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer
    });

    const json = subscription.toJSON();
    await firstValueFrom(
      this.devices.register({
        userId,
        token: subscription.endpoint,
        platform: 'WEB',
        deviceName: this.describeBrowser(),
        // endpoint + keys for the server to send Web Push (Phase D)
        ...(json.keys ? { p256dh: json.keys['p256dh'], auth: json.keys['auth'], endpoint: subscription.endpoint } : {})
      } as never)
    );

    return { ok: true, message: 'Browser notifications enabled on this device.' };
  }

  async currentSubscriptionEndpoint(): Promise<string | null> {
    if (!this.isSupported) {
      return null;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  }

  private describeBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    return 'Browser';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      output[i] = raw.charCodeAt(i);
    }
    return output;
  }
}
