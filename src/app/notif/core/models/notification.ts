export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  recipientId: string;
  recipientType: string;
  channel: number;
  priority: number;
  status: number;
  createdAt: string;
  sentAt?: string | null;
  readAt?: string | null;
  attachmentFileName?: string | null;
}

export interface NotificationDetail {
  id: string;
  eventTypeCode: string;
  correlationId?: string | null;
  recipientId: string;
  recipientType: string;
  channel: number;
  priority: number;
  status: number;
  title: string;
  body: string;
  isHtml: boolean;
  retryCount: number;
  maxRetries: number;
  sourceEventData?: string | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  attachmentFileName?: string | null;
}
