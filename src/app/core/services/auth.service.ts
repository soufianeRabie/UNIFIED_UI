import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';

import { AuthResponse } from '../models/auth-response.model';
import { OidcAuthService } from './oidc-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oidcAuth = inject(OidcAuthService);

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return from(this.oidcAuth.refreshTokens(refreshToken));
  }
}
