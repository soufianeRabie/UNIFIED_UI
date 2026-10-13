import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadAppConfig } from './app/core/config/app-config';
import { OidcAuthService } from './app/core/services/oidc-auth.service';
import { AuthStore } from './app/core/stores/auth.store';

declare global {
  interface Window {
    // [SRB ] Exposed so the React host shell can drive auth without duplicating the OIDC
    //        logic. logout hits end_session_endpoint; ensureFreshToken refreshes the access
    //        token before it lapses so the React shell never tears itself down while idle.
    __securityLogout?: () => void;
    __securityEnsureFreshToken?: () => Promise<boolean>;
  }
}

loadAppConfig()
  .then(() => bootstrapApplication(App, appConfig))
  .then((appRef) => {
    const oidc = appRef.injector.get(OidcAuthService);
    const authStore = appRef.injector.get(AuthStore);

    window.__securityLogout = () => { void oidc.startLogout(); };

    // [SRB ] Refresh the access token when it's within 2 min of expiry. Returns true if a
    //        valid (or freshly refreshed) token is in place, false if the session is gone.
    //        React calls this on a timer and on reload so an idle user stays signed in until
    //        the refresh token itself expires.
    window.__securityEnsureFreshToken = async () => {
      const refreshToken = authStore.refreshToken();
      if (!refreshToken) {
        return !authStore.isAccessExpired();
      }
      if (!authStore.isAccessExpired(120_000)) {
        return true;
      }
      try {
        const res = await oidc.refreshTokens(refreshToken);
        return Boolean(res.tokens.accessToken);
      } catch {
        return false;
      }
    };
  })
  .catch((err) => console.error(err));
