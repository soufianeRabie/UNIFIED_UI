import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-no-access',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    <main class="state-shell">
      <section class="state-card">
        <div class="state-icon">
          <i class="pi pi-ban"></i>
        </div>
        <p class="state-kicker">Access denied</p>
        <h1>You do not have permission to view this page.</h1>
        <p>
          Your account is authenticated, but the Security API did not grant the required page permission.
        </p>
        <a
          pButton
          routerLink="/admin"
          class="state-action"
          label="Go to allowed security pages"
        ></a>
      </section>
    </main>
  `,
  styles: [
    `
      .state-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 20px;
        background:
          radial-gradient(circle at 20% 18%, rgba(251, 191, 36, 0.12), transparent 32%),
          linear-gradient(135deg, var(--s-bg), #090b10 62%, #111522);
        color: var(--s-text);
      }

      .state-card {
        width: min(100%, 560px);
        border: 1px solid var(--s-border);
        border-radius: 28px;
        background: rgba(19, 22, 30, 0.9);
        padding: clamp(24px, 5vw, 40px);
        box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38);
      }

      .state-icon {
        width: 50px;
        height: 50px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: var(--s-amber-bg);
        color: var(--s-amber);
        border: 1px solid rgba(251, 191, 36, 0.28);
        margin-bottom: 18px;
      }

      .state-kicker {
        margin: 0 0 12px;
        color: var(--s-amber);
        font-family: var(--s-mono);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
      }

      h1 {
        margin: 0;
        font-size: clamp(28px, 5vw, 42px);
        line-height: 1;
        letter-spacing: -0.05em;
      }

      p {
        color: var(--s-text-2);
        line-height: 1.65;
      }

      .state-action {
        margin-top: 22px;
      }
    `,
  ],
})
export class NoAccessComponent {}

