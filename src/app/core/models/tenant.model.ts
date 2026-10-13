export interface Tenant {
  id: string;
  code: string;
  name: string;
  active: boolean;
  logoUrl?: string;
  primaryColor?: string;
}
