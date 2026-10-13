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
    path: 'no-access',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/no-access/no-access.component').then((m) => m.NoAccessComponent),
  },
  {
    // [SRB ] Accessible to all authenticated users — no permissionUrlGuard so employees
    //        can reach it even if they have no admin pages in their menu.
    path: 'security/change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
  },
  {
    path: 'admin/security',
    canActivate: [authGuard, permissionUrlGuard],
    loadChildren: () => import('./secu/secu.routes').then((m) => m.SECU_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, permissionUrlGuard],
    loadChildren: () => import('./secu/secu.routes').then((m) => m.SECU_ROUTES),
  },
  {
    path: 'notif',
    canActivate: [authGuard],
    loadChildren: () => import('./notif/notif.routes').then((m) => m.NOTIF_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
