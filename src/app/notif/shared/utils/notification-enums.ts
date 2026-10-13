/**
 * Single source of truth for notification enum labels, mirroring the backend enums
 * (NotificationChannel, NotificationStatus, NotificationPriority). Components use
 * these helpers instead of hardcoding numeric values inline.
 */

export const NOTIFICATION_CHANNELS: Record<number, string> = {
  1: 'In-App',
  2: 'Email',
  3: 'SMS',
  4: 'Web Push'
};

export const NOTIFICATION_STATUSES: Record<number, string> = {
  0: 'Pending',
  1: 'Sent',
  2: 'Read',
  3: 'Failed',
  4: 'Cancelled'
};

export const NOTIFICATION_PRIORITIES: Record<number, string> = {
  0: 'Low',
  1: 'Normal',
  2: 'High',
  3: 'Critical'
};

/** Visual severity for a status, aligned with PrimeNG p-tag severities. */
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export const STATUS_SEVERITY: Record<number, TagSeverity> = {
  0: 'warn',
  1: 'info',
  2: 'success',
  3: 'danger',
  4: 'secondary'
};

export function channelLabel(value: number): string {
  return NOTIFICATION_CHANNELS[value] ?? `Channel ${value}`;
}

export function statusLabel(value: number): string {
  return NOTIFICATION_STATUSES[value] ?? `Status ${value}`;
}

export function priorityLabel(value: number): string {
  return NOTIFICATION_PRIORITIES[value] ?? `Priority ${value}`;
}

export function statusSeverity(value: number): TagSeverity {
  return STATUS_SEVERITY[value] ?? 'secondary';
}
