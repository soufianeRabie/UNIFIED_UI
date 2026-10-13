export interface NotificationStats {
  total: number;
  unread: number;
  scheduled: number;
  deadLetters: number;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
}
