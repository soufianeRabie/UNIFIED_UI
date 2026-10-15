/** A range of calendar days, both ends inclusive, as ISO dates. `end` is null while the user picks it. */
export interface SDateRange {
  readonly start: string | null;
  readonly end: string | null;
}

export type CalendarMode = 'single' | 'range';

/** Everything a day cell needs to render, precomputed (no logic in the template). */
export interface CalendarDay {
  readonly iso: string;
  /** Day number in the locale's digits. */
  readonly text: string;
  readonly label: string;
  readonly inMonth: boolean;
  readonly today: boolean;
  readonly selected: boolean;
  readonly rangeStart: boolean;
  readonly rangeEnd: boolean;
  readonly inRange: boolean;
  readonly disabled: boolean;
  /** The one day reachable with Tab (roving tabindex). */
  readonly focusable: boolean;
}
