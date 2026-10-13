import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { PermissionService } from '../services/permission.service';

function bypass(url: string): boolean {
  const noHash = url.split('#')[0];
  const noQuery = noHash.split('?')[0];
  return noQuery === '/no-access';
}

export const permissionUrlGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  if (bypass(state.url)) {
    return true;
  }

  return permissionService.ensureLoaded().pipe(
    map(() => {
      if (permissionService.canAccessUrl(state.url)) {
        return true;
      }
      const url = state.url.split('?')[0].split('#')[0];
      const prefix =
        url === '/admin' ||
        url.startsWith('/admin/') ||
        url === '/admin/security' ||
        url.startsWith('/admin/security/')
          ? '/admin'
          : undefined;

      return router.parseUrl(permissionService.firstAllowedUrl(prefix) ?? permissionService.firstAllowedUrl() ?? '/no-access');
    }),
  );
};

export const permissionUrlChildGuard: CanActivateChildFn = (childRoute, state) =>
  permissionUrlGuard(childRoute, state);
