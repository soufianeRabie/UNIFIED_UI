import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Lara from '@primeuix/themes/lara';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { DEFAULT_PERMISSION_CONFIG, PERMISSION_CONFIG } from './secu/permissions/permission.config';
import { provideSUi } from '@s/ui';
import { acceptLanguageInterceptor, provideI18n, sUiI18nAdapter } from './core/i18n';
import { DomI18nService } from './core/services/dom-i18n.service';
import { provideShellNav } from './core/shell';
import { AppShellNav } from './app-shell-nav';
import { PAGE_PERMISSIONS } from './core/permissions';
import { PermissionService } from './secu/services/permission.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    MessageService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: PERMISSION_CONFIG, useValue: DEFAULT_PERMISSION_CONFIG },
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideHttpClient(withInterceptors([authInterceptor, acceptLanguageInterceptor])),
    provideI18n(),
    provideSUi({ i18n: sUiI18nAdapter }),
    provideShellNav(AppShellNav),
    { provide: PAGE_PERMISSIONS, useExisting: PermissionService },
    provideAppInitializer(() => inject(DomI18nService).init()),
  ],
};
