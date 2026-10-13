import { Injectable, inject } from '@angular/core';

import { AuthResponse } from '../models/auth-response.model';
import { User } from '../models/user.model';
import { AuthStore } from '../stores/auth.store';
import { PermissionService } from '../../secu/services/permission.service';
import { getAppConfig } from '../config/app-config';

interface OidcMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  issuer?: string;
}

interface OidcTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

interface PendingLogin {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUrl: string;
  createdAt: string;
}

interface PendingLogout {
  state: string;
}

export interface OidcCallbackResult {
  redirectUrl: string;
}

const pendingLoginKey = 'security-ui.oidc.pending-login';
const pendingLogoutKey = 'security-ui.oidc.pending-logout';
// [SRB ] Kept so logout can send id_token_hint to end_session_endpoint — the server then
//        ends its own session in a single redirect (no login flash, clean cookie clear).
const idTokenKey = 'security-ui.oidc.id-token';
const pendingLoginTtlMs = 10 * 60 * 1000;
const clientId = 'main-frontend';
const scope = 'openid profile email roles offline_access security-api';
const callbackPath = '/auth/callback';
const logoutCallbackPath = '/auth/logout-callback';
const defaultRedirectUrl = '/admin';
const homeUrl = '/';

@Injectable({ providedIn: 'root' })
export class OidcAuthService {
  private readonly authStore = inject(AuthStore);
  private readonly permissionService = inject(PermissionService);
  private metadataCache: OidcMetadata | null = null;

  async startLogin(redirectUrl = defaultRedirectUrl): Promise<void> {
    const metadata = await this.getMetadata();
    const state = this.randomBase64Url(32);
    const nonce = this.randomBase64Url(32);
    const codeVerifier = this.randomBase64Url(64);
    const codeChallenge = await this.sha256Base64Url(codeVerifier);

    const pending: PendingLogin = {
      state,
      nonce,
      codeVerifier,
      redirectUrl: this.safeLocalRedirect(redirectUrl),
      createdAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(pendingLoginKey, JSON.stringify(pending));

    const url = new URL(metadata.authorization_endpoint);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    // [SRB ] Force the OIDC server to show the login form every time. Without this, the
    //        server reuses the browser session cookie after logout and silently re-issues
    //        tokens — the user never sees a password prompt.
    url.searchParams.set('prompt', 'login');

    window.location.assign(url.toString());
  }

  async handleLoginCallback(callbackUrl = window.location.href): Promise<OidcCallbackResult> {
    const url = new URL(callbackUrl);
    const error = url.searchParams.get('error');
    if (error) {
      throw new Error(`${error}: ${url.searchParams.get('error_description') ?? 'Login failed'}`);
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const issuer = url.searchParams.get('iss');
    if (!code) {
      throw new Error('Missing OIDC authorization code.');
    }
    if (!issuer) {
      throw new Error('Missing OIDC issuer.');
    }
    this.assertExpectedIssuer(issuer);

    const pending = this.readJson<PendingLogin>(window.sessionStorage.getItem(pendingLoginKey));
    if (!pending?.state || pending.state !== state) {
      throw new Error('OIDC state validation failed. Start login again.');
    }
    if (this.isPendingLoginExpired(pending)) {
      window.sessionStorage.removeItem(pendingLoginKey);
      throw new Error('OIDC login request expired. Start login again.');
    }

    const metadata = await this.getMetadata();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: this.redirectUri(),
      code,
      code_verifier: pending.codeVerifier,
    });

    const tokenResponse = await this.postTokenRequest(metadata.token_endpoint, body);
    this.assertIdTokenNonce(tokenResponse.id_token, pending.nonce);
    this.storeTokenResponse(tokenResponse);
    window.sessionStorage.removeItem(pendingLoginKey);

    return { redirectUrl: pending.redirectUrl };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const metadata = await this.getMetadata();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });

    const tokenResponse = await this.postTokenRequest(metadata.token_endpoint, body);
    return this.storeTokenResponse({
      ...tokenResponse,
      refresh_token: tokenResponse.refresh_token ?? refreshToken,
    });
  }

  async startLogout(): Promise<void> {
    const metadata = await this.getMetadata();
    const state = this.randomBase64Url(32);
    const pending: PendingLogout = { state };

    window.sessionStorage.setItem(pendingLogoutKey, JSON.stringify(pending));

    // [SRB ] Grab the id_token before clearing auth — it's the hint that lets the server end
    //        its own session in one hop instead of bouncing through the login page.
    const idTokenHint = window.sessionStorage.getItem(idTokenKey);

    this.permissionService.invalidate();
    this.authStore.clearAuth();
    window.sessionStorage.removeItem(idTokenKey);

    const url = new URL(metadata.end_session_endpoint);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('post_logout_redirect_uri', this.postLogoutRedirectUri());
    url.searchParams.set('state', state);
    if (idTokenHint) {
      url.searchParams.set('id_token_hint', idTokenHint);
    }

    window.location.assign(url.toString());
  }

  handleLogoutCallback(callbackUrl = window.location.href): OidcCallbackResult {
    const url = new URL(callbackUrl);
    const state = url.searchParams.get('state');
    const pending = this.readJson<PendingLogout>(window.sessionStorage.getItem(pendingLogoutKey));

    window.sessionStorage.removeItem(pendingLogoutKey);
    this.permissionService.invalidate();
    this.authStore.clearAuth();

    if (state && pending?.state && state !== pending.state) {
      throw new Error('OIDC logout state validation failed.');
    }

    return { redirectUrl: homeUrl };
  }

  private async postTokenRequest(tokenEndpoint: string, body: URLSearchParams): Promise<OidcTokenResponse> {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const payload = await this.readTokenResponse(response);

    if (!response.ok || !payload.access_token) {
      throw new Error(
        `${payload.error ?? 'token_error'}: ${payload.error_description ?? response.statusText}`,
      );
    }

    return payload as OidcTokenResponse;
  }

  private storeTokenResponse(tokenResponse: OidcTokenResponse): AuthResponse {
    // [SRB ] Remember the id_token so logout can pass it as id_token_hint. Refresh responses
    //        may omit it, so only overwrite when present.
    if (tokenResponse.id_token) {
      window.sessionStorage.setItem(idTokenKey, tokenResponse.id_token);
    }

    const claims = this.decodeJwt(tokenResponse.access_token);
    const tenantId = this.claimAsString(claims, 'tenant_id') ?? this.claimAsString(claims, 'tid');
    const expiresAt = this.resolveAccessTokenExpiry(tokenResponse, claims);
    const authResponse: AuthResponse = {
      requiresMfa: false,
      tokens: {
        accessToken: tokenResponse.access_token,
        accessTokenExpiresAt: expiresAt.toISOString(),
        refreshToken: tokenResponse.refresh_token ?? '',
        refreshTokenExpiresAt: this.resolveRefreshTokenExpiry().toISOString(),
        mustChangePassword: false,
      },
      challenge: null,
      tenantId: tenantId ?? undefined,
      user: this.mapUser(claims, tenantId),
    };

    this.permissionService.invalidate();
    this.authStore.setAuth(authResponse, {
      expiresAt: expiresAt.getTime() - 5000,
      source: 'oidc',
    });

    // If JWT had no tenant claim, resolve it from the SecurityAPI user profile
    if (!tenantId) {
      this.resolveUserTenantFromApi(tokenResponse.access_token);
    }

    return authResponse;
  }

  private resolveUserTenantFromApi(accessToken: string): void {
    const securityUrl = getAppConfig().securityUrl.replace(/\/$/, '');
    fetch(`${securityUrl}/api/secu/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then((profile: { tenantId?: string } | null) => {
        const tenant = profile?.tenantId?.trim();
        if (tenant) {
          this.authStore.currentTenantId.set(tenant);
        }
      })
      .catch(() => { /* non-fatal — tenant may be set manually in Settings */ });
  }

  private async getMetadata(): Promise<OidcMetadata> {
    if (this.metadataCache) {
      return this.metadataCache;
    }

    const authority = getAppConfig().securityUrl.replace(/\/$/, '');
    const response = await fetch(`${authority}/.well-known/openid-configuration`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Unable to load OIDC metadata from ${authority}.`);
    }

    const metadata = (await response.json()) as OidcMetadata;
    if (
      !metadata.authorization_endpoint ||
      !metadata.token_endpoint ||
      !metadata.end_session_endpoint
    ) {
      throw new Error(`OIDC metadata from ${authority} is missing required endpoints.`);
    }
    if (metadata.issuer && this.normalizeIssuer(metadata.issuer) !== this.normalizeIssuer(authority)) {
      throw new Error(`OIDC metadata issuer does not match configured authority ${authority}.`);
    }

    this.metadataCache = metadata;
    return metadata;
  }

  private mapUser(claims: Record<string, unknown>, tenantId: string | null): User {
    const subject = this.claimAsString(claims, 'sub') ?? '';
    const username =
      this.claimAsString(claims, 'preferred_username') ??
      this.claimAsString(claims, 'name') ??
      subject;
    const roles = this.claimAsStringArray(claims, 'role');

    return {
      id: subject,
      username,
      email: this.claimAsString(claims, 'email') ?? undefined,
      role: roles[0],
      roles,
      tenant: tenantId ? { id: tenantId, code: tenantId, name: tenantId, active: true } : undefined,
    };
  }

  private resolveAccessTokenExpiry(
    tokenResponse: OidcTokenResponse,
    claims: Record<string, unknown>,
  ): Date {
    const exp = Number(claims['exp']);
    if (Number.isFinite(exp) && exp > 0) {
      return new Date(exp * 1000);
    }

    return new Date(Date.now() + (tokenResponse.expires_in ?? 3600) * 1000);
  }

  private resolveRefreshTokenExpiry(): Date {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  private async readTokenResponse(response: Response): Promise<
    Partial<OidcTokenResponse> & {
      error?: string;
      error_description?: string;
    }
  > {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as Partial<OidcTokenResponse> & {
        error?: string;
        error_description?: string;
      };
    } catch {
      if (response.ok) {
        throw new Error('OIDC token endpoint returned invalid JSON.');
      }

      return {
        error: 'token_error',
        error_description: text || response.statusText,
      };
    }
  }

  private assertExpectedIssuer(issuer: string): void {
    const expected = getAppConfig().securityUrl;
    if (this.normalizeIssuer(issuer) !== this.normalizeIssuer(expected)) {
      throw new Error('OIDC issuer validation failed.');
    }
  }

  private assertIdTokenNonce(idToken: string | undefined, expectedNonce: string): void {
    if (!idToken) {
      throw new Error('Missing OIDC ID token.');
    }

    const nonce = this.claimAsString(this.decodeJwt(idToken), 'nonce');
    if (nonce !== expectedNonce) {
      throw new Error('OIDC nonce validation failed.');
    }
  }

  private isPendingLoginExpired(pending: PendingLogin): boolean {
    const createdAt = Date.parse(pending.createdAt);
    return !Number.isFinite(createdAt) || Date.now() - createdAt > pendingLoginTtlMs;
  }

  private normalizeIssuer(value: string): string {
    try {
      const url = new URL(value);
      return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, '')}`;
    } catch {
      return value.replace(/\/$/, '');
    }
  }

  private safeLocalRedirect(value: string | null | undefined): string {
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return defaultRedirectUrl;
    }
    return value;
  }

  private redirectUri(): string {
    return `${window.location.origin}${callbackPath}`;
  }

  private postLogoutRedirectUri(): string {
    return `${window.location.origin}${logoutCallbackPath}`;
  }

  private decodeJwt(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length < 2) {
      return {};
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  }

  private claimAsString(claims: Record<string, unknown>, key: string): string | null {
    const value = claims[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
    return null;
  }

  private claimAsStringArray(claims: Record<string, unknown>, key: string): string[] {
    const value = claims[key];
    if (typeof value === 'string' && value.trim()) {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && Boolean(item));
    }
    return [];
  }

  private async sha256Base64Url(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return this.bytesToBase64Url(new Uint8Array(hash));
  }

  private randomBase64Url(size: number): string {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return this.bytesToBase64Url(bytes);
  }

  private bytesToBase64Url(bytes: Uint8Array): string {
    let value = '';
    for (const byte of bytes) {
      value += String.fromCharCode(byte);
    }

    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private readJson<T>(value: string | null): T | null {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
}
