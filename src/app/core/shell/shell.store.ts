import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { breadcrumbs } from '@s/core';
import { filter, map } from 'rxjs';
import { SHELL_NAV_SOURCE } from './shell-nav.source';

const COLLAPSED_KEY = 'shell.sidebar.collapsed';

/** State of the application frame: navigation, current page, breadcrumbs, sidebar preference. */
@Injectable({ providedIn: 'root' })
export class ShellStore {
  private readonly router = inject(Router);
  private readonly source = inject(SHELL_NAV_SOURCE);

  readonly sections = this.source.sections;

  readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly crumbs = computed(() => breadcrumbs(this.sections(), this.url()));

  /** Remembered per browser: a preference, not shared state. */
  readonly collapsed = signal(readFlag(COLLAPSED_KEY));
  readonly mobileOpen = signal(false);

  connect(): void {
    this.source.connect();
  }

  disconnect(): void {
    this.source.disconnect();
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    writeFlag(COLLAPSED_KEY, collapsed);
  }
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage blocked (private mode): the preference simply is not remembered.
  }
}
