import { Routes } from '@angular/router';

export const SECU_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/shared/secu-layout.component').then((m) => m.SecuLayoutComponent),
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },

      // ── Identity ──────────────────────────────────────────────────────
      {
        path: 'users',
        loadComponent: () =>
          import('./components/users/users-list.component').then((m) => m.UsersListComponent),
        title: 'Users — Security',
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./components/users/user-detail.component').then((m) => m.UserDetailComponent),
        title: 'User Detail — Security',
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./components/roles/roles-list.component').then((m) => m.RolesListComponent),
        title: 'Roles — Security',
      },
      {
        path: 'roles/:id',
        loadComponent: () =>
          import('./components/roles/role-detail.component').then((m) => m.RoleDetailComponent),
        title: 'Role Detail — Security',
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./components/groups/groups-list.component').then((m) => m.GroupsListComponent),
        title: 'Groups — Security',
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./components/groups/group-detail.component').then((m) => m.GroupDetailComponent),
        title: 'Group Detail — Security',
      },

      // ── Structure ─────────────────────────────────────────────────────
      {
        path: 'pages',
        loadComponent: () =>
          import('./components/pages/pages-list.component').then((m) => m.PagesListComponent),
        title: 'Pages — Security',
      },
      {
        path: 'actions',
        loadComponent: () =>
          import('./components/actions/actions-list.component').then((m) => m.ActionsListComponent),
        title: 'Actions — Security',
      },
      {
        path: 'page-actions',
        loadComponent: () =>
          import('./components/page-actions/page-actions-list.component').then(
            (m) => m.PageActionsListComponent,
          ),
        title: 'Page Actions — Security',
      },

      // ── Access ────────────────────────────────────────────────────────
      {
        path: 'permissions',
        loadComponent: () =>
          import('./components/permissions/permissions-matrix.component').then(
            (m) => m.PermissionsMatrixComponent,
          ),
        title: 'Permissions — Security',
      },
      {
        path: 'policies',
        loadComponent: () =>
          import('./components/policies/policies.component').then((m) => m.PoliciesComponent),
        title: 'Policies — Security',
      },
      {
        path: 'data-filters',
        loadComponent: () =>
          import('./components/data-filters/data-filters.component').then(
            (m) => m.DataFiltersComponent,
          ),
        title: 'Data Filters — Security',
      },

      // ── Registry ──────────────────────────────────────────────────────
      {
        path: 'companies',
        loadComponent: () =>
          import('./components/companies/companies.component').then((m) => m.CompaniesComponent),
        title: 'Companies — Security',
      },

      // ── Tokens ───────────────────────────────────────────────────────
      {
        path: 'tokens',
        loadComponent: () =>
          import('./components/tokens/token-revocations.component').then(
            (m) => m.TokenRevocationsComponent,
          ),
        title: 'Token Revocations — Security',
      },

      // ── Monitoring ───────────────────────────────────────────────────
      {
        path: 'audit',
        loadComponent: () =>
          import('./components/audit/audit-log.component').then((m) => m.AuditLogComponent),
        title: 'Audit Log — Security',
      },
      {
        path: 'audit-config',
        loadComponent: () =>
          import('./components/audit/audit-config.component').then((m) => m.AuditConfigComponent),
        title: 'Audit Config — Security',
      },
      {
        path: 'audit-reports',
        loadComponent: () =>
          import('./components/audit/audit-reports.component').then((m) => m.AuditReportsComponent),
        title: 'Audit Reports - Security',
      },

      // ── Security Settings ─────────────────────────────────────────────
      {
        path: 'auth-settings',
        loadComponent: () =>
          import('./components/auth-settings/auth-settings.component').then(
            (m) => m.AuthSettingsComponent,
          ),
        title: 'Auth Settings — Security',
      },
      {
        path: 'my-security',
        loadComponent: () =>
          import('./components/my-security/my-security.component').then(
            (m) => m.MySecurityComponent,
          ),
        title: 'My Security — Security',
      },
    ],
  },
];
