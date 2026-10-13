import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

import { AuthStore } from '../../core/stores/auth.store';
import { getAppConfig } from '../../core/config/app-config';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule, PasswordModule, TranslatePipe],
  template: `
    <main class="cp-shell">
      <section class="cp-card">
        <div class="cp-header">
          <div class="cp-icon">🔑</div>
          <h1>{{ (forced() ? 'SECURITY.CHANGE_PASSWORD.REQUIRED_TITLE' : 'SECURITY.CHANGE_PASSWORD.TITLE') | translate }}</h1>
          @if (forced()) {
            <p class="cp-subtitle">{{ 'SECURITY.CHANGE_PASSWORD.FORCED_SUBTITLE' | translate }}</p>
          }
        </div>

        @if (success()) {
          <div class="cp-success">
            <span class="cp-success-icon">✓</span>
            <p>{{ 'SECURITY.CHANGE_PASSWORD.SUCCESS' | translate }}</p>
            <p class="cp-subtitle">{{ 'SECURITY.CHANGE_PASSWORD.REDIRECTING' | translate }}</p>
          </div>
        } @else {
          <form (ngSubmit)="submit()" #f="ngForm" class="cp-form">
            @if (error()) {
              <p-message severity="error" [text]="error() || ''" styleClass="w-full"></p-message>
            }

            <div class="cp-field">
              <label>{{ 'SECURITY.CHANGE_PASSWORD.CURRENT_LABEL' | translate }}</label>
              <p-password
                [(ngModel)]="currentPassword"
                name="currentPassword"
                [feedback]="false"
                [toggleMask]="true"
                required
                [placeholder]="'SECURITY.CHANGE_PASSWORD.CURRENT_PLACEHOLDER' | translate"
                styleClass="w-full">
              </p-password>
            </div>

            <div class="cp-field">
              <label>{{ 'SECURITY.CHANGE_PASSWORD.NEW_LABEL' | translate }}</label>
              <p-password
                [(ngModel)]="newPassword"
                name="newPassword"
                [toggleMask]="true"
                required
                [placeholder]="'SECURITY.CHANGE_PASSWORD.NEW_PLACEHOLDER' | translate"
                styleClass="w-full">
              </p-password>
            </div>

            <div class="cp-field">
              <label>{{ 'SECURITY.CHANGE_PASSWORD.CONFIRM_LABEL' | translate }}</label>
              <p-password
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                [feedback]="false"
                [toggleMask]="true"
                required
                [placeholder]="'SECURITY.CHANGE_PASSWORD.CONFIRM_PLACEHOLDER' | translate"
                styleClass="w-full">
              </p-password>
            </div>

            <p-button
              type="submit"
              [label]="'SECURITY.CHANGE_PASSWORD.SUBMIT' | translate"
              [loading]="loading()"
              [disabled]="loading() || !f.valid"
              styleClass="w-full"
            ></p-button>

            @if (!forced()) {
              <button type="button" class="cp-cancel" (click)="cancel()">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            }
          </form>
        }
      </section>
    </main>
  `,
  styles: [`
    .cp-shell {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 20px;
      background: radial-gradient(circle at 18% 18%, rgba(79,142,247,.18), transparent 32%),
                  linear-gradient(135deg, var(--s-bg), #090b10 62%, #111522);
    }
    .cp-card {
      width: min(100%, 420px);
      border: 1px solid var(--s-border);
      border-radius: 20px;
      background: rgba(19,22,30,.92);
      padding: clamp(24px, 5vw, 36px);
      box-shadow: 0 32px 90px rgba(0,0,0,.38);
    }
    .cp-header { text-align: center; margin-bottom: 28px; }
    .cp-icon { font-size: 32px; margin-bottom: 12px; }
    h1 { color: var(--s-text); font-size: 20px; letter-spacing: -.03em; margin: 0 0 8px; }
    .cp-subtitle { color: var(--s-text-2); font-size: 13px; margin: 0; line-height: 1.5; }
    .cp-form { display: flex; flex-direction: column; gap: 16px; }
    .cp-field { display: flex; flex-direction: column; gap: 6px; }
    .cp-field label { font-size: 12px; font-weight: 600; color: var(--s-text-2); }
    .cp-cancel {
      background: none; border: none; color: var(--s-text-3);
      font-size: 13px; cursor: pointer; text-align: center;
      padding: 4px; transition: color .15s;
    }
    .cp-cancel:hover { color: var(--s-text-2); }
    .cp-success { text-align: center; padding: 24px 0; }
    .cp-success-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(52,211,153,.15); color: #34d399;
      font-size: 22px; margin-bottom: 12px;
    }
    .cp-success p { color: var(--s-text); margin: 0 0 4px; }
  `]
})
export class ChangePasswordComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly forced = signal(false);

  ngOnInit(): void {
    // [SRB ] Detect forced change from JWT claim must_change_password / is_temp_password.
    const token = this.authStore.accessToken();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
          const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
          const isForced =
            payload['must_change_password'] === true ||
            payload['must_change_password'] === 'true' ||
            payload['is_temp_password'] === true ||
            payload['is_temp_password'] === 'true';
          this.forced.set(isForced);
        }
      } catch { /* ignore malformed JWT */ }
    }
  }

  async submit(): Promise<void> {
    this.error.set(null);

    if (!this.currentPassword) { this.error.set(this.t('SECURITY.CHANGE_PASSWORD.ERR_CURRENT_REQUIRED')); return; }
    if (this.newPassword.length < 8) { this.error.set(this.t('SECURITY.CHANGE_PASSWORD.ERR_NEW_MIN')); return; }
    if (this.newPassword !== this.confirmPassword) { this.error.set(this.t('SECURITY.CHANGE_PASSWORD.ERR_CONFIRM_MISMATCH')); return; }
    if (this.newPassword === this.currentPassword) { this.error.set(this.t('SECURITY.CHANGE_PASSWORD.ERR_SAME_PASSWORD')); return; }

    this.loading.set(true);
    try {
      const apiUrl = getAppConfig().securityUrl.replace(/\/$/, '');
      const token = this.authStore.accessToken();
      const res = await fetch(`${apiUrl}/api/secu/account/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
          confirmPassword: this.confirmPassword,
        }),
      });

      if (!res.ok) {
        let msg = this.t('SECURITY.CHANGE_PASSWORD.ERR_CHANGE_FAILED');
        try {
          const body = await res.json() as { message?: string; errors?: Record<string, string[]> };
          msg = body.message ?? Object.values(body.errors ?? {}).flat()[0] ?? msg;
        } catch { /* use default */ }
        this.error.set(msg);
        return;
      }

      this.success.set(true);
      setTimeout(() => void this.router.navigateByUrl(this.forced() ? '/admin' : '/admin'), 2000);
    } catch {
      this.error.set(this.t('SECURITY.CHANGE_PASSWORD.ERR_NETWORK'));
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/admin');
  }

  private t(key: string): string {
    const value = this.translate.instant(key);
    return typeof value === 'string' ? value : key;
  }
}

