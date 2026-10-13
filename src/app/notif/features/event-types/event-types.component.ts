import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../../core/services/permission.service';
import { EventTypesService } from '../../core/services/event-types.service';
import { EventType } from '../../core/models/event-type';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { formatHttpError } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'NOTIF_EVENTS';

@Component({
  selector: 'notif-event-types',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TableModule,
    TagModule,
    PermActionDirective,
    TranslatePipe
  ],
  templateUrl: './event-types.component.html'
})
export class EventTypesComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly service = inject(EventTypesService);
  private readonly fb = inject(FormBuilder);

  items: EventType[] = [];
  selected: EventType | null = null;
  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  payloadFields: { name: string; type: string }[] = [];
  payloadTypeOptions = [
    { label: 'string', value: 'string' },
    { label: 'number', value: 'number' },
    { label: 'boolean', value: 'boolean' },
    { label: 'date', value: 'date' },
    { label: 'object', value: 'object' }
  ];

  form = this.fb.group({
    code: ['', [Validators.required]],
    label: ['', [Validators.required]],
    sourceSystem: [''],
    expectedPayload: ['{}'],
    isActive: [true]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.status = { type: 'info', message: 'Loading event types...' };
    this.service.list().subscribe({
      next: (items) => {
        this.items = items;
        this.status = null;
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  edit(item: EventType): void {
    this.selected = item;
    this.form.patchValue({
      code: item.code,
      label: item.label,
      sourceSystem: item.sourceSystem || '',
      expectedPayload: item.expectedPayload || '{}',
      isActive: item.isActive ?? true
    });
    this.payloadFields = this.parseExpectedPayload(item.expectedPayload);
  }

  resetForm(): void {
    this.selected = null;
    this.form.reset({
      code: '',
      label: '',
      sourceSystem: '',
      expectedPayload: '{}',
      isActive: true
    });
    this.payloadFields = [];
  }

  save(): void {
    if (this.form.invalid) {
      this.status = { type: 'error', message: 'Please fill in the required fields.' };
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const expectedPayload = this.buildExpectedPayload();
    if (this.selected) {
      const payload = {
        label: value.label ?? '',
        sourceSystem: value.sourceSystem ?? undefined,
        expectedPayload,
        isActive: value.isActive ?? true
      };
      this.service.update(this.selected.id, payload).subscribe({
        next: () => {
          this.status = { type: 'success', message: 'Event type updated.' };
          this.load();
          this.resetForm();
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
        }
      });
      return;
    }

    const payload = {
      code: value.code ?? '',
      label: value.label ?? '',
      sourceSystem: value.sourceSystem ?? undefined,
      expectedPayload,
      isActive: value.isActive ?? true
    };
    this.service.create(payload).subscribe({
      next: () => {
        this.status = { type: 'success', message: 'Event type created.' };
        this.load();
        this.resetForm();
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  addPayloadField(): void {
    this.payloadFields = [...this.payloadFields, { name: '', type: 'string' }];
  }

  removePayloadField(index: number): void {
    this.payloadFields = this.payloadFields.filter((_, i) => i !== index);
  }

  getPayloadFieldType(raw: string | null | undefined, fieldName: string): string {
    return this.parseExpectedPayload(raw).find((field) => field.name === fieldName)?.type || 'string';
  }

  private parseExpectedPayload(raw?: string | null): { name: string; type: string }[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return [];
      }
      return Object.keys(parsed).map((key) => ({
        name: key,
        type: typeof parsed[key] === 'string' ? parsed[key] : 'string'
      }));
    } catch {
      return [];
    }
  }

  private buildExpectedPayload(): string {
    const payload: Record<string, string> = {};
    for (const field of this.payloadFields) {
      if (!field.name) {
        continue;
      }
      payload[field.name] = field.type || 'string';
    }
    return JSON.stringify(payload);
  }

  getPayloadFieldNames(raw?: string | null): string[] {
    return this.parseExpectedPayload(raw).map((field) => field.name).filter(Boolean);
  }
}


