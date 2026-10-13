import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { AuthStore } from '../stores/auth.store';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  const refresh = authStore.refreshToken();
  if (refresh) {
    return authService.refreshToken(refresh).pipe(
      map(() => true),
      catchError(() => {
        authStore.clearAuth();
        return of(router.createUrlTree(['/login'], { queryParams: { redirectUrl: state.url } }));
      }),
    );
  }

  return router.createUrlTree(['/login'], { queryParams: { redirectUrl: state.url } });
};
