import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { AuthSettingsDto, TotpSetupDto } from '../../models/secu.models';

type TotpStep = 'idle' | 'setup' | 'verify' | 'active';

@Component({
  selector: 'app-my-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">My Security</h1>
        <p class="s-page-subtitle">Manage your two-factor authentication methods</p>
      </div>
    </div>

    @if (loadingSettings()) {
      <div class="s-card"><div class="s-empty"><div class="s-empty-text">Loading�</div></div></div>
    } @else if (settingsError()) {
      <div class="s-alert error" style="margin:16px;">�  {{ settingsError() }}</div>
    } @else {

      <!-- TOTP — shown only if admin enabled it in auth settings -->
      @if (settings()?.enableTotp) {
        <div class="s-card" style="margin-bottom:16px;">
          <div class="s-card-section-header">Authenticator App (TOTP)</div>
          <div class="s-card-body">

            @if (totpStep() === 'idle') {
              <p class="s-help-text">Use an app like Google Authenticator, Authy, or 1Password to generate time-based one-time codes. You will be asked for one at each login.</p>
              <button class="s-btn s-btn-primary" style="width:fit-content;" (click)="startTotpSetup()" [disabled]="totpLoading()">
                {{ totpLoading() ? 'Loading�' : 'Set Up Authenticator App' }}
              </button>
              @if (totpError()) { <div class="s-alert error mgt">�  {{ totpError() }}</div> }
            }

            @if (totpStep() === 'setup' || totpStep() === 'verify') {
              <div style="display:flex;flex-direction:column;gap:16px;max-width:520px;">
                <p class="s-help-text">Open your authenticator app and add a new account. Enter the secret manually or use the raw URI if your app supports import.</p>

                <div class="s-secret-box">
                  <div class="s-secret-row">
                    <div class="s-secret-label">Secret key (enter manually in app)</div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <code class="s-mono-block">{{ totpSetup()?.secret }}</code>
                      <button class="s-btn-icon" title="Copy" (click)="copySecret()">{{ secretCopied() ? '✓' : '📋' }}</button>
                    </div>
                  </div>
                  <div class="s-secret-row" style="margin-top:10px;">
                    <div class="s-secret-label">OTP Auth URI</div>
                    <code class="s-mono-block s-small">{{ totpSetup()?.otpauthUri }}</code>
                  </div>
                </div>

                <div class="s-field" style="max-width:200px;">
                  <label class="s-label">Enter the 6-digit code from your app *</label>
                  <input
                    class="s-input mono"
                    placeholder="000000"
                    maxlength="6"
                    inputmode="numeric"
                    [(ngModel)]="totpCode"
                    style="letter-spacing:.18em;font-size:18px;"
                    (keydown.enter)="verifyTotp()"
                  />
                </div>

                @if (totpError()) { <div class="s-alert error">�  {{ totpError() }}</div> }

                <div style="display:flex;gap:8px;">
                  <button class="s-btn s-btn-primary" (click)="verifyTotp()" [disabled]="totpLoading() || totpCode.length < 6">
                    {{ totpLoading() ? 'Verifying�' : 'Verify & Activate' }}
                  </button>
                  <button class="s-btn s-btn-ghost" (click)="cancelTotpSetup()">Cancel</button>
                </div>
              </div>
            }

            @if (totpStep() === 'active') {
              <div style="display:flex;flex-direction:column;gap:12px;max-width:480px;">
                <div class="s-alert success">✓ Authenticator app is active on your account.✓ </div>
                <p class="s-help-text">You will be asked for a TOTP code at each login.</p>
                @if (totpError()) { <div class="s-alert error">�  {{ totpError() }}</div> }
                <button class="s-btn s-btn-danger" style="width:fit-content;" (click)="disableTotp()" [disabled]="totpLoading()">
                  {{ totpLoading() ? 'Disabling�' : 'Disable Authenticator App' }}
                </button>
              </div>
            }

          </div>
        </div>
      }

      <!-- Email OTP — shown only if admin enabled it -->
      @if (settings()?.enableEmailOtp) {
        <div class="s-card" style="margin-bottom:16px;">
          <div class="s-card-section-header">Email One-Time Code</div>
          <div class="s-card-body">
            <p class="s-help-text">{{ 'When enabled, a one-time code will be emailed to you at each login. Codes expire after {{ttl}} minutes.': { ttl: settings()?.emailOtpTtlMinutes } }}</p>
            <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
              <label class="s-toggle">
                <input type="checkbox" [checked]="emailOtpEnabled()" (change)="toggleEmailOtp($event)" [disabled]="emailOtpLoading()" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
              <span style="font-size:13px;color:var(--s-text);">
                {{ emailOtpEnabled() ? 'Email OTP is enabled' : 'Email OTP is disabled' }}
              </span>
              @if (emailOtpLoading()) { <span style="font-size:12px;color:var(--s-text-3);">Saving�</span> }
            </div>
            @if (emailOtpMessage()) { <div class="s-alert success mgt">✓ {{ emailOtpMessage() }}</div> }
            @if (emailOtpError()) { <div class="s-alert error mgt">�  {{ emailOtpError() }}</div> }
          </div>
        </div>
      }

      <!-- Recovery Codes — shown only if admin enabled it -->
      @if (settings()?.enableRecoveryCodes) {
        <div class="s-card" style="margin-bottom:16px;">
          <div class="s-card-section-header">Recovery Codes</div>
          <div class="s-card-body">
            <p class="s-help-text">
              One-time-use backup codes you can use if you lose access to your authenticator or email. Store them somewhere safe — they are shown only once.
            </p>

            @if (!recoveryCodes()) {
              <button class="s-btn s-btn-primary" style="width:fit-content;margin-top:8px;" (click)="generateRecoveryCodes()" [disabled]="recoveryLoading()">
                {{ recoveryLoading() ? 'Generating�' : 'Generate Recovery Codes' }}
              </button>
            }

            @if (recoveryError()) { <div class="s-alert error mgt">�  {{ recoveryError() }}</div> }

            @if (recoveryCodes()) {
              <div class="s-alert warning mgt">⚠ Save these codes now — they will not be shown again.</div>
              <div class="s-codes-grid">
                @for (code of recoveryCodes()!; track code) {
                  <code class="s-mono-block">{{ code }}</code>
                }
              </div>
              <div style="display:flex;gap:8px;margin-top:12px;">
                <button class="s-btn s-btn-ghost" (click)="copyRecoveryCodes()">{{ codescopied() ? '✓ Copied' : 'Copy All' }}</button>
                <button class="s-btn s-btn-ghost" (click)="generateRecoveryCodes()" [disabled]="recoveryLoading()">
                  Regenerate (invalidates old codes)
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- No methods enabled at all -->
      @if (!settings()?.enableTotp && !settings()?.enableEmailOtp && !settings()?.enableRecoveryCodes) {
        <div class="s-card">
          <div class="s-card-body" style="padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:12px;">🔒</div>
            <p style="color:var(--s-text-2);font-size:13px;">
              No MFA methods are currently enabled by your administrator.
            </p>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .s-card-section-header {
      font-size: 12px; font-weight: 700; color: var(--s-text-3);
      text-transform: uppercase; letter-spacing: .06em;
      padding: 14px 18px 0;
    }
    .s-card-body { padding: 14px 18px 20px; }
    .s-help-text { font-size: 13px; color: var(--s-text-2); margin: 0 0 4px; line-height: 1.65; }
    .s-alert { padding: 10px 14px; border-radius: 6px; font-size: 13px; }
    .s-alert.error { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25); color: #f87171; }
    .s-alert.success { background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.25); color: #34d399; }
    .s-alert.warning { background: rgba(251,191,36,.1); border: 1px solid rgba(251,191,36,.25); color: #fbbf24; }
    .mgt { margin-top: 12px; }
    .s-secret-box { background: var(--s-bg-2); border: 1px solid var(--s-border); border-radius: 8px; padding: 14px; }
    .s-secret-label { font-size: 11px; color: var(--s-text-3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
    .s-mono-block { font-family: var(--s-mono); font-size: 13px; background: var(--s-bg-3); padding: 6px 10px; border-radius: 4px; display: block; word-break: break-all; user-select: all; }
    .s-small { font-size: 11px; }
    .s-codes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
  `],
})
export class MySecurityComponent implements OnInit {
  private api = inject(SecuApiService);

  loadingSettings = signal(true);
  settingsError = signal<string | null>(null);
  settings = signal<AuthSettingsDto | null>(null);

  // TOTP
  totpStep = signal<TotpStep>('idle');
  totpSetup = signal<TotpSetupDto | null>(null);
  totpLoading = signal(false);
  totpError = signal<string | null>(null);
  totpCode = '';
  secretCopied = signal(false);

  // Email OTP
  emailOtpEnabled = signal(false);
  emailOtpLoading = signal(false);
  emailOtpError = signal<string | null>(null);
  emailOtpMessage = signal<string | null>(null);

  // Recovery codes
  recoveryCodes = signal<string[] | null>(null);
  recoveryLoading = signal(false);
  recoveryError = signal<string | null>(null);
  codescopied = signal(false);

  ngOnInit() {
    this.api.getAuthSettings().pipe(
      catchError((e) => {
        this.settingsError.set(e?.error?.message ?? e?.message ?? 'Failed to load settings');
        this.loadingSettings.set(false);
        return of(null);
      }),
    ).subscribe((s) => {
      this.loadingSettings.set(false);
      if (s) this.settings.set(s);
    });
  }

  // ── TOTP ──────────────────────────────────────────────────────────────────

  startTotpSetup() {
    this.totpLoading.set(true);
    this.totpError.set(null);
    this.api.setupTotp().pipe(
      catchError((e) => {
        this.totpError.set(e?.error?.message ?? e?.message ?? 'Failed to start setup');
        this.totpLoading.set(false);
        return of(null);
      }),
    ).subscribe((r) => {
      this.totpLoading.set(false);
      if (r) { this.totpSetup.set(r); this.totpStep.set('setup'); this.totpCode = ''; }
    });
  }

  verifyTotp() {
    if (this.totpCode.length < 6) return;
    this.totpLoading.set(true);
    this.totpError.set(null);
    this.api.verifyTotpSetup({ code: this.totpCode }).pipe(
      catchError((e) => {
        this.totpError.set(e?.error?.message ?? e?.message ?? 'Invalid code. Try again.');
        this.totpLoading.set(false);
        return of(null);
      }),
    ).subscribe((r) => {
      this.totpLoading.set(false);
      if (r) { this.totpStep.set('active'); this.totpSetup.set(null); this.totpCode = ''; }
    });
  }

  cancelTotpSetup() {
    this.totpStep.set('idle'); this.totpSetup.set(null);
    this.totpCode = ''; this.totpError.set(null);
  }

  disableTotp() {
    this.totpLoading.set(true);
    this.totpError.set(null);
    this.api.disableTotp().pipe(
      catchError((e) => {
        this.totpError.set(e?.error?.message ?? e?.message ?? 'Failed to disable');
        this.totpLoading.set(false);
        return of(null);
      }),
    ).subscribe((r) => {
      this.totpLoading.set(false);
      if (r) this.totpStep.set('idle');
    });
  }

  copySecret() {
    const s = this.totpSetup()?.secret;
    if (!s) return;
    navigator.clipboard.writeText(s).then(() => {
      this.secretCopied.set(true);
      setTimeout(() => this.secretCopied.set(false), 2000);
    });
  }

  // ── Email OTP ─────────────────────────────────────────────────────────────

  toggleEmailOtp(event: Event) {
    const enabled = (event.target as HTMLInputElement).checked;
    this.emailOtpLoading.set(true);
    this.emailOtpError.set(null);
    this.emailOtpMessage.set(null);
    this.api.setEmailOtp({ enabled }).pipe(
      catchError((e) => {
        this.emailOtpError.set(e?.error?.message ?? e?.message ?? 'Failed to update');
        this.emailOtpLoading.set(false);
        return of(null);
      }),
    ).subscribe((r) => {
      this.emailOtpLoading.set(false);
      if (r) {
        this.emailOtpEnabled.set(enabled);
        this.emailOtpMessage.set(enabled ? 'Email OTP enabled.' : 'Email OTP disabled.');
        setTimeout(() => this.emailOtpMessage.set(null), 3000);
      }
    });
  }

  // ── Recovery Codes ────────────────────────────────────────────────────────

  generateRecoveryCodes() {
    this.recoveryLoading.set(true);
    this.recoveryError.set(null);
    this.api.generateRecoveryCodes().pipe(
      catchError((e) => {
        this.recoveryError.set(e?.error?.message ?? e?.message ?? 'Failed to generate');
        this.recoveryLoading.set(false);
        return of(null);
      }),
    ).subscribe((r) => {
      this.recoveryLoading.set(false);
      if (r) this.recoveryCodes.set(r.codes);
    });
  }

  copyRecoveryCodes() {
    const codes = this.recoveryCodes();
    if (!codes) return;
    navigator.clipboard.writeText(codes.join('\n')).then(() => {
      this.codescopied.set(true);
      setTimeout(() => this.codescopied.set(false), 2000);
    });
  }
}

