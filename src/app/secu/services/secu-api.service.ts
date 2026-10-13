import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getAppConfig } from '../../core/config/app-config';
import {
  PagedResponse,
  PagedQuery,
  SecuUserDto,
  RefCompanyDto,
  RefCompanyTypeDto,
  SecuRoleDto,
  SecuGroupDto,
  SecuActionDto,
  SecuPageDto,
  SecuPageActionDto,
  SecuFlatActionDto,
  SecuPermissionDto,
  SecuUserGroupDto,
  SecuGroupRoleDto,
  SecuUserPermissionDto,
  SecuAuditEntityDto,
  SecuAuditFieldDto,
  SecuEntityDto,
  SecuFieldDto,
  SecuAuditLogDto,
  SecuTokenRevocationDto,
  SecuTokenSessionDto,
  SecuPolicyDto,
  SecuPolicyRuleDto,
  SecuPolicyDecisionDto,
  SecuDataFilterDto,
  SecuDataFilterRuleDto,
  SecuDataFilterTargetDto,
  SecuMenuItemDto,
  SecuCheckResponse,
  CreateRefCompanyRequest,
  UpdateRefCompanyRequest,
  CreateRefCompanyTypeRequest,
  UpdateRefCompanyTypeRequest,
  CreateSecuUserRequest,
  UpdateSecuUserRequest,
  CreateSecuRoleRequest,
  UpdateSecuRoleRequest,
  CreateSecuGroupRequest,
  UpdateSecuGroupRequest,
  CreateSecuPageRequest,
  UpdateSecuPageRequest,
  CreateSecuActionRequest,
  UpdateSecuActionRequest,
  CreateSecuPageActionRequest,
  CreateSecuPermissionRequest,
  AssignRoleIdsRequest,
  AssignGroupIdsRequest,
  AssignPageActionIdsRequest,
  CreateSecuAuditEntityRequest,
  UpdateSecuAuditEntityRequest,
  CreateSecuAuditFieldRequest,
  UpdateSecuAuditFieldRequest,
  CreateSecuPolicyRequest,
  UpdateSecuPolicyRequest,
  CreateSecuPolicyRuleRequest,
  UpdateSecuPolicyRuleRequest,
  EvaluateSecuPolicyRequest,
  RevokeSecuTokenRequest,
  RevokeSecuUserSessionsRequest,
  CreateSecuDataFilterRequest,
  UpdateSecuDataFilterRequest,
  CreateSecuDataFilterRuleRequest,
  UpdateSecuDataFilterRuleRequest,
  CreateSecuDataFilterTargetRequest,
  UpdateSecuDataFilterTargetRequest,
  AuthSettingsDto,
  UpsertAuthSettingsRequest,
  TotpSetupDto,
  RecoveryCodesDto,
  AuthActionResultDto,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  TotpVerifyRequest,
  EmailOtpRequest,
} from '../models/secu.models';

@Injectable({ providedIn: 'root' })
export class SecuApiService {
  private readonly base = `${getAppConfig().apiUrl}/secu`;
  private readonly authBase = `${getAppConfig().apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  private params(query: PagedQuery & Record<string, any> = {}): HttpParams {
    let p = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers(q: PagedQuery = {}): Observable<PagedResponse<SecuUserDto>> {
    return this.http.get<PagedResponse<SecuUserDto>>(`${this.base}/users`, {
      params: this.params(q),
    });
  }

  getUser(id: string): Observable<SecuUserDto> {
    return this.http.get<SecuUserDto>(`${this.base}/users/${id}`);
  }

  createUser(body: CreateSecuUserRequest): Observable<SecuUserDto> {
    return this.http.post<SecuUserDto>(`${this.base}/users`, body);
  }

  updateUser(id: string, body: UpdateSecuUserRequest): Observable<SecuUserDto> {
    return this.http.put<SecuUserDto>(`${this.base}/users/${id}`, body);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  getUserRoles(id: string, q: PagedQuery = {}): Observable<PagedResponse<SecuRoleDto>> {
    return this.http.get<PagedResponse<SecuRoleDto>>(`${this.base}/users/${id}/roles`, {
      params: this.params(q),
    });
  }

  assignUserRoles(id: string, body: AssignRoleIdsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/roles`, body);
  }

  getUserGroups(id: string, q: PagedQuery = {}): Observable<PagedResponse<SecuUserGroupDto>> {
    return this.http.get<PagedResponse<SecuUserGroupDto>>(`${this.base}/users/${id}/groups`, {
      params: this.params(q),
    });
  }

  assignUserGroups(id: string, body: AssignGroupIdsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/groups`, body);
  }

  getUserPermissions(
    id: string,
    q: PagedQuery = {},
  ): Observable<PagedResponse<SecuUserPermissionDto>> {
    return this.http.get<PagedResponse<SecuUserPermissionDto>>(
      `${this.base}/users/${id}/permissions`,
      { params: this.params(q) },
    );
  }

  assignUserPermissions(id: string, body: AssignPageActionIdsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/permissions`, body);
  }

  // ── Roles ──────────────────────────────────────────────────────────────────
  getRoles(q: PagedQuery = {}): Observable<PagedResponse<SecuRoleDto>> {
    return this.http.get<PagedResponse<SecuRoleDto>>(`${this.base}/roles`, {
      params: this.params(q),
    });
  }

  createRole(body: CreateSecuRoleRequest): Observable<SecuRoleDto> {
    return this.http.post<SecuRoleDto>(`${this.base}/roles`, body);
  }

  updateRole(id: number, body: UpdateSecuRoleRequest): Observable<SecuRoleDto> {
    return this.http.put<SecuRoleDto>(`${this.base}/roles/${id}`, body);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/roles/${id}`);
  }

  getRolePermissions(
    roleId: number,
    q: PagedQuery = {},
  ): Observable<PagedResponse<SecuPermissionDto>> {
    return this.http.get<PagedResponse<SecuPermissionDto>>(
      `${this.base}/roles/${roleId}/permissions`,
      { params: this.params(q) },
    );
  }

  // ── Groups ─────────────────────────────────────────────────────────────────
  getGroups(q: PagedQuery = {}): Observable<PagedResponse<SecuGroupDto>> {
    return this.http.get<PagedResponse<SecuGroupDto>>(`${this.base}/groups`, {
      params: this.params(q),
    });
  }

  createGroup(body: CreateSecuGroupRequest): Observable<SecuGroupDto> {
    return this.http.post<SecuGroupDto>(`${this.base}/groups`, body);
  }

  updateGroup(id: number, body: UpdateSecuGroupRequest): Observable<SecuGroupDto> {
    return this.http.put<SecuGroupDto>(`${this.base}/groups/${id}`, body);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/groups/${id}`);
  }

  getGroupRoles(groupId: number, q: PagedQuery = {}): Observable<PagedResponse<SecuGroupRoleDto>> {
    return this.http.get<PagedResponse<SecuGroupRoleDto>>(`${this.base}/groups/${groupId}/roles`, {
      params: this.params(q),
    });
  }

  assignGroupRoles(groupId: number, body: AssignRoleIdsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/groups/${groupId}/roles`, body);
  }

  // ── Pages ──────────────────────────────────────────────────────────────────
  getPages(q: PagedQuery = {}): Observable<PagedResponse<SecuPageDto>> {
    return this.http.get<PagedResponse<SecuPageDto>>(`${this.base}/pages`, {
      params: this.params(q),
    });
  }

  createPage(body: CreateSecuPageRequest): Observable<SecuPageDto> {
    return this.http.post<SecuPageDto>(`${this.base}/pages`, body);
  }

  updatePage(id: number, body: UpdateSecuPageRequest): Observable<SecuPageDto> {
    return this.http.put<SecuPageDto>(`${this.base}/pages/${id}`, body);
  }

  deletePage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pages/${id}`);
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  getActions(
    q: PagedQuery & { pageId?: number } = {},
  ): Observable<PagedResponse<SecuFlatActionDto>> {
    return this.http.get<PagedResponse<SecuFlatActionDto>>(`${this.base}/actions`, {
      params: this.params(q),
    });
  }

  getActionsCatalog(q: PagedQuery = {}): Observable<PagedResponse<SecuActionDto>> {
    return this.http.get<PagedResponse<SecuActionDto>>(`${this.base}/actions/catalog`, {
      params: this.params(q),
    });
  }

  createAction(body: CreateSecuActionRequest): Observable<SecuActionDto> {
    return this.http.post<SecuActionDto>(`${this.base}/actions`, body);
  }

  updateAction(id: number, body: UpdateSecuActionRequest): Observable<SecuActionDto> {
    return this.http.put<SecuActionDto>(`${this.base}/actions/${id}`, body);
  }

  deleteAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/actions/${id}`);
  }

  // ── Page Actions ───────────────────────────────────────────────────────────
  getPageActions(
    q: PagedQuery & { pageId?: number } = {},
  ): Observable<PagedResponse<SecuPageActionDto>> {
    return this.http.get<PagedResponse<SecuPageActionDto>>(`${this.base}/page-actions`, {
      params: this.params(q),
    });
  }

  createPageAction(body: CreateSecuPageActionRequest): Observable<SecuPageActionDto> {
    return this.http.post<SecuPageActionDto>(`${this.base}/page-actions`, body);
  }

  deletePageAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/page-actions/${id}`);
  }

  // ── Permissions ────────────────────────────────────────────────────────────
  createPermission(body: CreateSecuPermissionRequest): Observable<SecuPermissionDto> {
    return this.http.post<SecuPermissionDto>(`${this.base}/permissions`, body);
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/permissions/${id}`);
  }

  // ── Runtime ────────────────────────────────────────────────────────────────
  checkPermission(page: string, action: string): Observable<SecuCheckResponse> {
    return this.http.get<SecuCheckResponse>(`${this.base}/check`, { params: { page, action } });
  }

  getMenu(): Observable<SecuMenuItemDto[]> {
    return this.http.get<SecuMenuItemDto[]>(`${this.base}/me/menu`);
  }

  // ── Audit ──────────────────────────────────────────────────────────────────
  getAuditLogs(
    q: {
      search?: string;
      tableName?: string;
      operation?: string;
      tenantId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<SecuAuditLogDto>> {
    return this.http.get<PagedResponse<SecuAuditLogDto>>(`${this.base}/audit`, {
      params: this.params(q),
    });
  }

  // ─── Audit Entities ───────────────────────────────────────────────────────
  getEntities(q: PagedQuery = {}): Observable<PagedResponse<SecuEntityDto>> {
    return this.http.get<PagedResponse<SecuEntityDto>>(`${this.base}/entities`, {
      params: this.params(q),
    });
  }

  getFields(
    q: PagedQuery & { entityId?: number } = {},
  ): Observable<PagedResponse<SecuFieldDto>> {
    return this.http.get<PagedResponse<SecuFieldDto>>(`${this.base}/fields`, {
      params: this.params(q),
    });
  }

  getEntityFields(entityId: number, q: PagedQuery = {}): Observable<PagedResponse<SecuFieldDto>> {
    return this.http.get<PagedResponse<SecuFieldDto>>(`${this.base}/entities/${entityId}/fields`, {
      params: this.params(q),
    });
  }

  getAuditEntities(q: PagedQuery = {}): Observable<PagedResponse<SecuAuditEntityDto>> {
    return this.http.get<PagedResponse<SecuAuditEntityDto>>(`${this.base}/audit/entities`, {
      params: this.params(q),
    });
  }
  createAuditEntity(body: CreateSecuAuditEntityRequest): Observable<SecuAuditEntityDto> {
    return this.http.post<SecuAuditEntityDto>(`${this.base}/audit/entities`, body);
  }
  updateAuditEntity(
    id: number,
    body: UpdateSecuAuditEntityRequest,
  ): Observable<SecuAuditEntityDto> {
    return this.http.put<SecuAuditEntityDto>(`${this.base}/audit/entities/${id}`, body);
  }
  deleteAuditEntity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/audit/entities/${id}`);
  }
  getAuditEntityFields(
    entityId: number,
    q: PagedQuery = {},
  ): Observable<PagedResponse<SecuAuditFieldDto>> {
    return this.http.get<PagedResponse<SecuAuditFieldDto>>(
      `${this.base}/audit/entities/${entityId}/fields`,
      { params: this.params(q) },
    );
  }
  createAuditField(
    entityId: number,
    body: CreateSecuAuditFieldRequest,
  ): Observable<SecuAuditFieldDto> {
    return this.http.post<SecuAuditFieldDto>(
      `${this.base}/audit/entities/${entityId}/fields`,
      body,
    );
  }
  updateAuditField(id: number, body: UpdateSecuAuditFieldRequest): Observable<SecuAuditFieldDto> {
    return this.http.put<SecuAuditFieldDto>(`${this.base}/audit/fields/${id}`, body);
  }
  deleteAuditField(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/audit/fields/${id}`);
  }

  // ─── Companies ────────────────────────────────────────────────────────────
  getCompanies(q: PagedQuery = {}): Observable<PagedResponse<RefCompanyDto>> {
    return this.http.get<PagedResponse<RefCompanyDto>>(`${this.base}/companies`, {
      params: this.params(q),
    });
  }
  getCompany(code: string): Observable<RefCompanyDto> {
    return this.http.get<RefCompanyDto>(`${this.base}/companies/${code}`);
  }
  createCompany(body: CreateRefCompanyRequest): Observable<RefCompanyDto> {
    return this.http.post<RefCompanyDto>(`${this.base}/companies`, body);
  }
  updateCompany(code: string, body: UpdateRefCompanyRequest): Observable<RefCompanyDto> {
    return this.http.put<RefCompanyDto>(`${this.base}/companies/${code}`, body);
  }
  deleteCompany(code: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/companies/${code}`);
  }
  getCompanyTypes(q: PagedQuery = {}): Observable<PagedResponse<RefCompanyTypeDto>> {
    return this.http.get<PagedResponse<RefCompanyTypeDto>>(`${this.base}/company-types`, {
      params: this.params(q),
    });
  }
  getCompanyType(id: number): Observable<RefCompanyTypeDto> {
    return this.http.get<RefCompanyTypeDto>(`${this.base}/company-types/${id}`);
  }
  createCompanyType(body: CreateRefCompanyTypeRequest): Observable<RefCompanyTypeDto> {
    return this.http.post<RefCompanyTypeDto>(`${this.base}/company-types`, body);
  }
  updateCompanyType(id: number, body: UpdateRefCompanyTypeRequest): Observable<RefCompanyTypeDto> {
    return this.http.put<RefCompanyTypeDto>(`${this.base}/company-types/${id}`, body);
  }
  deleteCompanyType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/company-types/${id}`);
  }

  // ─── Policies ─────────────────────────────────────────────────────────────
  getPolicies(
    q: PagedQuery & { tenantId?: string } = {},
  ): Observable<PagedResponse<SecuPolicyDto>> {
    return this.http.get<PagedResponse<SecuPolicyDto>>(`${this.base}/policies`, {
      params: this.params(q),
    });
  }
  createPolicy(body: CreateSecuPolicyRequest): Observable<SecuPolicyDto> {
    return this.http.post<SecuPolicyDto>(`${this.base}/policies`, body);
  }
  updatePolicy(id: number, body: UpdateSecuPolicyRequest): Observable<SecuPolicyDto> {
    return this.http.put<SecuPolicyDto>(`${this.base}/policies/${id}`, body);
  }
  deletePolicy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/policies/${id}`);
  }
  getPolicyRules(
    policyId: number,
    q: PagedQuery = {},
  ): Observable<PagedResponse<SecuPolicyRuleDto>> {
    return this.http.get<PagedResponse<SecuPolicyRuleDto>>(
      `${this.base}/policies/${policyId}/rules`,
      { params: this.params(q) },
    );
  }
  createPolicyRule(
    policyId: number,
    body: CreateSecuPolicyRuleRequest,
  ): Observable<SecuPolicyRuleDto> {
    return this.http.post<SecuPolicyRuleDto>(`${this.base}/policies/${policyId}/rules`, body);
  }
  updatePolicyRule(id: number, body: UpdateSecuPolicyRuleRequest): Observable<SecuPolicyRuleDto> {
    return this.http.put<SecuPolicyRuleDto>(`${this.base}/policy-rules/${id}`, body);
  }
  deletePolicyRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/policy-rules/${id}`);
  }
  evaluatePolicy(body: EvaluateSecuPolicyRequest): Observable<SecuPolicyDecisionDto> {
    return this.http.post<SecuPolicyDecisionDto>(`${this.base}/policies/evaluate`, body);
  }

  // ─── Tokens ───────────────────────────────────────────────────────────────
  revokeToken(body: RevokeSecuTokenRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/tokens/revoke`, body);
  }
  getTokenRevocations(
    q: { search?: string; jti?: string; subject?: string; tenantId?: string; page?: number; size?: number } = {},
  ): Observable<PagedResponse<SecuTokenRevocationDto>> {
    return this.http.get<PagedResponse<SecuTokenRevocationDto>>(`${this.base}/tokens/revocations`, {
      params: this.params(q),
    });
  }

  // ─── Data Filters ─────────────────────────────────────────────────────────
  getTokenSessions(
    q: { search?: string; tenantId?: string; page?: number; size?: number } = {},
  ): Observable<PagedResponse<SecuTokenSessionDto>> {
    return this.http.get<PagedResponse<SecuTokenSessionDto>>(`${this.base}/tokens/sessions`, {
      params: this.params(q),
    });
  }

  revokeUserSessions(userId: string, body: RevokeSecuUserSessionsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/tokens/sessions/${userId}/revoke`, body);
  }

  getDataFilters(
    q: PagedQuery & { entityName?: string; tenantId?: string } = {},
  ): Observable<PagedResponse<SecuDataFilterDto>> {
    return this.http.get<PagedResponse<SecuDataFilterDto>>(`${this.base}/data-filters`, {
      params: this.params(q),
    });
  }
  getEffectiveDataFilters(entityName: string, tenantId?: string): Observable<SecuDataFilterDto[]> {
    return this.http.get<SecuDataFilterDto[]>(`${this.base}/data-filters/effective`, {
      params: this.params({ entityName, tenantId }),
    });
  }
  createDataFilter(body: CreateSecuDataFilterRequest): Observable<SecuDataFilterDto> {
    return this.http.post<SecuDataFilterDto>(`${this.base}/data-filters`, body);
  }
  updateDataFilter(id: number, body: UpdateSecuDataFilterRequest): Observable<SecuDataFilterDto> {
    return this.http.put<SecuDataFilterDto>(`${this.base}/data-filters/${id}`, body);
  }
  deleteDataFilter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/data-filters/${id}`);
  }
  getDataFilterRules(
    filterId: number,
    q: PagedQuery = {},
  ): Observable<PagedResponse<SecuDataFilterRuleDto>> {
    return this.http.get<PagedResponse<SecuDataFilterRuleDto>>(
      `${this.base}/data-filters/${filterId}/rules`,
      { params: this.params(q) },
    );
  }
  createDataFilterRule(
    filterId: number,
    body: CreateSecuDataFilterRuleRequest,
  ): Observable<SecuDataFilterRuleDto> {
    return this.http.post<SecuDataFilterRuleDto>(
      `${this.base}/data-filters/${filterId}/rules`,
      body,
    );
  }
  updateDataFilterRule(
    id: number,
    body: UpdateSecuDataFilterRuleRequest,
  ): Observable<SecuDataFilterRuleDto> {
    return this.http.put<SecuDataFilterRuleDto>(`${this.base}/data-filter-rules/${id}`, body);
  }
  deleteDataFilterRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/data-filter-rules/${id}`);
  }
  getDataFilterTargets(
    filterId: number,
    q: PagedQuery = {},
  ): Observable<PagedResponse<SecuDataFilterTargetDto>> {
    return this.http.get<PagedResponse<SecuDataFilterTargetDto>>(
      `${this.base}/data-filters/${filterId}/targets`,
      { params: this.params(q) },
    );
  }
  createDataFilterTarget(
    filterId: number,
    body: CreateSecuDataFilterTargetRequest,
  ): Observable<SecuDataFilterTargetDto> {
    return this.http.post<SecuDataFilterTargetDto>(
      `${this.base}/data-filters/${filterId}/targets`,
      body,
    );
  }
  updateDataFilterTarget(
    id: number,
    body: UpdateSecuDataFilterTargetRequest,
  ): Observable<SecuDataFilterTargetDto> {
    return this.http.put<SecuDataFilterTargetDto>(`${this.base}/data-filter-targets/${id}`, body);
  }
  deleteDataFilterTarget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/data-filter-targets/${id}`);
  }

  // ─── Auth Settings ────────────────────────────────────────────────────────
  getAuthSettings(tenantId?: string): Observable<AuthSettingsDto> {
    const params = tenantId ? this.params({ tenantId }) : undefined;
    return this.http.get<AuthSettingsDto>(`${this.authBase}/settings`, { params });
  }

  upsertAuthSettings(body: UpsertAuthSettingsRequest): Observable<AuthSettingsDto> {
    return this.http.put<AuthSettingsDto>(`${this.authBase}/settings`, body);
  }

  // ─── MFA ──────────────────────────────────────────────────────────────────
  setupTotp(): Observable<TotpSetupDto> {
    return this.http.post<TotpSetupDto>(`${this.authBase}/mfa/totp/setup`, {});
  }

  verifyTotpSetup(body: TotpVerifyRequest): Observable<AuthActionResultDto> {
    return this.http.post<AuthActionResultDto>(`${this.authBase}/mfa/totp/verify`, body);
  }

  disableTotp(): Observable<AuthActionResultDto> {
    return this.http.post<AuthActionResultDto>(`${this.authBase}/mfa/totp/disable`, {});
  }

  generateRecoveryCodes(): Observable<RecoveryCodesDto> {
    return this.http.post<RecoveryCodesDto>(`${this.authBase}/mfa/recovery-codes`, {});
  }

  setEmailOtp(body: EmailOtpRequest): Observable<AuthActionResultDto> {
    return this.http.post<AuthActionResultDto>(`${this.authBase}/mfa/email`, body);
  }

  // ─── Password Reset ───────────────────────────────────────────────────────
  requestPasswordReset(body: PasswordResetRequest): Observable<AuthActionResultDto> {
    return this.http.post<AuthActionResultDto>(`${this.authBase}/reset-request`, body);
  }

  verifyPasswordReset(body: PasswordResetVerifyRequest): Observable<AuthActionResultDto> {
    return this.http.post<AuthActionResultDto>(`${this.authBase}/reset/verify`, body);
  }
}
