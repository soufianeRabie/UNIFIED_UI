export interface DeadLetterItem {
  id: string;
  notificationId: string;
  eventTypeCode: string;
  correlationId?: string | null;
  channel: number;
  recipientId: string;
  lastError?: string | null;
  totalAttempts: number;
  landedAt: string;
  isResolved: boolean;
  reviewedAt?: string | null;
  replayedAt?: string | null;
}
