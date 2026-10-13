import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Lara from '@primeuix/themes/lara';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { DEFAULT_PERMISSION_CONFIG, PERMISSION_CONFIG } from './secu/permissions/permission.config';
import { LangService } from './core/services/lang.service';
import { DomI18nService } from './core/services/dom-i18n.service';

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
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateHttpLoader({
      prefix: '/i18n/',
      suffix: '.json',
    }),
    provideTranslateService({
      fallbackLang: 'fr',
      lang: 'fr',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const lang = inject(LangService);
        return () => lang.init();
      },
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const domI18n = inject(DomI18nService);
        return () => domI18n.init();
      },
      multi: true,
    },
  ],
};
