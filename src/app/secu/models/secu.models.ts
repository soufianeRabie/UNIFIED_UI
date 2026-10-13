// ─── Shared ──────────────────────────────────────────────────────────────────
export interface PagedResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalRecords: number;
  totalPages: number;
}

export interface PagedQuery {
  page?: number;
  size?: number;
  search?: string;
  includeInactive?: boolean;
}

export type SecuPageType = 'MODEL' | 'PAGE';

// ─── Response DTOs ────────────────────────────────────────────────────────────
export interface SecuUserDto {
  idUser: string; // Guid
  username: string;
  fullName: string;
  email: string | null;
  tenantId: string | null;
  isActive: boolean;
  externalId: string | null;
  createdAt: string; // DateTimeOffset
  updatedAt: string | null; // DateTimeOffset?
}

export interface RefCompanyDto {
  companyCode: string;
  companyName: string;
  parentCompanyCode: string | null;
  isParent: boolean;
  companyTypeId: number | null;
  companyTypeCode: string | null;
  companyTypeName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface RefCompanyTypeDto {
  idCompanyType: number;
  typeCode: string;
  typeName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SecuRoleDto {
  idRole: number;
  roleCode: string;
  roleName: string;
  appCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface SecuGroupDto {
  idGroup: number;
  groupCode: string;
  groupName: string;
  appCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface SecuActionDto {
  idAction: number;
  actionCode: string;
  actionName: string;
  isActive: boolean;
}

export interface SecuPageDto {
  idPage: number;
  pageCode: string;
  pageName: string;
  pageUrl: string | null;
  icon: string | null;
  pageType: SecuPageType | null;
  parentId: number | null;
  sortOrder: number | null;
  appCode: string;
  isActive: boolean;
  children: SecuPageDto[];
}

export interface SecuPageActionDto {
  idPageAction: number;
  pageId: number;
  pageCode: string;
  pageName: string;
  actionId: number;
  actionCode: string;
  actionName: string;
  isActive: boolean;
}

export interface SecuFlatActionDto {
  idPageAction: number;
  idAction: number;
  actionCode: string;
  actionName: string;
  actionActive: boolean;
  idPage: number;
  pageCode: string;
  pageName: string;
  pageActionActive: boolean;
}

export interface SecuPermissionDto {
  idPermission: number;
  roleId: number;
  roleCode: string;
  pageActionId: number;
  pageCode: string;
  pageName: string;
  actionCode: string;
  actionName: string;
  isActive: boolean;
  grantedById: string | null; // Guid?
  grantedAt: string; // DateTimeOffset
}

export interface SecuUserGroupDto {
  idUserGroup: number;
  userId: string; // Guid
  username: string;
  groupId: number;
  groupCode: string;
  groupName: string;
  isActive: boolean;
  grantedById: string | null; // Guid?
  grantedAt: string; // DateTimeOffset
  expiresAt: string | null; // DateTimeOffset?
}

export interface SecuGroupRoleDto {
  idGroupRole: number;
  roleId: number;
  groupId: number;
  groupCode: string;
  groupName: string;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  grantedById: string | null; // Guid?
  grantedAt: string; // DateTimeOffset
}

export interface SecuUserPermissionDto {
  idUserPermission: number;
  userId: string; // Guid
  username: string;
  pageActionId: number;
  pageCode: string;
  pageName: string;
  actionCode: string;
  actionName: string;
  isActive: boolean;
  grantedById: string | null; // Guid?
  grantedAt: string; // DateTimeOffset
  expiresAt: string | null; // DateTimeOffset?
}

export interface SecuAuditFieldDto {
  idField: number;
  auditEntityId: number;
  fieldId: number;
  fieldName: string;
  columnName: string | null;
  isActive: boolean;
}

export interface SecuEntityDto {
  idEntity: number;
  entityName: string;
  tableName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SecuFieldDto {
  idField: number;
  entityId: number;
  fieldName: string;
  columnName: string | null;
  isActive: boolean;
}

export interface SecuAuditEntityDto {
  idEntity: number;
  entityId: number;
  entityName: string;
  tableName: string | null;
  isActive: boolean;
  createdAt: string;
  fields: SecuAuditFieldDto[];
}

export interface SecuAuditLogFieldDto {
  idLogField: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface SecuAuditLogDto {
  idLog: number;
  entityName: string;
  tableName: string | null;
  operation: string;
  recordId: string | null;
  performedBy: string | null; // alias old style
  performedById: string | null; // Guid?
  tenantId: string | null;
  performedAt: string; // DateTimeOffset
  ipAddress: string | null;
  correlationId: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  fields: SecuAuditLogFieldDto[];
}

export interface SecuTokenRevocationDto {
  idRevocation: number;
  jti: string;
  tokenType: string;
  subject: string | null;
  tenantId: string | null;
  revokedById: string | null; // Guid?
  revokedAt: string; // DateTimeOffset
  expiresAt: string | null; // DateTimeOffset?
  reason: string | null;
}

export interface SecuTokenSessionDto {
  idSession: string;
  userId: string;
  username: string;
  fullName: string;
  tenantId: string | null;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  source: string; // 'jwt' | 'oidc'
}

export interface SecuPolicyRuleDto {
  idRule: number;
  policyId: number;
  ruleType: string;
  ruleKey: string | null;
  ruleValue: string;
  isActive: boolean;
}

export interface SecuPolicyDto {
  idPolicy: number;
  policyCode: string;
  resource: string;
  action: string;
  effect: string;
  description: string | null;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  rules: SecuPolicyRuleDto[];
}

export interface SecuPolicyDecisionDto {
  allowed: boolean;
  matchedAllowPolicies: string[];
  matchedDenyPolicies: string[];
}

export interface SecuDataFilterRuleDto {
  idRule: number;
  filterId: number;
  fieldId: number;
  fieldName: string;
  columnName: string | null;
  operator: string;
  value: string | null;
  value2: string | null;
  valueType: string | null;
  conjunction: string;
  groupIndex: number;
  isActive: boolean;
}

export interface SecuDataFilterTargetDto {
  idTarget: number;
  filterId: number;
  targetType: string;
  targetId: string;
  isActive: boolean;
}

export interface SecuDataFilterDto {
  idFilter: number;
  filterCode: string;
  entityName: string;
  description: string | null;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  rules: SecuDataFilterRuleDto[];
  targets: SecuDataFilterTargetDto[];
}

export interface SecuMenuItemDto {
  idPage: number;
  pageCode: string;
  pageName: string;
  pageUrl: string | null;
  icon: string | null;
  pageType: string | null;
  sortOrder: number | null;
  actions: string[];
  children: SecuMenuItemDto[];
}

export interface SecuCheckResponse {
  allowed: boolean;
}




export interface CreateSecuUserRequest {
  username: string;
  fullName: string;
  email?: string | null;
  externalId?: string | null;
  tenantId?: string | null;
  password?: string | null;
  mustChangePassword?: boolean | null;
}

export interface UpdateSecuUserRequest {
  username: string;
  fullName: string;
  email?: string | null;
  externalId?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
}

export interface CreateSecuRoleRequest {
  roleCode: string;
  roleName: string;
}

export interface UpdateSecuRoleRequest extends CreateSecuRoleRequest {
  isActive?: boolean | null;
}

export interface CreateSecuGroupRequest {
  groupCode: string;
  groupName: string;
}

export interface UpdateSecuGroupRequest extends CreateSecuGroupRequest {
  isActive?: boolean | null;
}

export interface CreateSecuPageRequest {
  pageCode: string;
  pageName: string;
  pageUrl?: string | null;
  icon?: string | null;
  pageType?: string | null;
  parentId?: number | null;
  sortOrder?: number | null;
}

export interface UpdateSecuPageRequest extends CreateSecuPageRequest {
  isActive?: boolean | null;
}

export interface CreateSecuActionRequest {
  actionCode: string;
  actionName: string;
}

export interface UpdateSecuActionRequest extends CreateSecuActionRequest {
  isActive?: boolean | null;
}

export interface CreateSecuPageActionRequest {
  pageId: number;
  actionId: number;
}

export interface CreateSecuPermissionRequest {
  roleId: number;
  pageActionId: number;
}

export interface AssignRoleIdsRequest {
  roleIds: number[];
}

export interface AssignGroupIdsRequest {
  groupIds: number[];
}

export interface AssignPageActionIdsRequest {
  pageActionIds: number[];
}

export interface CreateSecuAuditEntityRequest {
  entityId: number;
  isActive?: boolean | null;
}

export interface UpdateSecuAuditEntityRequest {
  isActive?: boolean | null;
}

export interface CreateSecuAuditFieldRequest {
  fieldId: number;
  isActive?: boolean | null;
}

export interface UpdateSecuAuditFieldRequest {
  isActive?: boolean | null;
}

export interface CreateSecuPolicyRequest {
  policyCode: string;
  resource: string;
  action: string;
  effect: string;
  description?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
}

export interface UpdateSecuPolicyRequest {
  policyCode: string;
  resource: string;
  action: string;
  effect?: string | null;
  description?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
}

export interface CreateSecuPolicyRuleRequest {
  ruleType: string;
  ruleKey?: string | null;
  ruleValue: string;
  isActive?: boolean | null;
}

export interface UpdateSecuPolicyRuleRequest {
  ruleType?: string | null;
  ruleKey?: string | null;
  ruleValue: string;
  isActive?: boolean | null;
}

export interface EvaluateSecuPolicyRequest {
  resource: string;
  action: string;
  tenantId?: string | null;
  claims?: Record<string, string> | null;
}

export interface RevokeSecuTokenRequest {
  token?: string | null;
  jti?: string | null;
  expiresAt?: string | null; // DateTimeOffset?
  tokenType?: string | null;
  subject?: string | null;
  tenantId?: string | null;
  reason?: string | null;
}

export interface RevokeSecuUserSessionsRequest {
  reason?: string | null;
}

export interface CreateSecuDataFilterRequest {
  filterCode: string;
  entityName: string;
  description?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
}

export interface UpdateSecuDataFilterRequest {
  filterCode: string;
  entityName: string;
  description?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
}

export interface CreateSecuDataFilterRuleRequest {
  fieldId: number;
  operator: string;
  value?: string | null;
  value2?: string | null;
  valueType?: string | null;
  conjunction?: string | null;
  groupIndex?: number | null;
  isActive?: boolean | null;
}

export interface UpdateSecuDataFilterRuleRequest {
  fieldId?: number | null;
  operator?: string | null;
  value?: string | null;
  value2?: string | null;
  valueType?: string | null;
  conjunction?: string | null;
  groupIndex?: number | null;
  isActive?: boolean | null;
}

export interface CreateSecuDataFilterTargetRequest {
  targetType: string;
  targetId: string;
  isActive?: boolean | null;
}

export interface UpdateSecuDataFilterTargetRequest {
  targetType?: string | null;
  targetId: string;
  isActive?: boolean | null;
}







// ─── Audit ────────────────────────────────────────────────────────────────────

export interface SecuAuditLogFieldDto {
  idLogField: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
}



export interface SecuAuditFieldDto {
  idField: number;
  auditEntityId: number;
  fieldId: number;
  fieldName: string;
  columnName: string | null;
  isActive: boolean;
}

export interface SecuAuditEntityDto {
  idEntity: number;
  entityId: number;
  entityName: string;
  tableName: string | null;
  isActive: boolean;
  createdAt: string;
  fields: SecuAuditFieldDto[];
}

// ─── Companies ────────────────────────────────────────────────────────────────

export interface RefCompanyTypeDto {
  idCompanyType: number;
  typeCode: string;
  typeName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface RefCompanyDto {
  companyCode: string;
  companyName: string;
  parentCompanyCode: string | null;
  isParent: boolean;
  companyTypeId: number | null;
  companyTypeCode: string | null;
  companyTypeName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export interface SecuPolicyRuleDto {
  idRule: number;
  policyId: number;
  ruleType: string;
  ruleKey: string | null;
  ruleValue: string;
  isActive: boolean;
}

export interface SecuPolicyDto {
  idPolicy: number;
  policyCode: string;
  resource: string;
  action: string;
  effect: string;
  description: string | null;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  rules: SecuPolicyRuleDto[];
}

export interface SecuPolicyDecisionDto {
  allowed: boolean;
  matchedAllowPolicies: string[];
  matchedDenyPolicies: string[];
}

// ─── Token Revocations ────────────────────────────────────────────────────────

export interface SecuTokenRevocationDto {
  idRevocation: number;
  jti: string;
  tokenType: string;
  subject: string | null;
  tenantId: string | null;
  revokedById: string | null;
  revokedAt: string;
  expiresAt: string | null;
  reason: string | null;
}

export interface SecuTokenSessionDto {
  idSession: string;
  userId: string;
  username: string;
  fullName: string;
  tenantId: string | null;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  source: string; // 'jwt' | 'oidc'
}

// ─── Data Filters ─────────────────────────────────────────────────────────────

export interface SecuDataFilterRuleDto {
  idRule: number;
  filterId: number;
  fieldId: number;
  fieldName: string;
  columnName: string | null;
  operator: string;
  value: string | null;
  value2: string | null;
  valueType: string | null;
  conjunction: string;
  groupIndex: number;
  isActive: boolean;
}

export interface SecuDataFilterTargetDto {
  idTarget: number;
  filterId: number;
  targetType: string;
  targetId: string;
  isActive: boolean;
}

export interface SecuDataFilterDto {
  idFilter: number;
  filterCode: string;
  entityName: string;
  description: string | null;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
  rules: SecuDataFilterRuleDto[];
  targets: SecuDataFilterTargetDto[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthSettingsDto {
  idAuthSettings: number;
  tenantId: string | null;
  allowPasswordLogin: boolean;
  requireMfa: boolean;
  enableTotp: boolean;
  enableEmailOtp: boolean;
  enableRecoveryCodes: boolean;
  emailOtpTtlMinutes: number;
  emailOtpMaxAttempts: number;
  emailOtpMaxPerHour: number;
  resetTokenTtlMinutes: number;
  resetCodeTtlMinutes: number;
  resetMaxRequestsPerHour: number;
  passwordMinLength: number;
  passwordRequireUpper: boolean;
  passwordRequireLower: boolean;
  passwordRequireDigit: boolean;
  passwordRequireNonAlphanumeric: boolean;
  lockoutEnabled: boolean;
  lockoutMaxAttempts: number;
  lockoutDurationMinutes: number;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  bindResetToIp: boolean;
  bindResetToUserAgent: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertAuthSettingsRequest {
  tenantId?: string | null;
  allowPasswordLogin?: boolean | null;
  requireMfa?: boolean | null;
  enableTotp?: boolean | null;
  enableEmailOtp?: boolean | null;
  enableRecoveryCodes?: boolean | null;
  emailOtpTtlMinutes?: number | null;
  emailOtpMaxAttempts?: number | null;
  emailOtpMaxPerHour?: number | null;
  resetTokenTtlMinutes?: number | null;
  resetCodeTtlMinutes?: number | null;
  resetMaxRequestsPerHour?: number | null;
  passwordMinLength?: number | null;
  passwordRequireUpper?: boolean | null;
  passwordRequireLower?: boolean | null;
  passwordRequireDigit?: boolean | null;
  passwordRequireNonAlphanumeric?: boolean | null;
  lockoutEnabled?: boolean | null;
  lockoutMaxAttempts?: number | null;
  lockoutDurationMinutes?: number | null;
  accessTokenTtlMinutes?: number | null;
  refreshTokenTtlDays?: number | null;
  bindResetToIp?: boolean | null;
  bindResetToUserAgent?: boolean | null;
}

export interface TotpSetupDto {
  secret: string;
  otpauthUri: string;
}

export interface RecoveryCodesDto {
  codes: string[];
}

export interface AuthActionResultDto {
  message: string;
}

export interface PasswordResetRequest {
  email: string;
  tenantId?: string | null;
}

export interface PasswordResetVerifyRequest {
  sid: string;
  code: string;
  newPassword: string;
}

export interface TotpVerifyRequest {
  code: string;
}

export interface EmailOtpRequest {
  enabled: boolean;
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateRefCompanyTypeRequest {
  typeCode: string;
  typeName: string;
  isActive?: boolean;
}
export interface UpdateRefCompanyTypeRequest {
  typeName: string;
  isActive?: boolean;
}

export interface CreateRefCompanyRequest {
  companyCode: string;
  companyName: string;
  parentCompanyCode?: string | null;
  companyTypeId?: number | null;
  isParent?: boolean;
  isActive?: boolean;
}
export interface UpdateRefCompanyRequest {
  companyName: string;
  parentCompanyCode?: string | null;
  companyTypeId?: number | null;
  isParent?: boolean;
  isActive?: boolean;
}


export interface UpdateSecuUserRequest {
  username: string;
  fullName: string;
  email?: string | null;
  externalId?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
}
