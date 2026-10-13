import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LangService } from '../../core/services/lang.service';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <button
      class="lang-btn"
      (click)="lang.toggle()"
      [title]="'LANG.SWITCH' | translate"
      type="button"
    >
      <span class="lang-flag">{{ lang.current === 'fr' ? '�«�·' : '�¬�§' }}</span>
      <span class="lang-label">{{ lang.current === 'fr' ? 'FR' : 'EN' }}</span>
    </button>
  `,
  styles: [`
    .lang-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: 1px solid var(--s-border, #e2e8f0);
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      color: var(--s-text-2, #475569);
      letter-spacing: 0.05em;
      transition: background 0.15s, color 0.15s;
    }
    .lang-btn:hover {
      background: var(--s-surface-hover, #f1f5f9);
      color: var(--s-text-1, #0f172a);
    }
    .lang-flag { font-size: 14px; }
    .lang-label { font-size: 11px; }
  `]
})
export class LangSwitcherComponent {
  readonly lang = inject(LangService);
}

