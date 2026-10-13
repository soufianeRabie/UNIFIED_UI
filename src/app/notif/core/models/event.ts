export interface NotificationEvent {
  tenantId?: string;
  eventType: string;
  data: Record<string, string>;
  overrideRecipientId?: string | null;
  languageCode?: string | null;
  correlationId?: string | null;
  scheduledAt?: string | null;
}
