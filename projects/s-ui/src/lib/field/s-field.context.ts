import { InjectionToken, type Signal } from '@angular/core';

/**
 * What an `SField` tells the control projected inside it, so the label, hint
 * and error are wired without the screen doing anything (02 §5).
 */
export interface SFieldContext {
  readonly controlId: string;
  /** Space-separated ids of the hint/error, for `aria-describedby`. */
  readonly describedBy: Signal<string | null>;
  readonly invalid: Signal<boolean>;
}

export const S_FIELD = new InjectionToken<SFieldContext>('S_FIELD');
