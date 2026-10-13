export interface UserPreference {
  userId: string;
  channelId: number;
  isEnabled: boolean;
  preferredLanguage?: string;
}
