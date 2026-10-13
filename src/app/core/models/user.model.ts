import { Tenant } from './tenant.model';
import { Branch } from './branch.model';

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
  enabled?: boolean;
  role?: string;
  roles?: string[];
  tenant?: Tenant;
  branch?: Branch | null;
  assignedBranch?: Branch | null;
  branches?: Branch[];
  createdAt?: string;
  updatedAt?: string;
}
