export interface EmailProvider {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  fromAddress: string;
  fromName?: string;
  useSsl: boolean;
  isDefault: boolean;
  isActive: boolean;
  priorityOrder: number;
}
