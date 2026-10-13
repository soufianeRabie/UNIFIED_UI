import { User } from './user.model';

export interface AuthResponse {
  requiresMfa: boolean;
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    mustChangePassword: boolean;
  };
  challenge: any; // or specific type if known
  tenantId?: string;
  user?: User;
  locked?: boolean;
  remainingAttempts?: number;
  mfaRequired?: boolean;
  tenantBranding?: TenantBranding;
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  name?: string;
}
