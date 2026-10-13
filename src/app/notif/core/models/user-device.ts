export interface UserDevice {
  id: string;
  userId: string;
  token: string;
  platform: string;
  deviceName?: string;
  isActive?: boolean;
  seenAt?: string;
}
