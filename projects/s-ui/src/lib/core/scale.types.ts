/**
 * The scales every S component accepts. Inputs are typed to these unions so a
 * screen can only pick a value from the design system — it cannot invent
 * `gap: 13px` or a one-off grey (02 §1.2).
 */

/** Spacing step on the 4px grid: `'3'` = `var(--space-3)` = 12px. */
export type Space = '0' | '1' | '2' | '3' | '4' | '5' | '6';

export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

export type TextSize = '2xs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
export type TextTone =
  'default' | 'muted' | 'subtle' | 'accent' | 'success' | 'warning' | 'danger' | 'special';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

/** State colours shared by stamps, notices and KPI tiles. */
export type StateTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'special';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ControlSize = 'sm' | 'md';
