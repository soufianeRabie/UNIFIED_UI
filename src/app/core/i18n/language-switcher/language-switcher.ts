import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nStore } from '../i18n-store';

let nextId = 0;

/**
 * Language picker built from the registry (ADR 0006). Hidden when only one
 * language is enabled; each option is labelled in its own language and script.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  protected readonly store = inject(I18nStore);
  protected readonly selectId = `app-language-switcher-${++nextId}`;

  protected onChange(event: Event): void {
    void this.store.use((event.target as HTMLSelectElement).value);
  }
}
