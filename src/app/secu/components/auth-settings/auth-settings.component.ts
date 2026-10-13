import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { AuthSettingsDto, UpsertAuthSettingsRequest } from '../../models/secu.models';

const PAGE_CODE = 'SETTINGS';

@Component({
  selector: 'app-auth-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PermActionDirective],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">Auth Settings</h1>
        <p class="s-page-subtitle">Configure authentication policies and security rules</p>
      </div>
      <button
        class="s-btn s-btn-primary"
        [permAction]="permissionService.canUpdate(PAGE_CODE)"
        (click)="save()"
        [disabled]="saving() || loading()"
      >
        {{ saving() ? 'Saving�' : 'Save Changes' }}
      </button>
    </div>

    @if (loading()) {
      <div class="s-card"><div class="s-empty"><div class="s-empty-text">Loading�</div></div></div>
    } @else if (loadError()) {
      <div class="s-alert error" style="margin:16px;">�  {{ loadError() }}</div>
    } @else if (form) {

      @if (saveSuccess()) {
        <div class="s-alert success" style="margin-bottom:12px;">✓ Settings saved successfully.</div>
      }
      @if (saveError()) {
        <div class="s-alert error" style="margin-bottom:12px;">�  {{ saveError() }}</div>
      }

      <!-- General -->
      <div class="s-card" style="margin-bottom:16px;">
        <div class="s-card-header">General</div>
        <div class="s-card-body">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">Allow Password Login</label>
              <p class="s-field-hint">Allow users to log in with username + password.</p>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.allowPasswordLogin" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Require MFA</label>
              <p class="s-field-hint">Force all users to complete MFA on every login.</p>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.requireMfa" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- MFA Methods -->
      <div class="s-card" style="margin-bottom:16px;">
        <div class="s-card-header">MFA Methods</div>
        <div class="s-card-body">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">Enable TOTP (Authenticator App)</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.enableTotp" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Enable Email OTP</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.enableEmailOtp" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Enable Recovery Codes</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.enableRecoveryCodes" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
          </div>
          <div class="s-form-row" style="margin-top:12px;">
            <div class="s-field">
              <label class="s-label">Email OTP TTL (minutes)</label>
              <input class="s-input" type="number" min="1" max="60" [(ngModel)]="form.emailOtpTtlMinutes" />
            </div>
            <div class="s-field">
              <label class="s-label">Email OTP Max Attempts</label>
              <input class="s-input" type="number" min="1" max="10" [(ngModel)]="form.emailOtpMaxAttempts" />
            </div>
            <div class="s-field">
              <label class="s-label">Email OTP Max Per Hour</label>
              <input class="s-input" type="number" min="1" max="20" [(ngModel)]="form.emailOtpMaxPerHour" />
            </div>
          </div>
        </div>
      </div>

      <!-- Password Policy -->
      <div class="s-card" style="margin-bottom:16px;">
        <div class="s-card-header">Password Policy</div>
        <div class="s-card-body">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">Minimum Length</label>
              <input class="s-input" type="number" min="6" max="128" [(ngModel)]="form.passwordMinLength" />
            </div>
          </div>
          <div class="s-form-row" style="margin-top:12px;">
            <div class="s-field">
              <label class="s-label">Require Uppercase</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.passwordRequireUpper" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Require Lowercase</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.passwordRequireLower" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Require Digit</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.passwordRequireDigit" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Require Special Character</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.passwordRequireNonAlphanumeric" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Lockout -->
      <div class="s-card" style="margin-bottom:16px;">
        <div class="s-card-header">Account Lockout</div>
        <div class="s-card-body">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">Enable Lockout</label>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.lockoutEnabled" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Max Attempts</label>
              <input class="s-input" type="number" min="1" max="20" [(ngModel)]="form.lockoutMaxAttempts" />
            </div>
            <div class="s-field">
              <label class="s-label">Lockout Duration (minutes)</label>
              <input class="s-input" type="number" min="1" max="1440" [(ngModel)]="form.lockoutDurationMinutes" />
            </div>
          </div>
        </div>
      </div>

      <!-- Token TTLs -->
      <div class="s-card" style="margin-bottom:16px;">
        <div class="s-card-header">Token Lifetimes</div>
        <div class="s-card-body">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">Access Token TTL (minutes)</label>
              <input class="s-input" type="number" min="1" max="1440" [(ngModel)]="form.accessTokenTtlMinutes" />
            </div>
            <div class="s-field">
              <label class="s-label">Refresh Token TTL (days)</label>
              <input class="s-input" type="number" min="1" max="365" [(ngModel)]="form.refreshTokenTtlDays" />
            </div>
          </div>
        </div>
      </div>

      <!-- Password Reset -->
      <div class="s-card" style="margin-bottom:16px;">
        <div class="s-card-header">Password Reset</div>
        <div class="s-card-body">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">Token TTL (minutes)</label>
              <input class="s-input" type="number" min="1" max="60" [(ngModel)]="form.resetTokenTtlMinutes" />
            </div>
            <div class="s-field">
              <label class="s-label">Code TTL (minutes)</label>
              <input class="s-input" type="number" min="1" max="60" [(ngModel)]="form.resetCodeTtlMinutes" />
            </div>
            <div class="s-field">
              <label class="s-label">Max Requests Per Hour</label>
              <input class="s-input" type="number" min="1" max="20" [(ngModel)]="form.resetMaxRequestsPerHour" />
            </div>
          </div>
          <div class="s-form-row" style="margin-top:12px;">
            <div class="s-field">
              <label class="s-label">Bind Reset to IP Address</label>
              <p class="s-field-hint">Reset link only works from the same IP that requested it.</p>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.bindResetToIp" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
            <div class="s-field">
              <label class="s-label">Bind Reset to User-Agent</label>
              <p class="s-field-hint">Reset link only works from the same browser that requested it.</p>
              <label class="s-toggle">
                <input type="checkbox" [(ngModel)]="form.bindResetToUserAgent" />
                <div class="s-toggle-track"></div>
                <div class="s-toggle-thumb"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

    }
  `,
  styles: [`
    .s-card-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--s-text);
      padding: 14px 18px 0;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.7;
    }
    .s-card-body {
      padding: 14px 18px 18px;
    }
    .s-field-hint {
      font-size: 11px;
      color: var(--s-text-3);
      margin: 2px 0 6px;
    }
  `],
})
export class AuthSettingsComponent implements OnInit {
  private api = inject(SecuApiService);
  public permissionService = inject(PermissionService);

  readonly PAGE_CODE = PAGE_CODE;

  loading = signal(true);
  loadError = signal<string | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);
  saveSuccess = signal(false);

  form: UpsertAuthSettingsRequest & {
    allowPasswordLogin: boolean;
    requireMfa: boolean;
    enableTotp: boolean;
    enableEmailOtp: boolean;
    enableRecoveryCodes: boolean;
    emailOtpTtlMinutes: number;
    emailOtpMaxAttempts: number;
    emailOtpMaxPerHour: number;
    resetTokenTtlMinutes: number;
    resetCodeTtlMinutes: number;
    resetMaxRequestsPerHour: number;
    passwordMinLength: number;
    passwordRequireUpper: boolean;
    passwordRequireLower: boolean;
    passwordRequireDigit: boolean;
    passwordRequireNonAlphanumeric: boolean;
    lockoutEnabled: boolean;
    lockoutMaxAttempts: number;
    lockoutDurationMinutes: number;
    accessTokenTtlMinutes: number;
    refreshTokenTtlDays: number;
    bindResetToIp: boolean;
    bindResetToUserAgent: boolean;
  } = this.defaultForm();

  ngOnInit() {
    this.api.getAuthSettings().pipe(
      catchError((e) => {
        this.loadError.set(e?.error?.message ?? e?.message ?? 'Failed to load settings');
        this.loading.set(false);
        return of(null);
      }),
    ).subscribe((s) => {
      this.loading.set(false);
      if (s) this.applyDto(s);
    });
  }

  private applyDto(s: AuthSettingsDto) {
    this.form = {
      tenantId: s.tenantId,
      allowPasswordLogin: s.allowPasswordLogin,
      requireMfa: s.requireMfa,
      enableTotp: s.enableTotp,
      enableEmailOtp: s.enableEmailOtp,
      enableRecoveryCodes: s.enableRecoveryCodes,
      emailOtpTtlMinutes: s.emailOtpTtlMinutes,
      emailOtpMaxAttempts: s.emailOtpMaxAttempts,
      emailOtpMaxPerHour: s.emailOtpMaxPerHour,
      resetTokenTtlMinutes: s.resetTokenTtlMinutes,
      resetCodeTtlMinutes: s.resetCodeTtlMinutes,
      resetMaxRequestsPerHour: s.resetMaxRequestsPerHour,
      passwordMinLength: s.passwordMinLength,
      passwordRequireUpper: s.passwordRequireUpper,
      passwordRequireLower: s.passwordRequireLower,
      passwordRequireDigit: s.passwordRequireDigit,
      passwordRequireNonAlphanumeric: s.passwordRequireNonAlphanumeric,
      lockoutEnabled: s.lockoutEnabled,
      lockoutMaxAttempts: s.lockoutMaxAttempts,
      lockoutDurationMinutes: s.lockoutDurationMinutes,
      accessTokenTtlMinutes: s.accessTokenTtlMinutes,
      refreshTokenTtlDays: s.refreshTokenTtlDays,
      bindResetToIp: s.bindResetToIp,
      bindResetToUserAgent: s.bindResetToUserAgent,
    };
  }

  private defaultForm() {
    return {
      tenantId: null,
      allowPasswordLogin: true,
      requireMfa: false,
      enableTotp: true,
      enableEmailOtp: true,
      enableRecoveryCodes: true,
      emailOtpTtlMinutes: 10,
      emailOtpMaxAttempts: 3,
      emailOtpMaxPerHour: 5,
      resetTokenTtlMinutes: 15,
      resetCodeTtlMinutes: 10,
      resetMaxRequestsPerHour: 3,
      passwordMinLength: 10,
      passwordRequireUpper: true,
      passwordRequireLower: true,
      passwordRequireDigit: true,
      passwordRequireNonAlphanumeric: true,
      lockoutEnabled: true,
      lockoutMaxAttempts: 5,
      lockoutDurationMinutes: 15,
      accessTokenTtlMinutes: 15,
      refreshTokenTtlDays: 14,
      bindResetToIp: false,
      bindResetToUserAgent: false,
    };
  }

  save() {
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.api.upsertAuthSettings(this.form).pipe(
      catchError((e) => {
        this.saveError.set(e?.error?.message ?? e?.message ?? 'Failed to save settings');
        this.saving.set(false);
        return of(null);
      }),
    ).subscribe((s) => {
      this.saving.set(false);
      if (s) {
        this.applyDto(s);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      }
    });
  }
}

