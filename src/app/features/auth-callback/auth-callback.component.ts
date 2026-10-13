import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

import { OidcAuthService } from '../../core/services/oidc-auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, MessageModule],
  template: `
    <main class="callback-shell">
      <section class="callback-card">
        @if (error()) {
          <p-message severity="error" [text]="error() || ''" styleClass="w-full"></p-message>
        } @else {
          <p-progressSpinner ariaLabel="Completing login"></p-progressSpinner>
          <h1>Completing secure login</h1>
          <p>Please wait while we verify the OIDC callback.</p>
        }
      </section>
    </main>
  `,
  styles: [
    `
      .callback-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 20px;
        background:
          radial-gradient(circle at 18% 18%, rgba(79, 142, 247, 0.18), transparent 32%),
          linear-gradient(135deg, var(--s-bg), #090b10 62%, #111522);
      }

      .callback-card {
        width: min(100%, 460px);
        text-align: center;
        border: 1px solid var(--s-border);
        border-radius: 26px;
        background: rgba(19, 22, 30, 0.92);
        padding: clamp(24px, 5vw, 38px);
        box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38);
      }

      h1 {
        margin: 24px 0 0;
        color: var(--s-text);
        font-size: 25px;
        letter-spacing: -0.04em;
      }

      p {
        margin: 8px 0 0;
        color: var(--s-text-2);
        line-height: 1.6;
      }
    `,
  ],
})
export class AuthCallbackComponent implements OnInit {
  private readonly oidcAuth = inject(OidcAuthService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.oidcAuth
      .handleLoginCallback()
      .then((result) => this.router.navigateByUrl(result.redirectUrl, { replaceUrl: true }))
      .catch((error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Unable to complete login.');
      });
  }
}
