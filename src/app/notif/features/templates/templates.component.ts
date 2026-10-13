import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '@ngx-translate/core';
import { PermissionService } from '../../core/services/permission.service';
import { TemplatesService } from '../../core/services/templates.service';
import { EventTypesService } from '../../core/services/event-types.service';
import { ReferenceService } from '../../core/services/reference.service';
import { DataSourcesService } from '../../core/services/data-sources.service';
import { AudienceService } from '../../core/services/audience.service';
import { TemplateAttachment, TemplateDataBinding, TemplateDetail, TemplateLocale, TemplateSummary, TemplateTargetResolver } from '../../core/models/template';
import { EventType } from '../../core/models/event-type';
import { ReferenceItem } from '../../core/models/reference';
import { DataSource } from '../../core/models/data-source';
import { AudienceGroup, AudienceRole, AudienceUser } from '../../core/models/audience';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { formatHttpError, unwrapList } from '../../shared/utils/api-utils';

const PAGE_CODE = 'NOTIF_TEMPLATES';

type PreviewDataRow = { key: string; value: string };
type ConfigRow = { key: string; value: string };

interface TemplatePreviewResult {
  title: string;
  body: string;
  isHtml: boolean;
  unresolvedPlaceholders: string[];
}

@Component({
  selector: 'notif-templates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DialogModule,
    DividerModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    MultiSelectModule,
    SelectButtonModule,
    TableModule,
    TabsModule,
    TagModule,
    TranslatePipe,
    PermActionDirective
  ],
  templateUrl: './templates.component.html'
})
export class TemplatesComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly templatesService = inject(TemplatesService);
  private readonly eventTypesService = inject(EventTypesService);
  private readonly referenceService = inject(ReferenceService);
  private readonly dataSourcesService = inject(DataSourcesService);
  private readonly audienceService = inject(AudienceService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  templates: TemplateSummary[] = [];
  selected: TemplateDetail | null = null;
  listSearch = '';
  readonly activeTab = signal<number>(0);

  onTabChange(event: { value: number }): void { this.activeTab.set(event.value); }

  get filteredTemplates(): TemplateSummary[] {
    const q = this.listSearch.trim().toLowerCase();
    if (!q) return this.templates;
    return this.templates.filter(t =>
      this.getEventTypeLabel(t.eventTypeId).toLowerCase().includes(q) ||
      this.getPriorityLabel(t.priority).toLowerCase().includes(q)
    );
  }
  eventTypes: EventType[] = [];
  channels: ReferenceItem[] = [];
  priorities: ReferenceItem[] = [];
  dataSources: DataSource[] = [];
  audienceUsers: AudienceUser[] = [];
  audienceRoles: AudienceRole[] = [];
  audienceGroups: AudienceGroup[] = [];
  audienceType = 'user';
  audienceSearch = '';
  selectedAudienceRole = '';
  selectedAudienceGroup = '';
  audienceSelection = new Set<string>();
  audienceLoading = false;
  showAudienceDialog = false;
  showResolverDialog = false;
  showBindingDialog = false;
  showLocaleDialog = false;
  eventTypeOptions: { label: string; value: string }[] = [];
  channelOptions: { label: string; value: number }[] = [];
  priorityOptions: { label: string; value: number }[] = [];
  dataSourceOptions: { label: string; value: string }[] = [];
  selectedBindingId: string | null = null;
  selectedResolverId: string | null = null;
  editingLocaleId: string | null = null;
  scheduleOptions = [
    { label: 'Immediate', value: 0 },
    { label: 'Scheduled', value: 1 },
    { label: 'Recurring', value: 2 }
  ];
  resolverTypes = [
    { id: 1, label: 'UserId', description: 'Uses a field in event data to target a user.' },
    { id: 2, label: 'Role', description: 'Targets users by role code.' },
    { id: 3, label: 'Group', description: 'Targets users by recipient group code.' },
    { id: 4, label: 'SqlQuery', description: 'Targets users returned by a data source query.' },
    { id: 5, label: 'All Users', description: 'Targets all users in the tenant.' },
    { id: 6, label: 'Audience List', description: 'Uses the selected audience list.' }
  ];

  audienceTypes = [
    { label: 'Users', value: 'user' },
    { label: 'Role', value: 'role' },
    { label: 'Group', value: 'group' }
  ];

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  previewResult: unknown | null = null;
  bindingMappings: { param: string; variable: string }[] = [];
  resolverMappings: { param: string; variable: string }[] = [];
  resolverConfigRows: ConfigRow[] = [];
  previewRows: PreviewDataRow[] = [];

  form = this.fb.group({
    eventTypeId: ['', Validators.required],
    defaultTitle: ['', Validators.required],
    defaultBody: ['', Validators.required],
    isHtml: [false],
    priority: [1, Validators.required],
    scheduleType: [0, Validators.required],
    cronExpression: [''],
    delayMinutes: [0],
    maxRetries: [3, Validators.required],
    retryDelaySeconds: [30, Validators.required],
    isActive: [true],
    createdBy: ['ui'],
    channels: [[] as number[]]
  });

  localeForm = this.fb.group({
    languageCode: ['', Validators.required],
    title: ['', Validators.required],
    body: ['', Validators.required]
  });

  bindingForm = this.fb.group({
    dataSourceId: ['', Validators.required],
    paramMapping: ['{}'],
    executionOrder: [1, Validators.required]
  });

  resolverForm = this.fb.group({
    resolverType: [1, Validators.required],
    userIdField: ['userId'],
    role: [''],
    groupCode: [''],
    dataSourceId: ['']
  });

  attachmentTypeOptions = [
    { label: 'Excel (.xlsx)', value: 'excel' },
    { label: 'CSV (.csv)', value: 'csv' },
    { label: 'PDF', value: 'pdf' }
  ];

  attachmentForm = this.fb.group({
    enabled: [false],
    type: ['excel'],
    filename: ['report'],
    sheetName: ['Sheet1'],
    reportTitle: [''],
    dataSourceId: [''],
    paramMapping: ['{}']
  });

  attachmentMappings: { param: string; variable: string }[] = [];

  get attachmentEnabled(): boolean {
    return !!this.attachmentForm.controls.enabled.value;
  }

  get selectedAttachmentColumns(): string[] {
    return this.getColumnsForDataSource(this.attachmentForm.controls.dataSourceId.value || '');
  }

  addAttachmentMappingRow(): void {
    this.attachmentMappings = [...this.attachmentMappings, { param: '', variable: '' }];
  }

  removeAttachmentMappingRow(index: number): void {
    this.attachmentMappings = this.attachmentMappings.filter((_, i) => i !== index);
  }

  autoFillAttachmentMappings(): void {
    const id = this.attachmentForm.controls.dataSourceId.value || '';
    const ds = this.dataSources.find(s => s.id === id);
    const params = this.parseColumns(ds?.expectedParams);
    if (params.length === 0) return;
    this.attachmentMappings = params.map(p => ({ param: p, variable: p }));
  }

  private buildAttachmentConfig(): TemplateAttachment | null {
    if (!this.attachmentForm.controls.enabled.value) return null;
    const v = this.attachmentForm.getRawValue();
    return {
      enabled: true,
      type: (v.type || 'excel') as 'excel' | 'pdf' | 'csv',
      filename: v.filename?.trim() || 'report',
      sheetName: v.sheetName?.trim() || 'Sheet1',
      reportTitle: v.reportTitle?.trim() || '',
      dataSourceId: v.dataSourceId || null,
      paramMapping: this.buildMappingJson(this.attachmentMappings)
    };
  }

  private patchAttachmentForm(config: TemplateAttachment | null | undefined): void {
    if (!config) {
      this.attachmentForm.reset({ enabled: false, type: 'excel', filename: 'report', sheetName: 'Sheet1', reportTitle: '', dataSourceId: '', paramMapping: '{}' });
      this.attachmentMappings = [];
      return;
    }
    this.attachmentForm.patchValue({
      enabled: config.enabled,
      type: config.type,
      filename: config.filename,
      sheetName: config.sheetName,
      reportTitle: config.reportTitle,
      dataSourceId: config.dataSourceId || '',
      paramMapping: config.paramMapping || '{}'
    });
    this.attachmentMappings = this.getMappedParamPairs(config.paramMapping);
  }

  cronPresets = [
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at 9:00', value: '0 9 * * *' }
  ];

  delayPresets = [
    { label: '5 min', value: 5 },
    { label: '15 min', value: 15 },
    { label: '1 hour', value: 60 }
  ];

  previewForm = this.fb.group({
    languageCode: ['']
  });

  get selectedBindingOutputColumns(): string {
    const id = this.bindingForm.controls.dataSourceId.value || this.selectedBindingDataSourceId;
    return this.dataSources.find((source) => source.id === id)?.outputColumns || '';
  }

  get selectedBindingExpectedParams(): string {
    const id = this.bindingForm.controls.dataSourceId.value || this.selectedBindingDataSourceId;
    return this.dataSources.find((source) => source.id === id)?.expectedParams || '';
  }

  get selectedBindingColumns(): string[] {
    const id = this.bindingForm.controls.dataSourceId.value || this.selectedBindingDataSourceId;
    return this.getColumnsForDataSource(id);
  }

  get selectedResolverOutputColumns(): string {
    const id = this.resolverForm.controls.dataSourceId.value || this.selectedResolverDataSourceId;
    return this.dataSources.find((source) => source.id === id)?.outputColumns || '';
  }

  get selectedResolverExpectedParams(): string {
    const id = this.resolverForm.controls.dataSourceId.value || this.selectedResolverDataSourceId;
    return this.dataSources.find((source) => source.id === id)?.expectedParams || '';
  }

  get selectedResolverColumns(): string[] {
    const id = this.resolverForm.controls.dataSourceId.value || this.selectedResolverDataSourceId;
    return this.getColumnsForDataSource(id);
  }

  get selectedBindingDataSourceId(): string {
    if (!this.selected || !this.selectedBindingId) {
      return '';
    }
    return this.selected.dataBindings.find((b) => b.id === this.selectedBindingId)?.dataSourceId || '';
  }

  get selectedResolverDataSourceId(): string {
    if (!this.selected || !this.selectedResolverId) {
      return '';
    }
    return this.selected.targetResolvers.find((r) => r.id === this.selectedResolverId)?.dataSourceId || '';
  }

  get scheduleTypeValue(): number {
    return Number(this.form.controls.scheduleType.value ?? 0);
  }

  get resolverTypeValue(): number {
    return Number(this.resolverForm.controls.resolverType.value ?? 0);
  }

  get resolverTypeDescription(): string {
    return this.resolverTypes.find((resolver) => resolver.id === this.resolverTypeValue)?.description || '';
  }

  get selectedEventType(): EventType | undefined {
    const eventTypeId = this.form.controls.eventTypeId.value || this.selected?.eventTypeId || '';
    return this.eventTypes.find((eventType) => eventType.id === eventTypeId);
  }

  get selectedEventPayloadFields(): string[] {
    return this.parsePayloadFieldNames(this.selectedEventType?.expectedPayload);
  }

  get availableTemplateVariables(): string[] {
    return Array.from(new Set([
      ...this.selectedEventPayloadFields,
      ...this.selectedBindingColumns,
      ...this.selectedResolverColumns,
      ...this.extractPlaceholders(this.form.controls.defaultTitle.value),
      ...this.extractPlaceholders(this.form.controls.defaultBody.value)
    ].filter(Boolean)));
  }

  get renderedPreview(): TemplatePreviewResult | null {
    return this.previewResult as TemplatePreviewResult | null;
  }

  get filteredAudienceUsers(): AudienceUser[] {
    const term = (this.audienceSearch || '').trim().toLowerCase();
    if (!term) {
      return this.audienceUsers;
    }
    return this.audienceUsers.filter((user) => {
      const name = (user.fullName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const id = (user.userId || '').toLowerCase();
      return name.includes(term) || email.includes(term) || id.includes(term);
    });
  }

  get selectedAudienceCount(): number {
    return this.audienceSelection.size;
  }

  get statusSeverity(): 'success' | 'info' | 'error' {
    return (this.status?.type ?? 'info') as 'success' | 'info' | 'error';
  }

  get isEditing(): boolean {
    return !!this.selected;
  }

  get canEditDetails(): boolean {
    return !!this.selected;
  }

  getEventTypeLabel(id: string): string {
    const match = this.eventTypes.find((eventType) => eventType.id === id);
    return match ? `${match.code} - ${match.label}` : id;
  }

  getPriorityLabel(priority: number): string {
    return this.priorities.find((item) => item.id === priority)?.label || String(priority);
  }

  getResolverLabel(type: number): string {
    return this.resolverTypes.find((item) => item.id === type)?.label || String(type);
  }

  getDataSourceName(id: string): string {
    if (!id) {
      return '';
    }
    return this.dataSources.find((source) => source.id === id)?.name || id;
  }

  applyCronPreset(value: string): void {
    if (!value) {
      return;
    }
    this.form.controls.cronExpression.setValue(value);
  }

  applyDelayPreset(value: number): void {
    if (!value && value !== 0) {
      return;
    }
    this.form.controls.delayMinutes.setValue(value);
  }

  addBindingMappingRow(): void {
    this.bindingMappings = [...this.bindingMappings, { param: '', variable: '' }];
  }

  removeBindingMappingRow(index: number): void {
    this.bindingMappings = this.bindingMappings.filter((_, i) => i !== index);
  }

  autoFillBindingMappings(): void {
    const params = this.parseColumns(this.selectedBindingExpectedParams);
    if (params.length === 0) {
      return;
    }
    this.bindingMappings = params.map((param) => ({ param, variable: param }));
  }

  onBindingDataSourceChange(): void {
    if (this.bindingMappings.length === 0) {
      this.autoFillBindingMappings();
    }
  }

  addResolverMappingRow(): void {
    this.resolverMappings = [...this.resolverMappings, { param: '', variable: '' }];
  }

  removeResolverMappingRow(index: number): void {
    this.resolverMappings = this.resolverMappings.filter((_, i) => i !== index);
  }

  autoFillResolverMappings(): void {
    const params = this.parseColumns(this.selectedResolverExpectedParams);
    if (params.length === 0) {
      return;
    }
    this.resolverMappings = params.map((param) => ({ param, variable: param }));
  }

  onResolverDataSourceChange(): void {
    if (this.resolverMappings.length === 0) {
      this.autoFillResolverMappings();
    }
  }

  onResolverTypeChange(): void {
    this.resolverMappings = [];
    const type = this.resolverTypeValue;
    if (type !== 4) {
      this.resolverForm.controls.dataSourceId.setValue('');
    }

    switch (type) {
      case 1:
        this.resolverConfigRows = [{ key: 'field', value: this.resolverForm.controls.userIdField.value || 'userId' }];
        break;
      case 2:
        this.resolverConfigRows = [{ key: 'role', value: this.resolverForm.controls.role.value || '' }];
        break;
      case 3:
        this.resolverConfigRows = [{ key: 'groupCode', value: this.resolverForm.controls.groupCode.value || '' }];
        break;
      default:
        this.resolverConfigRows = [];
        break;
    }
  }

  addResolverConfigRow(key = '', value = ''): void {
    this.resolverConfigRows = [...this.resolverConfigRows, { key, value }];
  }

  removeResolverConfigRow(index: number): void {
    this.resolverConfigRows = this.resolverConfigRows.filter((_, i) => i !== index);
  }

  setResolverConfigValue(key: string, value: string | null | undefined): void {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      return;
    }
    const nextValue = value || '';
    const existingIndex = this.resolverConfigRows.findIndex(
      (row) => row.key.trim().toLowerCase() === normalizedKey.toLowerCase()
    );
    if (existingIndex >= 0) {
      this.resolverConfigRows = this.resolverConfigRows.map((row, index) =>
        index === existingIndex ? { ...row, value: nextValue } : row
      );
      return;
    }
    this.addResolverConfigRow(normalizedKey, nextValue);
  }

  addPreviewRow(key = '', value = ''): void {
    this.previewRows = [...this.previewRows, { key, value }];
  }

  removePreviewRow(index: number): void {
    this.previewRows = this.previewRows.filter((_, i) => i !== index);
  }

  autoFillPreviewRows(): void {
    const keys = this.availableTemplateVariables;
    if (keys.length === 0) {
      this.addPreviewRow();
      return;
    }
    this.previewRows = keys.map((key) => ({ key, value: this.exampleValueFor(key) }));
  }

  addVariableToPreview(key: string): void {
    if (!key || this.previewRows.some((row) => row.key.toLowerCase() === key.toLowerCase())) {
      return;
    }
    this.addPreviewRow(key, this.exampleValueFor(key));
  }

  private buildMappingJson(rows: { param: string; variable: string }[]): string {
    const mapping: Record<string, string> = {};
    for (const row of rows) {
      if (!row.param || !row.variable) {
        continue;
      }
      mapping[row.param] = row.variable;
    }
    return JSON.stringify(mapping);
  }

  getColumnsForDataSource(id: string): string[] {
    if (!id) {
      return [];
    }
    const source = this.dataSources.find((item) => item.id === id);
    if (!source) {
      return [];
    }
    const fromOutput = this.parseColumns(source.outputColumns);
    if (fromOutput.length > 0) {
      return fromOutput;
    }
    return this.extractColumnsFromSql(source.sqlQuery);
  }

  getPrioritySeverity(priority: number): 'success' | 'info' | 'warn' | 'danger' {
    switch (priority) {
      case 0:
        return 'info';
      case 1:
        return 'success';
      case 2:
        return 'warn';
      case 3:
        return 'danger';
      default:
        return 'info';
    }
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadEventTypes();
    this.loadDataSources();
    this.loadAudienceLookups();
    this.loadAudienceUsers();
    this.loadTemplates();
  }

  loadReferenceData(): void {
    this.referenceService.getChannels().subscribe({
      next: (channels) => {
        this.channels = channels;
        this.channelOptions = channels.map((channel) => ({
          label: channel.label,
          value: channel.id
        }));
        if (this.selected) {
          this.form.controls.channels.setValue(this.selected.channels.map((c) => c.channelId));
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
    this.referenceService.getPriorities().subscribe({
      next: (priorities) => {
        this.priorities = priorities;
        this.priorityOptions = priorities.map((priority) => ({
          label: priority.label,
          value: priority.id
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  loadEventTypes(): void {
    this.eventTypesService.list().subscribe({
      next: (items) => {
        this.eventTypes = items;
        this.eventTypeOptions = items.map((item) => ({
          label: `${item.code} - ${item.label}`,
          value: item.id
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  loadDataSources(): void {
    this.dataSourcesService.list().subscribe({
      next: (response) => {
        this.dataSources = unwrapList<DataSource>(response);
        this.dataSourceOptions = this.dataSources.map((source) => ({
          label: source.name,
          value: source.id
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  loadAudienceLookups(): void {
    this.audienceService.listRoles().subscribe({
      next: (roles) => {
        this.audienceRoles = roles ?? [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });

    this.audienceService.listGroups().subscribe({
      next: (groups) => {
        this.audienceGroups = groups ?? [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  setAudienceType(value: string): void {
    this.audienceType = value;
    this.audienceSearch = '';
    this.audienceSelection.clear();
    this.selectedAudienceRole = '';
    this.selectedAudienceGroup = '';
    this.audienceUsers = [];
    this.showAudienceDialog = true;
    if (value === 'user') {
      this.loadAudienceUsers();
    }
  }

  loadAudienceUsers(): void {
    this.audienceLoading = true;
    this.audienceService.listUsers().subscribe({
      next: (users) => {
        this.audienceUsers = users ?? [];
        this.selectAllAudienceUsers();
        this.audienceLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.audienceLoading = false;
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  onAudienceRoleChange(): void {
    if (!this.selectedAudienceRole) {
      this.audienceUsers = [];
      this.audienceSelection.clear();
      return;
    }
    this.audienceLoading = true;
    this.audienceService.listUsersByRole(this.selectedAudienceRole).subscribe({
      next: (users) => {
        this.audienceUsers = users ?? [];
        this.selectAllAudienceUsers();
        this.audienceLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.audienceLoading = false;
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  onAudienceGroupChange(): void {
    if (!this.selectedAudienceGroup) {
      this.audienceUsers = [];
      this.audienceSelection.clear();
      return;
    }
    this.audienceLoading = true;
    this.audienceService.listUsersByGroup(this.selectedAudienceGroup).subscribe({
      next: (users) => {
        this.audienceUsers = users ?? [];
        this.selectAllAudienceUsers();
        this.audienceLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.audienceLoading = false;
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  isAudienceSelected(userId: string): boolean {
    return this.audienceSelection.has(userId);
  }

  toggleAudienceUser(userId: string, selected: boolean): void {
    if (selected) {
      this.audienceSelection.add(userId);
    } else {
      this.audienceSelection.delete(userId);
    }
  }

  selectAllAudienceUsers(): void {
    this.audienceSelection = new Set(this.audienceUsers.map((user) => user.userId));
  }

  clearAudienceUsers(): void {
    this.audienceSelection.clear();
  }

  addAudienceResolver(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Select a template first.' };
      return;
    }
    if (this.audienceSelection.size === 0) {
      this.status = { type: 'error', message: 'Select at least one recipient.' };
      return;
    }

    const selectedUsers = this.audienceUsers.filter((user) => this.audienceSelection.has(user.userId));
    const payload = {
      resolverType: 6,
      config: {
        users: selectedUsers.map((user) => ({
          userId: user.userId,
          email: user.email || null
        }))
      },
      dataSourceId: null,
      paramMapping: '{}'
    };

    this.templatesService.addResolver(this.selected.id, payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Audience resolver added.' };
        this.showAudienceDialog = false;
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  loadTemplates(): void {
    this.status = { type: 'info', message: 'Loading templates...' };
    this.templatesService.list().subscribe({
      next: (response) => {
        this.templates = unwrapList<TemplateSummary>(response);
        this.status = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  selectTemplate(item: TemplateSummary): void {
    this.templatesService.getById(item.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.selectedBindingId = detail.dataBindings[0]?.id ?? null;
        this.selectedResolverId = detail.targetResolvers[0]?.id ?? null;
        this.previewResult = null;
        this.patchForm(detail);
        this.previewRows = [];
        this.syncPreviewRows();
        this.form.controls.eventTypeId.disable();
        this.form.controls.channels.disable();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  removeTemplate(item: TemplateSummary): void {
    if (!confirm(`Delete template ${item.id}?`)) {
      return;
    }
    this.templatesService.delete(item.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Template deleted.' };
        if (this.selected?.id === item.id) {
          this.resetForm();
        }
        this.loadTemplates();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.selected = null;
    this.previewResult = null;
    this.previewRows = [];
    this.showAudienceDialog = false;
    this.showResolverDialog = false;
    this.showBindingDialog = false;
    this.showLocaleDialog = false;
    this.resetLocaleForm();
    this.form.reset({
      eventTypeId: '',
      defaultTitle: '',
      defaultBody: '',
      isHtml: false,
      priority: 1,
      scheduleType: 0,
      cronExpression: '',
      delayMinutes: 0,
      maxRetries: 3,
      retryDelaySeconds: 30,
      isActive: true,
      createdBy: 'ui',
      channels: []
    });
    this.form.controls.eventTypeId.enable();
    this.form.controls.channels.enable();
    this.patchAttachmentForm(null);
  }

  saveTemplate(): void {
    if (this.form.invalid) {
      this.status = { type: 'error', message: 'Please fill in the required fields.' };
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const scheduleType = Number(value.scheduleType ?? 0);
    const payloadBase = {
      defaultTitle: value.defaultTitle,
      defaultBody: value.defaultBody,
      isHtml: value.isHtml ?? false,
      priority: Number(value.priority ?? 1),
      scheduleType,
      cronExpression: scheduleType === 2 ? value.cronExpression || null : null,
      delayMinutes: scheduleType === 1 ? Number(value.delayMinutes || 0) : null,
      maxRetries: Number(value.maxRetries ?? 0),
      retryDelaySeconds: Number(value.retryDelaySeconds ?? 0)
    };

    if (this.selected) {
      const attachment = this.buildAttachmentConfig();
      const updatePayload = {
        ...payloadBase,
        isActive: value.isActive ?? true,
        attachmentDataSourceId: attachment?.dataSourceId ?? null,
        attachmentFileName: attachment ? (attachment.filename || 'report.xlsx') : null,
        attachmentSheetName: attachment ? (attachment.sheetName || 'Sheet1') : null,
      };
      this.templatesService.update(this.selected.id, updatePayload).subscribe({
        next: () => {
          this.status = { type: 'success', message: 'Template updated.' };
          this.loadTemplates();
          this.refreshSelected();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
          this.cdr.markForCheck();
        }
      });
      return;
    }

    const createPayload = {
      ...payloadBase,
      eventTypeId: value.eventTypeId,
      channels: (value.channels ?? []) as number[],
      createdBy: value.createdBy || 'ui'
    };
    this.templatesService.create(createPayload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Template created.' };
        this.loadTemplates();
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  addLocale(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Select a template first.' };
      return;
    }
    if (this.localeForm.invalid) {
      this.localeForm.markAllAsTouched();
      return;
    }

    const payload = this.localeForm.getRawValue();
    const request = this.editingLocaleId
      ? this.templatesService.updateLocale(this.selected.id, this.editingLocaleId, payload)
      : this.templatesService.addLocale(this.selected.id, payload);

    request.subscribe({
      next: () => {
        this.status = {
          type: 'success',
          message: this.editingLocaleId ? 'Locale updated.' : 'Locale added.'
        };
        this.resetLocaleForm();
        this.showLocaleDialog = false;
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  addBinding(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Select a template first.' };
      return;
    }
    if (this.bindingForm.invalid) {
      this.bindingForm.markAllAsTouched();
      return;
    }
    const value = this.bindingForm.getRawValue();
    const mappingJson = this.buildMappingJson(this.bindingMappings);
    const payload = {
      dataSourceId: value.dataSourceId,
      paramMapping: mappingJson,
      executionOrder: Number(value.executionOrder ?? 1)
    };
    this.templatesService.addBinding(this.selected.id, payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Binding added.' };
        this.bindingForm.reset({ dataSourceId: '', paramMapping: '{}', executionOrder: 1 });
        this.bindingMappings = [];
        this.showBindingDialog = false;
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  hasResolvers(): boolean {
    return (this.selected?.targetResolvers?.length ?? 0) > 0;
  }

  hasBindings(): boolean {
    return (this.selected?.dataBindings?.length ?? 0) > 0;
  }

  hasLocales(): boolean {
    return (this.selected?.locales?.length ?? 0) > 0;
  }

  removeBinding(binding: TemplateDataBinding): void {
    if (!this.selected) {
      return;
    }
    if (!confirm('Delete this binding?')) {
      return;
    }
    this.templatesService.deleteBinding(this.selected.id, binding.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Binding deleted.' };
        if (this.selectedBindingId === binding.id) {
          this.selectedBindingId = null;
        }
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  addResolver(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Select a template first.' };
      return;
    }
    if (this.resolverForm.invalid) {
      this.resolverForm.markAllAsTouched();
      return;
    }
    const value = this.resolverForm.getRawValue();
    const resolverType = Number(value.resolverType ?? 1);
    const config = this.buildResolverConfig();
    if (config === null) {
      return;
    }
    const mappingJson = this.buildMappingJson(this.resolverMappings);
    const payload = {
      resolverType,
      config,
      dataSourceId: resolverType === 4 ? value.dataSourceId || null : null,
      paramMapping: resolverType === 4 ? mappingJson : '{}'
    };
    this.templatesService.addResolver(this.selected.id, payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Resolver added.' };
        this.resetResolverForm();
        this.showResolverDialog = false;
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  removeResolver(resolver: TemplateTargetResolver): void {
    if (!this.selected) {
      return;
    }
    if (!confirm('Delete this resolver?')) {
      return;
    }
    this.templatesService.deleteResolver(this.selected.id, resolver.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Resolver deleted.' };
        if (this.selectedResolverId === resolver.id) {
          this.selectedResolverId = null;
        }
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  activate(): void {
    if (!this.selected) {
      return;
    }
    this.templatesService.activate(this.selected.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Template activated.' };
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  deactivate(): void {
    if (!this.selected) {
      return;
    }
    this.templatesService.deactivate(this.selected.id).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Template deactivated.' };
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  toggle(): void {
    if (!this.selected) {
      return;
    }
    this.templatesService.toggle(this.selected.id, !this.selected.isActive).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Template updated.' };
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  preview(): void {
    if (!this.selected) {
      return;
    }
    const value = this.previewForm.getRawValue();
    const payload = {
      sampleData: this.buildPreviewSampleData(),
      languageCode: value.languageCode || null
    };
    this.templatesService.preview(this.selected.id, payload).subscribe({
      next: (result) => {
        this.previewResult = result;
        this.status = { type: 'success', message: 'Preview generated.' };
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  onColumnDragStart(event: DragEvent, column: string): void {
    event.dataTransfer?.setData('text/plain', `{{${column}}}`);
  }

  onBodyDrop(event: DragEvent): void {
    event.preventDefault();
    const token = event.dataTransfer?.getData('text/plain');
    if (token) {
      this.insertToken(token);
    }
  }

  onBodyDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  insertToken(token: string): void {
    const current = this.form.controls.defaultBody.value || '';
    this.form.controls.defaultBody.setValue(`${current}${current ? ' ' : ''}${token}`);
  }

  private patchForm(detail: TemplateDetail): void {
    this.form.patchValue({
      eventTypeId: detail.eventTypeId,
      defaultTitle: detail.defaultTitle,
      defaultBody: detail.defaultBody,
      isHtml: detail.isHtml,
      priority: detail.priority,
      scheduleType: detail.scheduleType,
      cronExpression: detail.cronExpression || '',
      delayMinutes: detail.delayMinutes ?? 0,
      maxRetries: detail.maxRetries,
      retryDelaySeconds: detail.retryDelaySeconds,
      isActive: detail.isActive,
      channels: detail.channels.map((channel) => channel.channelId)
    });
    const attachmentConfig = detail.attachmentDataSourceId
      ? {
          enabled: true,
          type: 'excel' as const,
          filename: detail.attachmentFileName || 'report.xlsx',
          sheetName: detail.attachmentSheetName || 'Sheet1',
          reportTitle: '',
          dataSourceId: detail.attachmentDataSourceId,
          paramMapping: null,
        }
      : null;
    this.patchAttachmentForm(attachmentConfig);
    this.syncPreviewRows();
  }

  private refreshSelected(): void {
    if (!this.selected) {
      return;
    }
    this.templatesService.getById(this.selected.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        if (!this.selectedBindingId && detail.dataBindings.length > 0) {
          this.selectedBindingId = detail.dataBindings[0].id;
        }
        if (!this.selectedResolverId && detail.targetResolvers.length > 0) {
          this.selectedResolverId = detail.targetResolvers[0].id;
        }
        this.patchForm(detail);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
        this.cdr.markForCheck();
      }
    });
  }

  openAudienceDialog(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Create the template first.' };
      return;
    }
    if (this.audienceType === 'user' && this.audienceUsers.length === 0) {
      this.loadAudienceUsers();
    }
    this.showAudienceDialog = true;
  }

  openResolverDialog(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Create the template first.' };
      return;
    }
    this.resetResolverForm();
    this.showResolverDialog = true;
  }

  openBindingDialog(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Create the template first.' };
      return;
    }
    this.showBindingDialog = true;
  }

  openLocaleDialog(): void {
    if (!this.selected) {
      this.status = { type: 'error', message: 'Create the template first.' };
      return;
    }
    this.resetLocaleForm();
    this.showLocaleDialog = true;
  }

  editLocale(locale: TemplateLocale): void {
    this.editingLocaleId = locale.id;
    this.localeForm.reset({
      languageCode: locale.languageCode,
      title: locale.title,
      body: locale.body
    });
    this.showLocaleDialog = true;
  }

  insertLocaleToken(token: string): void {
    const current = this.localeForm.controls.body.value || '';
    this.localeForm.controls.body.setValue(`${current}${current ? ' ' : ''}${token}`);
  }

  onLocaleBodyDrop(event: DragEvent): void {
    event.preventDefault();
    const token = event.dataTransfer?.getData('text/plain');
    if (token) {
      this.insertLocaleToken(token);
    }
  }

  private parseColumns(raw: string | null | undefined): string[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  private extractColumnsFromSql(sql: string | null | undefined): string[] {
    if (!sql) {
      return [];
    }
    const match = sql.match(/select\s+([\s\S]+?)(?:\s+from\s+|$)/i);
    if (!match) {
      return [];
    }
    const selectClause = match[1];
    const parts = selectClause.split(',').map((part) => part.trim());
    const columns: string[] = [];
    for (const part of parts) {
      const asMatch = part.match(/\s+as\s+\"?([A-Za-z0-9_]+)\"?/i);
      if (asMatch && asMatch[1]) {
        columns.push(asMatch[1]);
        continue;
      }
      const quotedMatch = part.match(/\"([A-Za-z0-9_]+)\"/);
      if (quotedMatch && quotedMatch[1]) {
        columns.push(quotedMatch[1]);
      }
    }
    return columns;
  }

  getResolverConfigSummary(resolver: TemplateTargetResolver): string {
    const config = this.parseJsonObject(resolver.config);
    switch (resolver.resolverType) {
      case 1:
        return this.formatConfigSummary(config, `Event field: ${config['field'] || 'userId'}`);
      case 2:
        return this.formatConfigSummary(config, `Role: ${config['role'] || '-'}`);
      case 3:
        return this.formatConfigSummary(config, `Group: ${config['groupCode'] || '-'}`);
      case 4:
        return this.formatConfigSummary(config, resolver.dataSourceId ? `Data source: ${this.getDataSourceName(resolver.dataSourceId)}` : 'SQL data source');
      case 5:
        return this.formatConfigSummary(config, 'All active users');
      case 6:
        return this.getAudienceSummary(config);
      default:
        return this.formatConfigSummary(config, 'Resolver');
    }
  }

  getBindingSummary(binding: TemplateDataBinding): string {
    const pairs = this.getMappedParamPairs(binding.paramMapping).map((pair) => `${pair.param} <- ${pair.variable}`);
    return pairs.length ? pairs.join(', ') : 'No parameters required';
  }

  getMappedParamPairs(mappingJson?: string | null): { param: string; variable: string }[] {
    const mapping = this.parseJsonObject(mappingJson);
    return Object.keys(mapping).map((param) => ({ param, variable: mapping[param] }));
  }

  private buildResolverConfig(): string | null {
    const value = this.resolverForm.getRawValue();
    const resolverType = Number(value.resolverType ?? 1);
    const config = this.buildConfigObject(this.resolverConfigRows);
    switch (resolverType) {
      case 1: {
        const field = (config['field'] || '').trim();
        if (!field) {
          this.status = { type: 'error', message: 'Choose the event field that contains the user id.' };
          return null;
        }
        return JSON.stringify(config);
      }
      case 2: {
        const role = (config['role'] || '').trim();
        if (!role) {
          this.status = { type: 'error', message: 'Choose a role.' };
          return null;
        }
        return JSON.stringify(config);
      }
      case 3: {
        const groupCode = (config['groupCode'] || '').trim();
        if (!groupCode) {
          this.status = { type: 'error', message: 'Choose a group.' };
          return null;
        }
        return JSON.stringify(config);
      }
      case 4:
        if (!value.dataSourceId) {
          this.status = { type: 'error', message: 'Choose a SQL data source.' };
          return null;
        }
        return JSON.stringify(config);
      case 5:
        return JSON.stringify(config);
      default:
        return JSON.stringify(config);
    }
  }

  private resetResolverForm(): void {
    this.resolverForm.reset({
      resolverType: 1,
      userIdField: 'userId',
      role: '',
      groupCode: '',
      dataSourceId: ''
    });
    this.resolverMappings = [];
    this.onResolverTypeChange();
  }

  private buildConfigObject(rows: ConfigRow[]): Record<string, string> {
    const config: Record<string, string> = {};
    for (const row of rows) {
      const key = row.key.trim();
      if (!key) {
        continue;
      }
      config[key] = row.value ?? '';
    }
    return config;
  }

  private formatConfigSummary(config: Record<string, string>, fallback: string): string {
    const pairs = Object.entries(config)
      .filter(([key]) => key.trim())
      .map(([key, value]) => `${key}: ${value || '-'}`);
    return pairs.length > 0 ? pairs.join(', ') : fallback;
  }

  private buildPreviewSampleData(): Record<string, string> {
    const sample: Record<string, string> = {};
    for (const row of this.previewRows) {
      const key = row.key.trim();
      if (!key) {
        continue;
      }
      sample[key] = row.value ?? '';
    }
    return sample;
  }

  private syncPreviewRows(): void {
    if (this.previewRows.length > 0) {
      return;
    }
    this.previewRows = this.availableTemplateVariables.map((key) => ({ key, value: this.exampleValueFor(key) }));
  }

  private parsePayloadFieldNames(raw?: string | null): string[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return [];
      }
      return Object.keys(parsed);
    } catch {
      return [];
    }
  }

  private extractPlaceholders(raw?: string | null): string[] {
    if (!raw) {
      return [];
    }
    const matches = raw.match(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g) || [];
    return Array.from(new Set(matches.map((match) => match.replace(/[{}]/g, '').trim()).filter(Boolean)));
  }

  private exampleValueFor(key: string): string {
    const normalized = key.toLowerCase();
    if (normalized.includes('email')) {
      return 'user@example.com';
    }
    if (normalized.includes('phone')) {
      return '+212600000000';
    }
    if (normalized.includes('name')) {
      return 'Soufiane';
    }
    if (normalized.includes('language') || normalized.includes('lang')) {
      return 'en';
    }
    if (normalized.includes('date')) {
      return '2026-06-02';
    }
    if (normalized.includes('amount') || normalized.includes('price')) {
      return '1250';
    }
    if (normalized.includes('id')) {
      return '12345';
    }
    return `sample ${key}`;
  }

  private parseJsonObject(raw?: string | null): Record<string, string> {
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }
      const record: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        record[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
      return record;
    } catch {
      return {};
    }
  }

  private getAudienceSummary(config: Record<string, string>): string {
    if (!config['users']) {
      return 'Selected audience list';
    }
    try {
      const users = JSON.parse(config['users']) as unknown[];
      return `${users.length} selected users`;
    } catch {
      return 'Selected audience list';
    }
  }

  private resetLocaleForm(): void {
    this.editingLocaleId = null;
    this.localeForm.reset({ languageCode: '', title: '', body: '' });
  }
}
