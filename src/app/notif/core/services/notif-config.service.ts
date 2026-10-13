import { Injectable, inject } from '@angular/core';
import { AuthStore } from '../../../core/stores/auth.store';
import { getAppConfig } from '../../../core/config/app-config';

const STORAGE_KEY = 'notification-admin-config';

@Injectable({ providedIn: 'root' })
export class NotifConfigService {
  private readonly authStore = inject(AuthStore);

  get effectiveApiBaseUrl(): string {
    const stored = this.readStorage()?.apiBaseUrl;
    if (stored) return stored.replace(/\/$/, '');
    try {
      return (getAppConfig().notifApiUrl || 'http://localhost:5003').replace(/\/$/, '');
    } catch {
      return 'http://localhost:5003';
    }
  }

  get effectiveTenantId(): string {
    // 1. Explicit override saved in notif Settings page (localStorage)
    const stored = this.readStorage()?.tenantId;
    if (stored?.trim()) return stored.trim();

    // 2. AuthStore signal — populated by OIDC login when token has tenant_id/tid claim
    const fromStore = this.authStore.currentTenantId();
    if (fromStore?.trim()) return fromStore.trim();

    // 3. sessionStorage direct read — AuthStore writes to sessionStorage, not localStorage
    try {
      const fromSession = sessionStorage.getItem('tenantId');
      if (fromSession?.trim()) return fromSession.trim();
    } catch { /* ignore */ }

    // 4. Parse tenantId from the JWT access token claims directly
    const tenantFromJwt = this.readTenantFromJwt();
    if (tenantFromJwt) return tenantFromJwt;

    return '';
  }

  get authToken(): string {
    return this.authStore.accessToken() || '';
  }

  private readTenantFromJwt(): string {
    try {
      const token = this.authStore.accessToken();
      if (!token) return '';
      const parts = token.split('.');
      if (parts.length < 2) return '';
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
      // Try common claim names used by OpenIddict / ASP.NET Core
      for (const key of ['tenant_id', 'tid', 'tenantId', 'TenantId', 'tenant']) {
        const val = payload[key];
        if (typeof val === 'string' && val.trim()) return val.trim();
      }
    } catch { /* ignore */ }
    return '';
  }

  private readStorage(): { apiBaseUrl?: string; tenantId?: string } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
