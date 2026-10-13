import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { PermissionService } from '../services/permission.service';

export const secuActionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  const page = route.data?.['page'] as string;
  const action = route.data?.['action'] as string;

  if (!page || !action) return true;

  return permissionService.ensureLoaded().pipe(
    map(() => permissionService.hasPermission(page, action) || router.parseUrl('/no-access')),
  );
};
