import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { SecuApiService } from '../../services/secu-api.service';
import {
  SecuPolicyDto, SecuPolicyRuleDto, SecuPolicyDecisionDto,
  CreateSecuPolicyRequest, CreateSecuPolicyRuleRequest, EvaluateSecuPolicyRequest,
} from '../../models/secu.models';
import { TranslatePipe } from '@ngx-translate/core';

const EFFECTS   = ['Allow', 'Deny'];
const RULE_TYPES = ['Role', 'Claim', 'Tenant', 'IpRange', 'TimeRange', 'Custom'];
const OPERATORS  = ['Equals', 'NotEquals', 'Contains', 'StartsWith', 'Regex', 'In'];

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [`
    /* ── Policy detail panel ── */
    .policy-panel {
      display: grid;
      grid-template-columns: minmax(260px, 0.34fr) minmax(0, 1fr);
      gap: 0;
      min-height: 60vh;
      min-width: 0;
    }
    @media (max-width: 900px) { .policy-panel { grid-template-columns: 1fr; } }

    .policy-list-col {
      border-right: 1px solid var(--s-border);
      overflow-y: auto; max-height: 70vh;
    }
    .policy-list-col .s-toolbar { position: sticky; top: 0; z-index: 1; background: var(--s-bg-2); }

    .policy-item {
      padding: 12px 16px; border-bottom: 1px solid var(--s-border);
      cursor: pointer; transition: background .13s;
      display: flex; flex-direction: column; gap: 4px;
    }
    .policy-item:hover { background: var(--s-bg-3); }
    .policy-item.selected { background: var(--s-accent-glow); border-left: 3px solid var(--s-accent); }
    .policy-item:last-child { border-bottom: none; }

    .policy-code { font-family: var(--s-mono); font-size: 12px; color: var(--s-accent); font-weight: 500; }
    .policy-desc { font-size: 11px; color: var(--s-text-3); }
    .policy-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }

    /* ── Rule rows ── */
    .rule-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-bottom: 1px solid var(--s-border);
      font-size: 12px;
    }
    .rule-row:last-child { border-bottom: none; }
    .rule-type { font-family: var(--s-mono); font-size: 10px; padding: 2px 7px; border-radius: 4px; background: var(--s-bg-4); color: var(--s-text-2); }
    .rule-key { font-family: var(--s-mono); font-size: 11px; color: var(--s-purple); }
    .rule-op { font-size: 10px; color: var(--s-text-3); padding: 0 3px; }
    .rule-val { font-family: var(--s-mono); font-size: 11px; color: var(--s-text); background: var(--s-bg-3); padding: 1px 7px; border-radius: 4px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ── Evaluator ── */
    .eval-panel {
      border: 1px solid var(--s-border); border-radius: var(--s-radius-lg); overflow: hidden;
      background: var(--s-bg-2);
    }
    .eval-result {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px; border-top: 1px solid var(--s-border);
    }
    .eval-allowed {
      font-size: 20px; font-weight: 700;
      padding: 4px 16px; border-radius: var(--s-radius);
    }
    .eval-allowed.yes { background: var(--s-green-bg); color: var(--s-green); }
    .eval-allowed.no  { background: var(--s-red-bg);   color: var(--s-red);   }

    .claim-row { display: flex; gap: 6px; margin-bottom: 6px; }
    .effect-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-family: var(--s-mono); }
    .effect-Allow { background: var(--s-green-bg); color: var(--s-green); }
    .effect-Deny  { background: var(--s-red-bg);   color: var(--s-red);   }
  `],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_315' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'DOM_FALLBACK.TEXT_316' | translate }}</p>
      </div>
      <button class="s-btn s-btn-primary" (click)="openCreate()">{{ 'DOM_FALLBACK.TEXT_317' | translate }}</button>
    </div>

    <!-- Stats -->
    <div class="s-stats-grid" style="margin-bottom:20px;">
      <div class="s-stat-card">
        <div class="s-stat-icon blue">📜</div>
        <div><div class="s-stat-value">{{ policies().length }}</div><div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_315' | translate }}</div></div>
      </div>
      <div class="s-stat-card">
        <div class="s-stat-icon green">✓</div>
        <div><div class="s-stat-value">{{ allowCount() }}</div><div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_318' | translate }}</div></div>
      </div>
      <div class="s-stat-card">
        <div class="s-stat-icon red">✕</div>
        <div><div class="s-stat-value">{{ denyCount() }}</div><div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_319' | translate }}</div></div>
      </div>
    </div>

    <div class="s-card" style="padding:0;overflow:visible;">
      <div class="policy-panel">

        <!-- LEFT — policy list -->
        <div class="policy-list-col">
          <div class="s-toolbar" style="flex-wrap:wrap;gap:6px;">
            <div class="s-search" style="flex:1;min-width:140px;">
              <span class="s-search-icon">🔍</span>
              <input placeholder="{{ 'AUTO_INLINE_SECURITY_UI.SEARCH' | translate }}" [(ngModel)]="search" />
            </div>
            <select class="s-select" style="width:110px;" [(ngModel)]="filterEffect">
              <option value="">{{ 'DOM_FALLBACK.TEXT_320' | translate }}</option>
              <option value="Allow">{{ 'DOM_FALLBACK.TEXT_318' | translate }}</option>
              <option value="Deny">{{ 'DOM_FALLBACK.TEXT_319' | translate }}</option>
            </select>
            <label class="s-toggle">
              <input type="checkbox" [(ngModel)]="includeInactive" (change)="load()" />
              <div class="s-toggle-track"></div><div class="s-toggle-thumb"></div>
            </label>
          </div>

          @if (loading()) {
            <div class="s-empty"><div class="s-empty-text">{{ 'COMMON.LOADING' | translate }}</div></div>
          } @else {
            @for (p of filteredPolicies(); track p.idPolicy) {
              <div class="policy-item" [class.selected]="selectedPolicy()?.idPolicy === p.idPolicy"
                   (click)="selectPolicy(p)">
                <div style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                  <span class="policy-code">{{ p.policyCode }}</span>
                  <span class="effect-badge" [class]="'effect-badge effect-' + p.effect">{{ p.effect }}</span>
                </div>
                <div class="policy-tags">
                  <span style="font-size:10px;background:var(--s-bg-4);color:var(--s-text-2);padding:1px 6px;border-radius:4px;font-family:var(--s-mono)">{{ p.resource }}</span>
                  <span style="font-size:10px;color:var(--s-text-3)">→</span>
                  <span style="font-size:10px;background:var(--s-amber-bg);color:var(--s-amber);padding:1px 6px;border-radius:4px;font-family:var(--s-mono)">{{ p.action }}</span>
                </div>
                @if (p.description) { <div class="policy-desc">{{ p.description }}</div> }
                @if (!p.isActive) { <span class="s-badge inactive" style="width:fit-content;margin-top:2px;">{{ 'COMMON.INACTIVE' | translate }}</span> }
              </div>
            } @empty {
              <div class="s-empty" style="padding:40px 20px;">
                <div class="s-empty-icon">📜</div>
                <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_321' | translate }}</div>
              </div>
            }
          }
        </div>

        <!-- RIGHT — detail / rules -->
        <div style="display:flex;flex-direction:column;gap:0;overflow-y:auto;max-height:70vh;">
          @if (!selectedPolicy()) {
            <div class="s-empty" style="padding:80px 20px;">
              <div class="s-empty-icon">📜</div>
              <div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_322' | translate }}</div>
            </div>
          } @else {
            <!-- Policy header info -->
            <div style="padding:16px 20px;border-bottom:1px solid var(--s-border);background:var(--s-bg-3);">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                <div>
                  <div style="font-size:16px;font-weight:600;font-family:var(--s-mono);color:var(--s-accent);">{{ selectedPolicy()!.policyCode }}</div>
                  <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center;">
                    <span class="effect-badge" [class]="'effect-badge effect-' + selectedPolicy()!.effect">{{ selectedPolicy()!.effect }}</span>
                    <span style="font-size:11px;color:var(--s-text-3)">{{ 'DOM_FALLBACK.TEXT_323' | translate }}</span>
                    <span style="font-family:var(--s-mono);font-size:11px;color:var(--s-text-2)">{{ selectedPolicy()!.resource }}</span>
                    <span style="color:var(--s-border-2)">→</span>
                    <span style="font-family:var(--s-mono);font-size:11px;color:var(--s-amber)">{{ selectedPolicy()!.action }}</span>
                    @if (selectedPolicy()!.tenantId) {
                      <span style="font-size:10px;background:var(--s-purple-bg);color:var(--s-purple);padding:1px 6px;border-radius:4px;font-family:var(--s-mono)">{{ selectedPolicy()!.tenantId }}</span>
                    }
                  </div>
                  @if (selectedPolicy()!.description) {
                    <div style="font-size:12px;color:var(--s-text-2);margin-top:6px;">{{ selectedPolicy()!.description }}</div>
                  }
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                  <button class="s-btn s-btn-ghost s-btn-sm" (click)="openEdit(selectedPolicy()!)">{{ 'AUTO_INLINE_SECURITY_UI.EDIT' | translate }}</button>
                  <button class="s-btn-icon danger" (click)="askDelete(selectedPolicy()!)">🗑</button>
                </div>
              </div>
            </div>

            <!-- Rules section -->
            <div style="padding:12px 20px;border-bottom:1px solid var(--s-border);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:12px;font-weight:500;color:var(--s-text)">
                {{ 'DOM_FALLBACK.TEXT_325' | translate }} <span style="color:var(--s-text-3);font-weight:400">({{ selectedPolicy()!.rules.length }})</span>
              </span>
              <button class="s-btn s-btn-primary s-btn-sm" (click)="openAddRule()">{{ 'DOM_FALLBACK.TEXT_326' | translate }}</button>
            </div>

            @if (selectedPolicy()!.rules.length) {
              @for (rule of selectedPolicy()!.rules; track rule.idRule) {
                <div class="rule-row">
                  <span class="rule-type">{{ rule.ruleType }}</span>
                  @if (rule.ruleKey) { <span class="rule-key">{{ rule.ruleKey }}</span> }
                  <span class="rule-val">{{ rule.ruleValue }}</span>
                  <span class="s-badge" [class.active]="rule.isActive" [class.inactive]="!rule.isActive">{{ rule.isActive?'On':'Off' }}</span>
                  <button class="s-btn-icon danger" (click)="deleteRule(rule)">🗑</button>
                </div>
              }
            } @else {
              <div class="s-empty" style="padding:24px;">
                <div class="s-empty-text">{{ 'AUTO_INLINE_SECURITY_UI.NO_RULES_POLICY_APPLIES_TO_ALL_REQUESTS' | translate }}</div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- ── Policy Evaluator ────────────────────────────────────────────── -->
    <div style="margin-top:20px;">
      <div style="font-size:11px;font-weight:600;color:var(--s-text-3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">{{ 'AUTO_INLINE_SECURITY_UI.POLICY_EVALUATOR' | translate }}</div>
      <div class="eval-panel">
        <div style="padding:14px 20px;border-bottom:1px solid var(--s-border);background:var(--s-bg-3);">
          <div class="s-form-row">
            <div class="s-field">
              <label class="s-label">{{ 'DOM_FALLBACK.TEXT_329' | translate }}</label>
              <input class="s-input mono" [(ngModel)]="eval.resource" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.API_FLEET_VEHICLES' | translate }}" />
            </div>
            <div class="s-field">
              <label class="s-label">{{ 'DOM_FALLBACK.TEXT_278' | translate }}</label>
              <input class="s-input mono" [(ngModel)]="eval.action" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.READ' | translate }}" />
            </div>
            <div class="s-field">
              <label class="s-label">{{ 'DOM_FALLBACK.TEXT_078' | translate }}</label>
              <input class="s-input mono" [(ngModel)]="eval.tenantId" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.OPTIONAL' | translate }}" />
            </div>
          </div>

          <!-- Claims -->
          <div style="margin-top:10px;">
            <div style="font-size:11px;color:var(--s-text-3);margin-bottom:6px;">{{ 'DOM_FALLBACK.TEXT_330' | translate }}</div>
            @for (claim of evalClaims; track $index) {
              <div class="claim-row">
                <input class="s-input mono" style="flex:1;" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.KEY' | translate }}" [(ngModel)]="claim.key" />
                <span style="color:var(--s-text-3)">=</span>
                <input class="s-input mono" style="flex:1;" placeholder="{{ 'AUTO_SECURITY_UI.VALUE' | translate }}" [(ngModel)]="claim.value" />
                <button class="s-btn-icon danger" (click)="removeClaim($index)">✕</button>
              </div>
            }
            <button class="s-btn s-btn-ghost s-btn-sm" (click)="addClaim()">{{ 'DOM_FALLBACK.TEXT_331' | translate }}</button>
          </div>
        </div>

        <div style="padding:12px 20px;display:flex;gap:8px;align-items:center;border-bottom:1px solid var(--s-border);">
          <button class="s-btn s-btn-primary" (click)="runEval()" [disabled]="!eval.resource || !eval.action || evalLoading()">
            {{ evalLoading() ? 'Evaluating…' : '▶ Evaluate' }}
          </button>
          <button class="s-btn s-btn-ghost" (click)="evalResult.set(null)">{{ 'AUTO_SECURITY_UI.CLEAR' | translate }}</button>
        </div>

        @if (evalResult()) {
          <div class="eval-result">
            <div class="eval-allowed" [class.yes]="evalResult()!.allowed" [class.no]="!evalResult()!.allowed">
              {{ evalResult()!.allowed ? '✓ ALLOWED' : '✕ DENIED' }}
            </div>
            <div style="flex:1;">
              @if (evalResult()!.matchedAllowPolicies.length) {
                <div style="font-size:11px;color:var(--s-green);margin-bottom:3px;">
                  Allow: {{ evalResult()!.matchedAllowPolicies.join(', ') }}
                </div>
              }
              @if (evalResult()!.matchedDenyPolicies.length) {
                <div style="font-size:11px;color:var(--s-red);">
                  Deny: {{ evalResult()!.matchedDenyPolicies.join(', ') }}
                </div>
              }
              @if (!evalResult()!.matchedAllowPolicies.length && !evalResult()!.matchedDenyPolicies.length) {
                <div style="font-size:11px;color:var(--s-text-3);">{{ 'DOM_FALLBACK.TEXT_332' | translate }}</div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- ── Policy modal ────────────────────────────────────────────────── -->
    @if (policyModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ editingPolicy() ? 'Edit Policy' : 'New Policy' }}</span>
            <button class="s-btn-icon" (click)="policyModal.set(false)">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">⚠ {{ saveError() }}</div> }
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_333' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="pf.policyCode" placeholder="FLEET_READ_ALLOW" [disabled]="!!editingPolicy()" (blur)="pf.policyCode=pf.policyCode.toUpperCase()" />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_334' | translate }}</label>
                <select class="s-select" [(ngModel)]="pf.effect">
                  @for (e of EFFECTS; track e) { <option [value]="e">{{ e }}</option> }
                </select>
              </div>
            </div>
            <div style="font-size:12px;color:var(--s-text-3);line-height:1.5;margin-bottom:12px;">
              A policy is evaluated as: subject claims + tenant/company + requested resource/action. Use a clear code, choose Allow or Deny, then add optional rules such as Role, Tenant, or Claim.
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_329' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="pf.resource" list="policyResources" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.API_FLEET_VEHICLES' | translate }}" />
                <datalist id="policyResources">
                  @for (resource of RESOURCE_SUGGESTIONS; track resource) { <option [value]="resource"></option> }
                </datalist>
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_278' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="pf.action" list="policyActions" placeholder="READ" />
                <datalist id="policyActions">
                  @for (action of ACTION_SUGGESTIONS; track action) { <option [value]="action"></option> }
                </datalist>
              </div>
            </div>
            <div class="s-form-row">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_335' | translate }}</label>
                <input class="s-input" [(ngModel)]="pf.description" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.OPTIONAL_DESCRIPTION' | translate }}" />
              </div>
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_336' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="pf.tenantId" placeholder="{{ 'DOM_FALLBACK.TEXT_385' | translate }}" />
              </div>
            </div>
            @if (editingPolicy()) {
              <div class="s-form-row single">
                <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;padding-top:4px;">
                  <label class="s-toggle">
                    <input type="checkbox" [(ngModel)]="pf.isActive" />
                    <div class="s-toggle-track"></div><div class="s-toggle-thumb"></div>
                  </label>
                  <span style="font-size:13px;color:var(--s-text-2)">{{ 'DOM_FALLBACK.TEXT_092' | translate }}</span>
                </div>
              </div>
            }
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="policyModal.set(false)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="savePolicy()" [disabled]="saving()">{{ saving()?'Saving…':(editingPolicy()?'Update':'Create') }}</button>
          </div>
        </div>
      </div>
    }

    <!-- ── Rule modal ─────────────────────────────────────────────────── -->
    @if (ruleModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">Add Rule to {{ selectedPolicy()?.policyCode }}</span>
            <button class="s-btn-icon" (click)="ruleModal.set(false)">✕</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">⚠ {{ saveError() }}</div> }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_337' | translate }}</label>
                <select class="s-select" [(ngModel)]="rf.ruleType">
                  @for (t of RULE_TYPES; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_338' | translate }} <span style="color:var(--s-text-3);font-size:11px">{{ 'DOM_FALLBACK.TEXT_339' | translate }}</span></label>
                <input class="s-input mono" [(ngModel)]="rf.ruleKey" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.E_G_DEPARTMENT' | translate }}" />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_340' | translate }}</label>
                <input class="s-input mono" [(ngModel)]="rf.ruleValue" placeholder="{{ 'AUTO_INLINE_SECURITY_UI.E_G_FLEET_TEAM' | translate }}" />
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="ruleModal.set(false)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveRule()" [disabled]="saving()">{{ saving()?'Saving…':'Add Rule' }}</button>
          </div>
        </div>
      </div>
    }

    <!-- ── Delete confirm ─────────────────────────────────────────────── -->
    @if (deleteModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'AUTO_INLINE_SECURITY_UI.DELETE_POLICY' | translate }}</span>
            <button class="s-btn-icon" (click)="deleteModal.set(null)">✕</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2);">{{ 'AUTO_INLINE_SECURITY_UI.DELETE_POLICY_2' | translate }} <strong class="mono" style="color:var(--s-accent)">{{ deleteModal() }}</strong>?<br><br>
              <span style="font-size:12px;color:var(--s-amber)">{{ 'AUTO_INLINE_SECURITY_UI.ALL_ASSOCIATED_RULES_WILL_BE_REMOVED' | translate }}</span></p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteModal.set(null)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="doDelete()">{{ 'COMMON.DELETE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PoliciesComponent implements OnInit {
  private api = inject(SecuApiService);

  readonly EFFECTS    = EFFECTS;
  readonly RULE_TYPES = RULE_TYPES;
  readonly OPERATORS  = OPERATORS;
  readonly RESOURCE_SUGGESTIONS = ['admin:*', 'security:users', 'security:roles', 'security:policies', 'security:audit', 'api/fleet/vehicles'];
  readonly ACTION_SUGGESTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE_USERS', '*'];

  policies = signal<SecuPolicyDto[]>([]);
  selectedPolicy = signal<SecuPolicyDto | null>(null);
  loading = signal(true);
  search = ''; filterEffect = ''; includeInactive = false;

  policyModal = signal(false);
  ruleModal = signal(false);
  deleteModal = signal<string | null>(null);
  editingPolicy = signal<SecuPolicyDto | null>(null);
  saving = signal(false);
  saveError = signal<string | null>(null);

  pf: { policyCode: string; resource: string; action: string; effect: string; description: string; tenantId: string; isActive: boolean } =
    { policyCode: '', resource: '', action: '', effect: 'Allow', description: '', tenantId: '', isActive: true };

  rf: { ruleType: string; ruleKey: string; ruleValue: string } =
    { ruleType: 'Role', ruleKey: '', ruleValue: '' };

  // Evaluator
  eval: { resource: string; action: string; tenantId: string } = { resource: '', action: '', tenantId: '' };
  evalClaims: { key: string; value: string }[] = [];
  evalLoading = signal(false);
  evalResult = signal<SecuPolicyDecisionDto | null>(null);

  allowCount = computed(() => this.policies().filter(p => p.effect === 'Allow').length);
  denyCount  = computed(() => this.policies().filter(p => p.effect === 'Deny').length);

  filteredPolicies = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.policies().filter(p =>
      (!q || p.policyCode.toLowerCase().includes(q) || p.resource.toLowerCase().includes(q) || p.action.toLowerCase().includes(q)) &&
      (!this.filterEffect || p.effect === this.filterEffect)
    );
  });

  private deletePolicyId = 0;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getPolicies({ size: 500, includeInactive: this.includeInactive })
      .pipe(catchError(() => of(null)))
      .subscribe(r => { if (r) this.policies.set(r.data); this.loading.set(false); });
  }

  selectPolicy(p: SecuPolicyDto) { this.selectedPolicy.set(p); }

  openCreate() {
    this.editingPolicy.set(null);
    this.pf = { policyCode: '', resource: '', action: '', effect: 'Allow', description: '', tenantId: '', isActive: true };
    this.saveError.set(null); this.policyModal.set(true);
  }
  openEdit(p: SecuPolicyDto) {
    this.editingPolicy.set(p);
    this.pf = { policyCode: p.policyCode, resource: p.resource, action: p.action, effect: p.effect, description: p.description ?? '', tenantId: p.tenantId ?? '', isActive: p.isActive };
    this.saveError.set(null); this.policyModal.set(true);
  }
  savePolicy() {
    if (!this.pf.policyCode || !this.pf.resource || !this.pf.action) { this.saveError.set('Code, Resource, and Action are required.'); return; }
    this.saving.set(true);
    const body: CreateSecuPolicyRequest = { policyCode: this.pf.policyCode.toUpperCase(), resource: this.pf.resource, action: this.pf.action, effect: this.pf.effect, description: this.pf.description || null, tenantId: this.pf.tenantId || null, isActive: this.pf.isActive };
    const req = this.editingPolicy() ? this.api.updatePolicy(this.editingPolicy()!.idPolicy, body) : this.api.createPolicy(body);
    req.pipe(catchError(e => { this.saveError.set(e.error?.title ?? 'Error'); this.saving.set(false); return of(null); }))
      .subscribe(r => {
        this.saving.set(false);
        if (r) { this.policyModal.set(false); this.load(); if (this.selectedPolicy()?.idPolicy === r.idPolicy) this.selectedPolicy.set(r); }
      });
  }

  askDelete(p: SecuPolicyDto) { this.deletePolicyId = p.idPolicy; this.deleteModal.set(p.policyCode); }
  doDelete() {
    this.api.deletePolicy(this.deletePolicyId).pipe(catchError(() => of(null))).subscribe(() => {
      this.deleteModal.set(null);
      if (this.selectedPolicy()?.idPolicy === this.deletePolicyId) this.selectedPolicy.set(null);
      this.load();
    });
  }

  openAddRule() { this.rf = { ruleType: 'Role', ruleKey: '', ruleValue: '' }; this.saveError.set(null); this.ruleModal.set(true); }
  saveRule() {
    if (!this.rf.ruleValue.trim()) { this.saveError.set('Rule value is required.'); return; }
    this.saving.set(true);
    const body: CreateSecuPolicyRuleRequest = { ruleType: this.rf.ruleType, ruleKey: this.rf.ruleKey || null, ruleValue: this.rf.ruleValue };
    this.api.createPolicyRule(this.selectedPolicy()!.idPolicy, body)
      .pipe(catchError(e => { this.saveError.set(e.error?.title ?? 'Error'); this.saving.set(false); return of(null); }))
      .subscribe(rule => {
        this.saving.set(false);
        if (rule) {
          this.ruleModal.set(false);
          // Optimistic update
          const p = this.selectedPolicy()!;
          this.selectedPolicy.set({ ...p, rules: [...p.rules, rule] });
        }
      });
  }
  deleteRule(rule: SecuPolicyRuleDto) {
    this.api.deletePolicyRule(rule.idRule).pipe(catchError(() => of(null))).subscribe(() => {
      const p = this.selectedPolicy()!;
      this.selectedPolicy.set({ ...p, rules: p.rules.filter(r => r.idRule !== rule.idRule) });
    });
  }

  addClaim() { this.evalClaims.push({ key: '', value: '' }); }
  removeClaim(i: number) { this.evalClaims.splice(i, 1); }
  runEval() {
    this.evalLoading.set(true);
    const claims: Record<string, string> = {};
    this.evalClaims.filter(c => c.key.trim()).forEach(c => claims[c.key] = c.value);
    const body: EvaluateSecuPolicyRequest = { resource: this.eval.resource, action: this.eval.action, tenantId: this.eval.tenantId || null, claims };
    this.api.evaluatePolicy(body).pipe(catchError(() => of(null))).subscribe(r => { this.evalLoading.set(false); if (r) this.evalResult.set(r); });
  }

  onBd(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('s-modal-backdrop')) {
      this.policyModal.set(false); this.ruleModal.set(false); this.deleteModal.set(null);
    }
  }
}

