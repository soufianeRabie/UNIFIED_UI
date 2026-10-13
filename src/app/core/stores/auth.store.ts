import { computed, Injectable, signal } from '@angular/core';

import { AuthResponse, TenantBranding } from '../models/auth-response.model';
import { Branch } from '../models/branch.model';
import { User } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TENANT_ID_KEY = 'tenantId';
const CURRENT_USER_KEY = 'currentUser';
const EXPIRES_AT_KEY = 'expiresAt';
const BRANDING_KEY = 'tenantBranding';
const AUTH_SOURCE_KEY = 'authSource';
const LEGACY_REMEMBER_ME_KEY = 'rememberMe';

export type AuthSource = 'api' | 'oidc';

interface AuthOptions {
  expiresAt?: number;
  activeBranch?: Branch | null;
  source?: AuthSource;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly currentUser = signal<User | null>(this.readJson<User>(CURRENT_USER_KEY));
  readonly accessToken = signal<string | null>(this.readStorage(ACCESS_TOKEN_KEY));
  readonly refreshToken = signal<string | null>(this.readStorage(REFRESH_TOKEN_KEY));
  readonly currentTenantId = signal<string | null>(this.readStorage(TENANT_ID_KEY));
  readonly expiresAt = signal<number | null>(this.readNumber(EXPIRES_AT_KEY));
  readonly authSource = signal<AuthSource>(this.readAuthSource());
  readonly tenantBranding = signal<TenantBranding | null>(
    this.readJson<TenantBranding>(BRANDING_KEY),
  );

  readonly isAuthenticated = computed(() => {
    const token = this.accessToken();
    if (!token) {
      return false;
    }

    const exp = this.expiresAt();
    if (!exp) {
      return true;
    }

    return exp > Date.now();
  });

  /**
   * Reactive permission codes derived from the JWT access token.
   *
   * Supported claim formats:
   * 1. authorities: ["PERM_fleet:read", "ROLE_ADMIN"]
   * 2. permissions: ["fleet:read", "fleet:write"]
   * 3. PERM_fleet:read: true
   */
  readonly userPermissions = computed<string[]>(() => {
    const token = this.accessToken();
    if (!token) {
      return [];
    }

    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return [];
      }

      const payload = this.decodeJwtPayload(parts[1]);
      const perms: string[] = [];

      if (Array.isArray(payload['authorities'])) {
        for (const auth of payload['authorities'] as string[]) {
          if (auth.startsWith('PERM_')) {
            perms.push(auth.slice(5).toLowerCase());
          }
        }
      }

      if (Array.isArray(payload['permissions'])) {
        perms.push(...(payload['permissions'] as string[]).map((p) => p.toLowerCase()));
      }

      for (const key of Object.keys(payload)) {
        if (key.startsWith('PERM_') && payload[key]) {
          perms.push(key.slice(5).toLowerCase());
        }
      }

      return [...new Set(perms)];
    } catch {
      return [];
    }
  });

  hasPermission(code: string): boolean {
    return this.userPermissions().includes(code);
  }

  setAuth(auth: AuthResponse, options: AuthOptions = {}): void {
    const source = options.source ?? this.authSource();
    const expiresAt =
      options.expiresAt ??
      (auth.tokens.accessTokenExpiresAt
        ? new Date(auth.tokens.accessTokenExpiresAt).getTime() - 5000
        : null);

    const branding: TenantBranding | null = auth.tenantBranding ?? null;
    const userWithBranch =
      options.activeBranch && auth.user
        ? { ...auth.user, branch: options.activeBranch }
        : (auth.user ?? null);

    this.accessToken.set(auth.tokens.accessToken);
    this.refreshToken.set(auth.tokens.refreshToken || null);
    this.currentUser.set(userWithBranch);
    this.currentTenantId.set(auth.tenantId ?? null);
    this.expiresAt.set(expiresAt);
    this.authSource.set(source);
    this.tenantBranding.set(branding);

    this.writeStorage(ACCESS_TOKEN_KEY, auth.tokens.accessToken);

    if (auth.tokens.refreshToken) {
      this.writeStorage(REFRESH_TOKEN_KEY, auth.tokens.refreshToken);
    } else {
      this.removeStorage(REFRESH_TOKEN_KEY);
    }

    if (userWithBranch) {
      this.writeJson(CURRENT_USER_KEY, userWithBranch);
    } else {
      this.removeStorage(CURRENT_USER_KEY);
    }

    if (auth.tenantId) {
      this.writeStorage(TENANT_ID_KEY, auth.tenantId);
    } else {
      this.removeStorage(TENANT_ID_KEY);
    }

    if (expiresAt) {
      this.writeStorage(EXPIRES_AT_KEY, expiresAt.toString());
    } else {
      this.removeStorage(EXPIRES_AT_KEY);
    }

    this.writeStorage(AUTH_SOURCE_KEY, source);

    if (branding) {
      this.writeJson(BRANDING_KEY, branding);
    } else {
      this.removeStorage(BRANDING_KEY);
    }

    this.removeStorage(LEGACY_REMEMBER_ME_KEY);
  }

  clearAuth(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.currentTenantId.set(null);
    this.expiresAt.set(null);
    this.authSource.set('api');
    this.tenantBranding.set(null);

    this.removeStorage(CURRENT_USER_KEY);
    this.removeStorage(ACCESS_TOKEN_KEY);
    this.removeStorage(REFRESH_TOKEN_KEY);
    this.removeStorage(TENANT_ID_KEY);
    this.removeStorage(EXPIRES_AT_KEY);
    this.removeStorage(BRANDING_KEY);
    this.removeStorage(AUTH_SOURCE_KEY);
    this.removeStorage(LEGACY_REMEMBER_ME_KEY);
  }

  setActiveBranch(branch: Branch): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    const updatedUser: User = { ...user, branch };
    this.currentUser.set(updatedUser);
    this.writeJson(CURRENT_USER_KEY, updatedUser);
  }

  isAccessExpired(bufferMs = 0): boolean {
    const exp = this.expiresAt();
    if (!exp) {
      return false;
    }

    return exp - bufferMs <= Date.now();
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.sessionStorage.getItem(key);
  }

  private readJson<T>(key: string): T | null {
    const rawValue = this.readStorage(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  private readNumber(key: string): number | null {
    const rawValue = this.readStorage(key);
    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private readAuthSource(): AuthSource {
    return this.readStorage(AUTH_SOURCE_KEY) === 'oidc' ? 'oidc' : 'api';
  }

  private decodeJwtPayload(payload: string): Record<string, unknown> {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  }

  private writeStorage(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(key, value);
    window.localStorage.removeItem(key);
  }

  private writeJson(key: string, value: object): void {
    this.writeStorage(key, JSON.stringify(value));
  }

  private removeStorage(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  }
}
