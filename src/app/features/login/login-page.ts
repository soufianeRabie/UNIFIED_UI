import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthStore } from '../../core/stores/auth.store';
import { OidcAuthService } from '../../core/services/oidc-auth.service';
import { LangSwitcherComponent } from '../../shared/components/lang-switcher.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, MessageModule, TranslatePipe, LangSwitcherComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPageComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly oidcAuth = inject(OidcAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected loading = signal(false);
  protected authError = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      void this.router.navigateByUrl(this.redirectUrl());
    }
  }

  protected signIn(): void {
    this.loading.set(true);
    this.authError.set(null);

    this.oidcAuth.startLogin(this.redirectUrl()).catch((error: unknown) => {
      this.loading.set(false);
      this.authError.set(error instanceof Error ? error.message : 'Unable to start login.');
    });
  }

  private redirectUrl(): string {
    return this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/admin';
  }
}


