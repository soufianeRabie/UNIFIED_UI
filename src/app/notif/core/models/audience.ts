export interface AudienceUser {
  userId: string;
  fullName?: string | null;
  email?: string | null;
  isActive?: boolean;
}

export interface AudienceRole {
  roleCode: string;
  roleName: string;
  appCode?: string | null;
  isActive?: boolean;
}

export interface AudienceGroup {
  groupCode: string;
  groupName: string;
  appCode?: string | null;
  isActive?: boolean;
}
