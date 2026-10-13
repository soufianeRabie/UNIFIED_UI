export interface SmsProvider {
  id: string;
  name: string;
  providerType: string;
  apiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  senderId?: string;
  isDefault: boolean;
  isActive: boolean;
  priorityOrder: number;
}
