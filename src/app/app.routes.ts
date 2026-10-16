import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { permissionUrlGuard } from './secu/guards/permission-url.guard';

import { LoginPageComponent } from './features/login/login-page';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent,
      ),
  },
  {
    path: 'auth/logout-callback',
    loadComponent: () =>
      import('./features/auth-callback/logout-callback.component').then(
        (m) => m.LogoutCallbackComponent,
      ),
  },
  {
    path: '',
    component: LoginPageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    // One frame for every signed-in page (step 2.4): core/shell, menu from the permission API.
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/shell').then((m) => m.ShellLayout),
    children: [
      {
        path: 'no-access',
        loadComponent: () =>
          import('./features/no-access/no-access.component').then((m) => m.NoAccessComponent),
      },
      {
        // Every signed-in user, even without admin pages in their menu.
        path: 'security/change-password',
        loadComponent: () =>
          import('./features/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
      {
        path: 'admin/security',
        canActivate: [permissionUrlGuard],
        loadChildren: () => import('./secu/secu.routes').then((m) => m.SECU_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [permissionUrlGuard],
        loadChildren: () => import('./secu/secu.routes').then((m) => m.SECU_ROUTES),
      },
      {
        path: 'notif',
        loadChildren: () => import('./notif/notif.routes').then((m) => m.NOTIF_ROUTES),
      },
    ],
  },
  {
    // Design-system gallery for reviewers; never matched in production builds.
    path: 'dev/ui',
    canMatch: [() => isDevMode()],
    loadComponent: () => import('./dev/s-ui-gallery/s-ui-gallery').then((m) => m.SUiGallery),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
