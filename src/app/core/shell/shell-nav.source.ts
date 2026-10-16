import { InjectionToken, type Provider, type Signal } from '@angular/core';
import type { SNavSection } from '@s/core';

/**
 * Where the shell gets its navigation. The frame stays generic: the app decides what the menu contains (pages
 * the user may open, counters, extra links) and keeps any connection the menu needs alive while the shell lives.
 */
export interface ShellNavSource {
  readonly sections: Signal<readonly SNavSection[]>;
  /** Called when the shell appears: load the menu, open live connections. */
  connect(): void;
  /** Called when the shell goes away: close live connections. */
  disconnect(): void;
}

export const SHELL_NAV_SOURCE = new InjectionToken<ShellNavSource>('SHELL_NAV_SOURCE');

/** `provideShellNav(AppShellNav)` in `app.config.ts`. */
export function provideShellNav(source: new (...args: never[]) => ShellNavSource): Provider {
  return { provide: SHELL_NAV_SOURCE, useClass: source };
}
