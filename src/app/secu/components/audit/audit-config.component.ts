import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { SecuAuditEntityDto, SecuAuditFieldDto, SecuEntityDto, SecuFieldDto } from '../../models/secu.models';
import { SecuApiService } from '../../services/secu-api.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-audit-config',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [`
    .ac-grid { display:grid; grid-template-columns:minmax(260px,.34fr) minmax(0,1fr); min-height:60vh; }
    @media (max-width: 900px) { .ac-grid { grid-template-columns:1fr; } }
    .ac-list { border-right:1px solid var(--s-border); max-height:70vh; overflow:auto; }
    .ac-item { padding:12px 16px; border-bottom:1px solid var(--s-border); cursor:pointer; display:flex; gap:10px; align-items:center; }
    .ac-item:hover { background:var(--s-bg-3); }
    .ac-item.active { background:var(--s-accent-glow); border-left:3px solid var(--s-accent); }
    .ac-detail { max-height:70vh; overflow:auto; }
    .ac-header { padding:15px 20px; border-bottom:1px solid var(--s-border); background:var(--s-bg-3); display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
    .field-manager { display:grid; grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr); gap:12px; min-height:420px; }
    @media (max-width: 760px) { .field-manager { grid-template-columns:1fr; } }
    .field-list { border:1px solid var(--s-border); border-radius:var(--s-radius-lg); overflow:hidden; background:var(--s-bg-2); min-height:360px; }
    .field-list-head { padding:10px 12px; background:var(--s-bg-3); border-bottom:1px solid var(--s-border); font-size:12px; font-weight:700; color:var(--s-text); display:flex; justify-content:space-between; gap:8px; }
    .field-row { padding:9px 12px; border-bottom:1px solid var(--s-border); cursor:pointer; display:flex; justify-content:space-between; gap:8px; }
    .field-row:hover { background:var(--s-bg-3); }
    .field-row.selected { background:var(--s-accent-glow); color:var(--s-accent); }
    .move-buttons { display:flex; flex-direction:column; justify-content:center; gap:8px; }
    @media (max-width: 760px) { .move-buttons { flex-direction:row; } }
  `],
  template: `
    <div class="s-page-header">
      <div>
        <h1 class="s-page-title">{{ 'DOM_FALLBACK.TEXT_175' | translate }}</h1>
        <p class="s-page-subtitle">{{ 'DOM_FALLBACK.TEXT_176' | translate }}</p>
      </div>
      <button class="s-btn s-btn-primary" (click)="openCreate()">{{ 'DOM_FALLBACK.TEXT_177' | translate }}</button>
    </div>

    <div class="s-stats-grid" style="margin-bottom:20px;">
      <div class="s-stat-card"><div class="s-stat-icon blue">E</div><div><div class="s-stat-value">{{ auditEntities().length }}</div><div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_178' | translate }}</div></div></div>
      <div class="s-stat-card"><div class="s-stat-icon amber">F</div><div><div class="s-stat-value">{{ totalFields() }}</div><div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_179' | translate }}</div></div></div>
      <div class="s-stat-card"><div class="s-stat-icon green">A</div><div><div class="s-stat-value">{{ activeCount() }}</div><div class="s-stat-label">{{ 'DOM_FALLBACK.TEXT_092' | translate }}</div></div></div>
    </div>

    <div class="s-card" style="padding:0;overflow:visible;">
      <div class="ac-grid">
        <div class="ac-list">
          <div class="s-toolbar">
            <div class="s-search" style="flex:1;">
              <span class="s-search-icon">{{ 'AUTO_SECURITY_UI.SEARCH' | translate }}</span>
              <input [(ngModel)]="search" placeholder="{{ 'DOM_FALLBACK.TEXT_383' | translate }}" />
            </div>
            <label class="s-toggle">
              <input type="checkbox" [(ngModel)]="includeInactive" (change)="loadAuditEntities()" />
              <div class="s-toggle-track"></div><div class="s-toggle-thumb"></div>
            </label>
          </div>

          @if (loading()) {
            <div class="s-empty"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_181' | translate }}</div></div>
          } @else {
            @for (entity of filteredAuditEntities(); track entity.idEntity) {
              <div class="ac-item" [class.active]="selected()?.idEntity === entity.idEntity" (click)="select(entity)">
                <div style="width:34px;height:34px;border-radius:9px;background:var(--s-bg-4);display:grid;place-items:center;color:var(--s-accent);font-weight:700;">{{ entity.entityName[0] }}</div>
                <div style="flex:1;min-width:0;">
                  <div class="mono" style="font-size:12px;color:var(--s-accent);">{{ entity.entityName }}</div>
                  <div style="font-size:11px;color:var(--s-text-3);">{{ entity.tableName || 'No table name' }} - {{ entity.fields.length }} fields</div>
                </div>
                <span class="s-badge" [class.active]="entity.isActive" [class.inactive]="!entity.isActive">{{ entity.isActive ? 'On' : 'Off' }}</span>
              </div>
            } @empty {
              <div class="s-empty" style="padding:42px;"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_182' | translate }}</div></div>
            }
          }
        </div>

        <div class="ac-detail">
          @if (!selected()) {
            <div class="s-empty" style="padding:80px 20px;"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_183' | translate }}</div></div>
          } @else {
            <div class="ac-header">
              <div>
                <div class="mono" style="font-size:15px;color:var(--s-accent);font-weight:700;">{{ selected()!.entityName }}</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                  <span style="font-size:11px;color:var(--s-text-3);">{{ selected()!.tableName || 'No table name' }}</span>
                  <span class="s-badge" [class.active]="selected()!.isActive" [class.inactive]="!selected()!.isActive">{{ selected()!.isActive ? 'Active' : 'Inactive' }}</span>
                  <span style="font-size:11px;color:var(--s-text-3);">Created {{ selected()!.createdAt | date:'dd/MM/yy' }}</span>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="s-btn s-btn-primary s-btn-sm" (click)="openFieldManager()">{{ 'DOM_FALLBACK.TEXT_184' | translate }}</button>
                <button class="s-btn s-btn-ghost s-btn-sm" (click)="toggleEntityActive()">{{ selected()!.isActive ? 'Deactivate' : 'Activate' }}</button>
                <button class="s-btn-icon danger" (click)="askDeleteEntity()">{{ 'DOM_FALLBACK.TEXT_185' | translate }}</button>
              </div>
            </div>

            <div class="s-table-wrap">
              <table class="s-table">
                <thead><tr><th>{{ 'DOM_FALLBACK.TEXT_186' | translate }}</th><th>{{ 'DOM_FALLBACK.TEXT_187' | translate }}</th><th>{{ 'DOM_FALLBACK.TEXT_026' | translate }}</th><th style="width:52px;"></th></tr></thead>
                <tbody>
                  @for (field of selected()!.fields; track field.idField) {
                    <tr>
                      <td class="mono" style="font-size:11px;color:var(--s-accent);">{{ field.fieldName || ('Field #' + field.fieldId) }}</td>
                      <td class="mono" style="font-size:11px;color:var(--s-text-2);">{{ field.columnName || '-' }}</td>
                      <td><span class="s-badge" [class.active]="field.isActive" [class.inactive]="!field.isActive">{{ field.isActive ? 'Active' : 'Inactive' }}</span></td>
                      <td><button class="s-btn-icon danger" (click)="deleteField(field)">{{ 'DOM_FALLBACK.TEXT_185' | translate }}</button></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4"><div class="s-empty" style="padding:32px;"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_188' | translate }}</div></div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>

    <datalist id="auditEntityCatalog">
      @for (entity of untrackedEntities(); track entity.idEntity) {
        <option [value]="entityOption(entity)">{{ entity.tableName || entity.entityName }}</option>
      }
    </datalist>

    @if (createModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'DOM_FALLBACK.TEXT_189' | translate }}</span>
            <button class="s-btn-icon" (click)="createModal.set(false)">x</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">{{ saveError() }}</div> }
            <div class="s-form-row single">
              <div class="s-field">
                <label class="s-label">{{ 'DOM_FALLBACK.TEXT_190' | translate }}</label>
                <input class="s-input mono" [ngModel]="newEntityText" (ngModelChange)="onEntityInput($event)" list="auditEntityCatalog" placeholder="{{ 'DOM_FALLBACK.TEXT_381' | translate }}" />
              </div>
            </div>
            <div class="s-form-row single">
              <div class="s-field" style="flex-direction:row;align-items:center;gap:10px;">
                <label class="s-toggle"><input type="checkbox" [(ngModel)]="newEntityActive" /><div class="s-toggle-track"></div><div class="s-toggle-thumb"></div></label>
                <span style="font-size:13px;color:var(--s-text-2);">{{ 'DOM_FALLBACK.TEXT_092' | translate }}</span>
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="createModal.set(false)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-primary" (click)="saveEntity()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Track' }}</button>
          </div>
        </div>
      </div>
    }

    @if (fieldManagerModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal" style="max-width:980px;" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">Manage Fields - {{ selected()?.entityName }}</span>
            <button class="s-btn-icon" (click)="fieldManagerModal.set(false)">x</button>
          </div>
          <div class="s-modal-body">
            @if (saveError()) { <div class="s-alert error" style="margin-bottom:12px;">{{ saveError() }}</div> }
            <div class="field-manager">
              <div class="field-list">
                <div class="field-list-head"><span>{{ 'DOM_FALLBACK.TEXT_191' | translate }}</span><span>{{ availableFields().length }}</span></div>
                @for (field of availableFields(); track field.idField) {
                  <div class="field-row" [class.selected]="availableSelection().has(field.idField)" (click)="toggleAvailable(field.idField)">
                    <span class="mono" style="font-size:11px;">{{ field.fieldName }}</span>
                    <span style="font-size:11px;color:var(--s-text-3);">{{ field.columnName || '-' }}</span>
                  </div>
                } @empty {
                  <div class="s-empty" style="padding:32px;"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_192' | translate }}</div></div>
                }
              </div>

              <div class="move-buttons">
                <button class="s-btn s-btn-primary s-btn-sm" (click)="addSelectedFields()" [disabled]="saving() || !availableSelection().size">{{ 'DOM_FALLBACK.TEXT_193' | translate }}</button>
                <button class="s-btn s-btn-ghost s-btn-sm" (click)="addAllFields()" [disabled]="saving() || !availableFields().length">{{ 'AUTO_INLINE_SECURITY_UI.ALL' | translate }}</button>
                <button class="s-btn s-btn-ghost s-btn-sm" (click)="removeSelectedFields()" [disabled]="saving() || !trackedSelection().size">{{ 'AUTO_SECURITY_UI.REMOVE' | translate }}</button>
                <button class="s-btn s-btn-danger s-btn-sm" (click)="removeAllFields()" [disabled]="saving() || !selected()!.fields.length">{{ 'AUTO_SECURITY_UI.CLEAR' | translate }}</button>
              </div>

              <div class="field-list">
                <div class="field-list-head"><span>{{ 'DOM_FALLBACK.TEXT_195' | translate }}</span><span>{{ selected()!.fields.length }}</span></div>
                @for (field of selected()!.fields; track field.idField) {
                  <div class="field-row" [class.selected]="trackedSelection().has(field.idField)" (click)="toggleTracked(field.idField)">
                    <span class="mono" style="font-size:11px;">{{ field.fieldName }}</span>
                    <span style="font-size:11px;color:var(--s-text-3);">{{ field.columnName || '-' }}</span>
                  </div>
                } @empty {
                  <div class="s-empty" style="padding:32px;"><div class="s-empty-text">{{ 'DOM_FALLBACK.TEXT_196' | translate }}</div></div>
                }
              </div>
            </div>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="fieldManagerModal.set(false)">{{ 'AUTO_INLINE_SECURITY_UI.CLOSE' | translate }}</button>
          </div>
        </div>
      </div>
    }

    @if (deleteModal()) {
      <div class="s-modal-backdrop" (click)="onBd($event)">
        <div class="s-modal narrow" (click)="$event.stopPropagation()">
          <div class="s-modal-header">
            <span class="s-modal-title">{{ 'DOM_FALLBACK.TEXT_197' | translate }}</span>
            <button class="s-btn-icon" (click)="deleteModal.set(false)">x</button>
          </div>
          <div class="s-modal-body">
            <p style="font-size:13px;color:var(--s-text-2);">{{ 'DOM_FALLBACK.TEXT_198' | translate }} <strong class="mono" style="color:var(--s-accent);">{{ selected()?.entityName }}</strong>?</p>
          </div>
          <div class="s-modal-footer">
            <button class="s-btn s-btn-ghost" (click)="deleteModal.set(false)">{{ 'SECURITY.CHANGE_PASSWORD.CANCEL' | translate }}</button>
            <button class="s-btn s-btn-danger" (click)="doDeleteEntity()">{{ 'AUTO_SECURITY_UI.REMOVE' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AuditConfigComponent implements OnInit {
  private readonly api = inject(SecuApiService);

  auditEntities = signal<SecuAuditEntityDto[]>([]);
  entityCatalog = signal<SecuEntityDto[]>([]);
  fieldCatalog = signal<SecuFieldDto[]>([]);
  selected = signal<SecuAuditEntityDto | null>(null);
  loading = signal(true);
  saving = signal(false);
  saveError = signal<string | null>(null);
  createModal = signal(false);
  fieldManagerModal = signal(false);
  deleteModal = signal(false);
  availableSelection = signal<Set<number>>(new Set());
  trackedSelection = signal<Set<number>>(new Set());

  search = '';
  includeInactive = false;
  newEntityText = '';
  newEntityId = 0;
  newEntityActive = true;

  totalFields = computed(() => this.auditEntities().reduce((sum, entity) => sum + entity.fields.length, 0));
  activeCount = computed(() => this.auditEntities().filter(entity => entity.isActive).length);

  filteredAuditEntities = computed(() => {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.auditEntities();
    return this.auditEntities().filter(entity =>
      [entity.entityName, entity.tableName ?? '', String(entity.entityId)].join(' ').toLowerCase().includes(q));
  });

  untrackedEntities = computed(() => {
    const trackedIds = new Set(this.auditEntities().map(entity => entity.entityId));
    return this.entityCatalog().filter(entity => !trackedIds.has(entity.idEntity));
  });

  availableFields = computed(() => {
    const entity = this.selected();
    if (!entity) return [];
    const trackedFieldIds = new Set(entity.fields.map(field => field.fieldId));
    return this.fieldCatalog()
      .filter(field => field.entityId === entity.entityId && !trackedFieldIds.has(field.idField))
      .sort((a, b) => a.fieldName.localeCompare(b.fieldName));
  });

  ngOnInit() {
    this.loadCatalogs();
    this.loadAuditEntities();
  }

  loadCatalogs() {
    forkJoin({
      entities: this.api.getEntities({ size: 1000 }).pipe(catchError(() => of(null))),
      fields: this.api.getFields({ size: 3000 }).pipe(catchError(() => of(null))),
    }).subscribe(result => {
      if (result.entities) this.entityCatalog.set(result.entities.data);
      if (result.fields) this.fieldCatalog.set(result.fields.data);
    });
  }

  loadAuditEntities() {
    this.loading.set(true);
    this.api.getAuditEntities({ size: 1000, includeInactive: this.includeInactive })
      .pipe(catchError(() => of(null)))
      .subscribe(result => {
        if (result) {
          this.auditEntities.set(result.data);
          const current = this.selected();
          if (current) this.selected.set(result.data.find(entity => entity.idEntity === current.idEntity) ?? null);
        }
        this.loading.set(false);
      });
  }

  select(entity: SecuAuditEntityDto) {
    this.selected.set(entity);
    this.availableSelection.set(new Set());
    this.trackedSelection.set(new Set());
  }

  entityOption(entity: SecuEntityDto) {
    return `${entity.entityName}${entity.tableName ? ` (${entity.tableName})` : ''} #${entity.idEntity}`;
  }

  onEntityInput(value: string) {
    this.newEntityText = value;
    const normalized = value.trim().toLowerCase();
    const entity = this.untrackedEntities().find(item =>
      this.entityOption(item).toLowerCase() === normalized ||
      item.entityName.toLowerCase() === normalized ||
      item.tableName?.toLowerCase() === normalized ||
      String(item.idEntity) === normalized.replace('#', ''));
    this.newEntityId = entity?.idEntity ?? 0;
  }

  openCreate() {
    this.newEntityText = '';
    this.newEntityId = 0;
    this.newEntityActive = true;
    this.saveError.set(null);
    this.createModal.set(true);
  }

  saveEntity() {
    if (!this.newEntityId) {
      this.saveError.set('Choose an entity from the catalog.');
      return;
    }
    this.saving.set(true);
    this.api.createAuditEntity({ entityId: this.newEntityId, isActive: this.newEntityActive })
      .pipe(catchError(error => {
        this.saveError.set(error.error?.title ?? 'Entity tracking failed.');
        this.saving.set(false);
        return of(null);
      }))
      .subscribe(result => {
        this.saving.set(false);
        if (!result) return;
        this.createModal.set(false);
        this.loadAuditEntities();
      });
  }

  toggleEntityActive() {
    const entity = this.selected();
    if (!entity) return;
    this.api.updateAuditEntity(entity.idEntity, { isActive: !entity.isActive })
      .pipe(catchError(() => of(null)))
      .subscribe(result => {
        if (!result) return;
        this.selected.set(result);
        this.auditEntities.update(items => items.map(item => item.idEntity === result.idEntity ? result : item));
      });
  }

  askDeleteEntity() {
    this.deleteModal.set(true);
  }

  doDeleteEntity() {
    const entity = this.selected();
    if (!entity) return;
    this.api.deleteAuditEntity(entity.idEntity).pipe(catchError(() => of(null))).subscribe(() => {
      this.deleteModal.set(false);
      this.selected.set(null);
      this.loadAuditEntities();
    });
  }

  openFieldManager() {
    this.availableSelection.set(new Set());
    this.trackedSelection.set(new Set());
    this.saveError.set(null);
    this.fieldManagerModal.set(true);
  }

  toggleAvailable(id: number) {
    this.availableSelection.update(set => this.toggleSet(set, id));
  }

  toggleTracked(id: number) {
    this.trackedSelection.update(set => this.toggleSet(set, id));
  }

  addSelectedFields() {
    this.addFields([...this.availableSelection()]);
  }

  addAllFields() {
    this.addFields(this.availableFields().map(field => field.idField));
  }

  removeSelectedFields() {
    this.removeFields([...this.trackedSelection()]);
  }

  removeAllFields() {
    const entity = this.selected();
    if (!entity) return;
    this.removeFields(entity.fields.map(field => field.idField));
  }

  addFields(fieldIds: number[]) {
    const entity = this.selected();
    if (!entity || !fieldIds.length) return;
    this.saving.set(true);
    forkJoin(fieldIds.map(fieldId =>
      this.api.createAuditField(entity.idEntity, { fieldId }).pipe(catchError(error => {
        this.saveError.set(error.error?.title ?? 'Some fields could not be added.');
        return of(null);
      }))))
      .subscribe(() => {
        this.saving.set(false);
        this.availableSelection.set(new Set());
        this.loadAuditEntities();
      });
  }

  removeFields(auditFieldIds: number[]) {
    if (!auditFieldIds.length) return;
    this.saving.set(true);
    forkJoin(auditFieldIds.map(id => this.api.deleteAuditField(id).pipe(catchError(() => of(null)))))
      .subscribe(() => {
        this.saving.set(false);
        this.trackedSelection.set(new Set());
        this.loadAuditEntities();
      });
  }

  deleteField(field: SecuAuditFieldDto) {
    this.removeFields([field.idField]);
  }

  onBd(event: MouseEvent) {
    if (!(event.target as HTMLElement).classList.contains('s-modal-backdrop')) return;
    this.createModal.set(false);
    this.fieldManagerModal.set(false);
    this.deleteModal.set(false);
  }

  private toggleSet(source: Set<number>, id: number) {
    const next = new Set(source);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }
}

