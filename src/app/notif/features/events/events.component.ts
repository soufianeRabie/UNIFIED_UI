import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { PermissionService } from '../../core/services/permission.service';
import { EventsService } from '../../core/services/events.service';
import { NotifConfigService } from '../../core/services/notif-config.service';
import { EventTypesService } from '../../core/services/event-types.service';
import { EventType } from '../../core/models/event-type';
import { PermActionDirective } from '../../../secu/directives/perm-action.directive';
import { formatHttpError, parseJsonRecord } from '../../shared/utils/api-utils';
import { TranslatePipe } from '@ngx-translate/core';

const PAGE_CODE = 'NOTIF_PUBLISH';

@Component({
  selector: 'notif-events',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    DividerModule,
    PermActionDirective,
    TranslatePipe
  ],
  templateUrl: './events.component.html'
})
export class EventsComponent {
  readonly PAGE_CODE = PAGE_CODE;
  readonly perm = inject(PermissionService);
  private readonly service = inject(EventsService);
  private readonly config = inject(NotifConfigService);
  private readonly eventTypesService = inject(EventTypesService);
  private readonly fb = inject(FormBuilder);

  status: { type: 'success' | 'error' | 'info'; message: string } | null = null;
  result: unknown | null = null;
  eventTypes: EventType[] = [];
  eventTypeOptions: { label: string; value: string }[] = [];

  form = this.fb.group({
    tenantId: [this.config.effectiveTenantId],
    eventType: ['', Validators.required],
    data: ['{}'],
    correlationId: [''],
    overrideRecipientId: [''],
    languageCode: [''],
    scheduledAt: ['']
  });

  ngOnInit(): void {
    this.loadEventTypes();
  }

  loadEventTypes(): void {
    this.eventTypesService.list().subscribe({
      next: (items) => {
        this.eventTypes = items;
        this.eventTypeOptions = items.map((item) => ({
          label: `${item.code} · ${item.label}`,
          value: item.code
        }));
      },
      error: (err) => {
        this.status = { type: 'error', message: formatHttpError(err) };
      }
    });
  }

  get selectedEventType(): EventType | undefined {
    const code = this.form.controls.eventType.value || '';
    return this.eventTypes.find((eventType) => eventType.code === code);
  }

  publish(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.status = { type: 'error', message: 'Event type is required.' };
      return;
    }
    const value = this.form.getRawValue();
    try {
      const data = parseJsonRecord(value.data || '{}');
      const payload = {
        tenantId: value.tenantId || undefined,
        eventType: value.eventType ?? '',
        data,
        correlationId: value.correlationId || undefined,
        overrideRecipientId: value.overrideRecipientId || undefined,
        languageCode: value.languageCode || undefined,
        scheduledAt: value.scheduledAt || undefined
      };
      this.service.publish(payload).subscribe({
        next: (result) => {
          this.result = result;
          this.status = { type: 'success', message: 'Event published.' };
        },
        error: (err) => {
          this.status = { type: 'error', message: formatHttpError(err) };
        }
      });
    } catch (err) {
      this.status = { type: 'error', message: err instanceof Error ? err.message : 'Invalid JSON.' };
    }
  }
}


