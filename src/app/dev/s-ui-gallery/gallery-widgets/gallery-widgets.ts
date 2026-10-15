import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SCalendar,
  SDatePicker,
  SField,
  SGrid,
  SHeading,
  SPanel,
  SSelect,
  SStack,
  SText,
} from '@s/ui';
import { type SDateRange, type SSelectOption } from '@s/core';

const ROLES: readonly SSelectOption<string>[] = [
  'Administrator',
  'Auditor',
  'Manager',
  'Operator',
  'Support',
  'Supervisor',
  'Reviewer',
  'Guest',
  'Écrivain',
].map((label) => ({ value: label.toUpperCase(), label }));

/** Gallery section: our own form widgets (ADR 0008) — select, calendar, date and range pickers. */
@Component({
  selector: 'app-gallery-widgets',
  imports: [SCalendar, SDatePicker, SField, SGrid, SHeading, SPanel, SSelect, SStack, SText],
  templateUrl: './gallery-widgets.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryWidgets {
  protected readonly roles = ROLES;
  protected readonly statuses: readonly SSelectOption<string>[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Locked', label: 'Locked' },
    { value: 'Disabled', label: 'Disabled', disabled: true },
  ];

  protected readonly status = signal<string | readonly string[] | null>('Active');
  protected readonly selectedRoles = signal<string | readonly string[] | null>(['AUDITOR']);
  protected readonly day = signal<string | null>('2026-10-15');
  protected readonly period = signal<SDateRange | null>({ start: '2026-10-05', end: '2026-10-12' });
  protected readonly calendarDay = signal<string | null>(null);
}
