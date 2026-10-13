import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import {
  RefCompanyDto,
  RevokeSecuTokenRequest,
  SecuTokenRevocationDto,
  SecuTokenSessionDto,
} from '../../models/secu.models';
import { SecuApiService } from '../../services/secu-api.service';
import { PermissionService } from '../../services/permission.service';
import { PermActionDirective } from '../../directives/perm-action.directive';
import { SecuPaginationComponent } from '../shared/secu-pagination.component';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'TOKEN_REVOCATIONS';

type TokenTab = 'sessions' | 'revocations' | 'manual';

@Component({
  selector: 'app-token-revocations',
  standalone: true,
  imports: [CommonModule, FormsModule, SecuPaginationComponent, PermActionDirective, TranslatePipe],
  styles: [`
    .token-panel { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .token-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .chip { font-family: var(--s-mono); font-size: 10px; padding: 2px 7px; border-radius: 5px; background: var(--s-bg-4); color: var(--s-text-2); }
    .agent-cell { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--s-text-3); font-size: 11px; }
  `],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'SECU.TOKENS.TITLE' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'SECU.TOKENS.SUBTITLE' | translate }}</p>
      </div>
      <button class="s-btn s-btn-ghost" (click)="refresh()">{{ 'COMMON.REFRESH' | translate }}</button>
    </div>

    <div class="s-card" style="padding:0;overflow:visible;">
      <div class="s-tabs">
        <div class="s-tab" [class.active]="tab() === 'sessions'" (click)="selectTab('sessions')">
          {{ 'SECU.TOKENS.TABS.SESSIONS' | translate }}
          <span class="s-tab-count">{{ sessionTotalRecords() }}</span>
        </div>
        <div class="s-tab" [class.active]="tab() === 'revocations'" (click)="selectTab('revocations')">
          {{ 'SECU.TOKENS.TABS.REVOCATIONS' | translate }}
          <span class="s-tab-count">{{ revocationTotalRecords() }}</span>
        </div>
        @if (permissionService.canDelete(PAGE_CODE)) {
          <div class="s-tab" [class.active]="tab() === 'manual'" (click)="selectTab('manual')">
            {{ 'SECU.TOKENS.TABS.MANUAL' | translate }}
          </div>
        }
      </div>

      @if (tab() === 'sessions') {
        <div class="token-panel">
          <div class="token-toolbar">
            <div class="s-search" style="max-width:320px;">
              <span class="s-search-icon">🔍</span>
              <input
                [(ngModel)]="sessionSearch"
                (keyup.enter)="searchSessions()"
                placeholder="{{ 'AUTO_INLINE_SECURITY_UI.USER_IP_BROWSER' | translate }}"
              />
            </div>
            <button class="s-btn s-btn-ghost s-btn-sm" (click)="searchSessions()">{{ 'AUTO_SECURITY_UI.SEARCH' | translate }}</button>
          </div>

          @if (sessionsLoading()) {
            <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
          } @else {
            <div class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th>{{ 'SECU.TOKENS.COLUMNS.USER' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.AUTH' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.COMPANY' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.IP' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.EXPIRES' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.BROWSER' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (session of sessions(); track session.idSession) {
                    <tr>
                      <td>
                        <div class="mono" style="font-size:12px;color:var(--s-accent);font-weight:700;">{{ session.username }}</div>
                        <div style="font-size:11px;color:var(--s-text-2);">{{ session.fullName }}</div>
                      </td>
                      <td>
                        <span class="s-badge" [class.active]="session.source === 'oidc'" [class.inactive]="session.source !== 'oidc'" style="font-size:10px;text-transform:uppercase;">
                          {{ session.source || 'jwt' }}
                        </span>
                      </td>
                      <td><span class="chip">{{ companyLabel(session.tenantId) }}</span></td>
                      <td class="mono" style="font-size:11px;color:var(--s-text-2);">{{ session.ipAddress || '-' }}</td>
                      <td style="font-size:11px;color:var(--s-text-2);white-space:nowrap;">{{ session.expiresAt | date:'dd/MM/yy HH:mm' }}</td>
                      <td><div class="agent-cell" [title]="session.userAgent || ''">{{ session.userAgent || '-' }}</div></td>
                      <td>
                        <button
                          class="s-btn s-btn-danger s-btn-sm"
                          [permAction]="permissionService.canDelete(PAGE_CODE)"
                          (click)="revokeSessionUser(session)"
                          [disabled]="revokingUserId() === session.userId"
                        >
                          {{ revokingUserId() === session.userId ? ('SECU.TOKENS.REVOKING' | translate) : ('SECU.TOKENS.REVOKE' | translate) }}
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7">
                        <div class="s-empty" style="padding:40px;"><div class="s-empty-text">{{ 'SECU.TOKENS.EMPTY_SESSIONS' | translate }}</div></div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <secu-pagination
              [page]="sessionPage"
              [size]="sessionPageSize"
              [totalRecords]="sessionTotalRecords()"
              [totalPages]="sessionTotalPages()"
              (pageChange)="onSessionPageChange($event)"
            />
          }
        </div>
      }

      @if (tab() === 'revocations') {
        <div class="token-panel">
          <div class="token-toolbar">
            <div class="s-search" style="max-width:260px;">
              <span class="s-search-icon">{{ 'AUTO_SECURITY_UI.SEARCH' | translate }}</span>
              <input
                [(ngModel)]="revocationSearch"
                (keyup.enter)="searchRevocations()"
                placeholder="{{ 'AUTO_INLINE_SECURITY_UI.JTI_SUBJECT_REASON' | translate }}"
              />
            </div>
            <input class="s-input mono" style="width:180px;" [(ngModel)]="filterJti" (keyup.enter)="searchRevocations()" placeholder="JTI" />
            <input class="s-input mono" style="width:180px;" [(ngModel)]="filterSubject" (keyup.enter)="searchRevocations()" placeholder="{{ 'DOM_FALLBACK.TEXT_096' | translate }}" />
            <button class="s-btn s-btn-ghost s-btn-sm" (click)="searchRevocations()">{{ 'AUTO_SECURITY_UI.SEARCH' | translate }}</button>
          </div>

          @if (loading()) {
            <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
          } @else {
            <div class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th>JTI</th>
                    <th>{{ 'COMMON.STATUS' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.SUBJECT' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.COMPANY' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.REVOKED' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.EXPIRES' | translate }}</th>
                    <th>{{ 'SECU.TOKENS.COLUMNS.REASON' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (revocation of revocations(); track revocation.idRevocation) {
                    <tr>
                      <td class="mono" style="font-size:10px;color:var(--s-accent);">{{ revocation.jti | slice:0:18 }}...</td>
                      <td><span class="chip">{{ revocation.tokenType }}</span></td>
                      <td class="mono" style="font-size:11px;color:var(--s-text-2);">{{ revocation.subject || '-' }}</td>
                      <td class="mono" style="font-size:11px;color:var(--s-purple);">{{ companyLabel(revocation.tenantId) }}</td>
                      <td style="font-size:11px;color:var(--s-text-2);white-space:nowrap;">{{ revocation.revokedAt | date:'dd/MM/yy HH:mm' }}</td>
                      <td style="font-size:11px;color:var(--s-text-2);white-space:nowrap;">{{ revocation.expiresAt ? (revocation.expiresAt | date:'dd/MM/yy HH:mm') : '-' }}</td>
                      <td style="font-size:11px;color:var(--s-text-3);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" [title]="revocation.reason || ''">{{ revocation.reason || '-' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7">
                        <div class="s-empty" style="padding:40px;"><div class="s-empty-text">{{ 'SECU.TOKENS.EMPTY_REVOCATIONS' | translate }}</div></div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <secu-pagination
              [page]="revocationPage"
              [size]="revocationPageSize"
              [totalRecords]="revocationTotalRecords()"
              [totalPages]="revocationTotalPages()"
              (pageChange)="onRevocationPageChange($event)"
            />
          }
        </div>
      }

      @if (tab() === 'manual') {
        <div class="token-panel" style="max-width:720px;">
          @if (revokeSuccess()) {
            <div class="s-alert success">{{ 'SECU.TOKENS.REVOKED_SUCCESS' | translate }}</div>
          }
          @if (revokeError()) {
            <div class="s-alert error">{{ revokeError() }}</div>
          }

          <textarea class="s-input mono" style="height:96px;resize:vertical;font-size:11px;" [(ngModel)]="form.token" placeholder="{{ 'DOM_FALLBACK.TEXT_392' | translate }}"></textarea>
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">JTI</label>
              <input class="s-input mono" [(ngModel)]="form.jti" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.OR_JTI' | translate }}" />
            </div>
            <div class="s-field">
              <label class="s-label">{{ 'SECU.TOKENS.FORM.SUBJECT' | translate }}</label>
              <input class="s-input mono" [(ngModel)]="form.subject" placeholder="{{ 'DOM_FALLBACK.TEXT_393' | translate }}" />
            </div>
          </div>
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">{{ 'SECU.TOKENS.FORM.COMPANY' | translate }}</label>
              <input class="s-input mono" [(ngModel)]="form.tenantId" list="tokenCompanies" placeholder="{{ 'DOM_FALLBACK.TEXT_394' | translate }}" />
            </div>
            <div class="s-field">
              <label class="s-label">{{ 'SECU.TOKENS.FORM.EXPIRES_AT' | translate }}</label>
              <input class="s-input" type="datetime-local" [(ngModel)]="form.expiresAt" />
            </div>
          </div>
          <div class="s-form-row single">
            <div class="s-field">
              <label class="s-label">{{ 'SECU.TOKENS.FORM.REASON' | translate }}</label>
              <input class="s-input" [(ngModel)]="form.reason" placeholder="{{ 'DOM_FALLBACK.TEXT_395' | translate }}" />
            </div>
          </div>
          <button class="s-btn s-btn-primary" [permAction]="permissionService.canDelete(PAGE_CODE)" (click)="revoke()" [disabled]="revoking() || (!form.token && !form.jti)">
            {{ revoking() ? ('SECU.TOKENS.REVOKING' | translate) : ('SECU.TOKENS.REVOKE_BTN' | translate) }}
          </button>
        </div>
      }
    </div>

    <datalist id="tokenCompanies">
      @for (company of companies(); track company.companyCode) {
        <option [value]="company.companyCode">{{ company.companyName }}</option>
      }
    </datalist>
  `,
})
export class TokenRevocationsComponent implements OnInit {
  private readonly api = inject(SecuApiService);
  readonly permissionService = inject(PermissionService);
  readonly PAGE_CODE = PAGE_CODE;

  tab = signal<TokenTab>('sessions');
  revocations = signal<SecuTokenRevocationDto[]>([]);
  sessions = signal<SecuTokenSessionDto[]>([]);
  companies = signal<RefCompanyDto[]>([]);
  loading = signal(true);
  sessionsLoading = signal(true);
  revoking = signal(false);
  revokingUserId = signal<string | null>(null);
  revokeSuccess = signal(false);
  revokeError = signal<string | null>(null);
  sessionTotalRecords = signal(0);
  sessionTotalPages = signal(1);
  revocationTotalRecords = signal(0);
  revocationTotalPages = signal(1);

  sessionSearch = '';
  revocationSearch = '';
  filterJti = '';
  filterSubject = '';
  sessionPage = 1;
  sessionPageSize = 20;
  revocationPage = 1;
  revocationPageSize = 25;

  form = { token: '', jti: '', subject: '', tenantId: '', expiresAt: '', reason: '', tokenType: 'Access' };

  ngOnInit() {
    this.loadCompanies();
    this.loadSessions();
    this.loadRevocations();
  }

  selectTab(tab: TokenTab) {
    this.tab.set(tab);
    if (tab === 'sessions') {
      this.loadSessions();
    }
    if (tab === 'revocations') {
      this.loadRevocations();
    }
  }

  refresh() {
    this.loadCompanies();
    if (this.tab() === 'sessions') {
      this.loadSessions();
      return;
    }
    this.loadRevocations();
  }

  searchSessions() {
    this.sessionPage = 1;
    this.loadSessions();
  }

  onSessionPageChange(page: number) {
    this.sessionPage = page;
    this.loadSessions();
  }

  loadSessions() {
    this.sessionsLoading.set(true);
    this.api
      .getTokenSessions({
        search: this.sessionSearch || undefined,
        page: this.sessionPage,
        size: this.sessionPageSize,
      })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result) {
          this.sessions.set(result.data);
          this.sessionPage = result.page;
          this.sessionTotalRecords.set(result.totalRecords);
          this.sessionTotalPages.set(result.totalPages || 1);
        }
        this.sessionsLoading.set(false);
      });
  }

  searchRevocations() {
    this.revocationPage = 1;
    this.loadRevocations();
  }

  onRevocationPageChange(page: number) {
    this.revocationPage = page;
    this.loadRevocations();
  }

  loadRevocations() {
    this.loading.set(true);
    this.api
      .getTokenRevocations({
        search: this.revocationSearch || undefined,
        jti: this.filterJti || undefined,
        subject: this.filterSubject || undefined,
        page: this.revocationPage,
        size: this.revocationPageSize,
      })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result) {
          this.revocations.set(result.data);
          this.revocationPage = result.page;
          this.revocationTotalRecords.set(result.totalRecords);
          this.revocationTotalPages.set(result.totalPages || 1);
        }
        this.loading.set(false);
      });
  }

  revokeSessionUser(session: SecuTokenSessionDto) {
    this.revokingUserId.set(session.userId);
    this.revokeError.set(null);
    this.api
      .revokeUserSessions(session.userId, { reason: 'ADMIN_REVOKE' })
      .pipe(catchError((error) => {
        this.revokeError.set(error.error?.title ?? 'Could not revoke user sessions.');
        this.revokingUserId.set(null);
        return of(null);
      }))
      .subscribe(() => {
        this.revokingUserId.set(null);
        this.loadSessions();
        this.loadRevocations();
      });
  }

  revoke() {
    if (!this.form.token && !this.form.jti) return;
    this.revoking.set(true);
    this.revokeSuccess.set(false);
    this.revokeError.set(null);
    const body: RevokeSecuTokenRequest = {
      token: this.form.token || null,
      jti: this.form.jti || null,
      subject: this.form.subject || null,
      tenantId: this.form.tenantId || null,
      expiresAt: this.form.expiresAt || null,
      reason: this.form.reason || null,
      tokenType: this.form.tokenType,
    };

    this.api
      .revokeToken(body)
      .pipe(catchError((error) => {
        this.revokeError.set(error.error?.title ?? 'Revocation failed.');
        this.revoking.set(false);
        return of(null);
      }))
      .subscribe((result) => {
        this.revoking.set(false);
        if (result === null) return;
        this.revokeSuccess.set(true);
        this.form = { token: '', jti: '', subject: '', tenantId: '', expiresAt: '', reason: '', tokenType: 'Access' };
        this.loadRevocations();
        setTimeout(() => this.revokeSuccess.set(false), 3500);
      });
  }

  companyLabel(companyCode: string | null) {
    if (!companyCode) return 'Global';
    const company = this.companies().find((item) => item.companyCode === companyCode);
    return company ? `${company.companyCode} - ${company.companyName}` : companyCode;
  }

  private loadCompanies() {
    this.api
      .getCompanies({ size: 200, includeInactive: true })
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result) this.companies.set(result.data);
      });
  }
}

