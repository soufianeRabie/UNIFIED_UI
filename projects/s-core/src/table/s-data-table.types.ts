/** Column widths come from a scale, like spacing: a screen cannot invent 137px. */
export type ColumnWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** A column, declared once per screen. Everything the table renders comes from it. */
export interface SColumn {
  /** Row property shown by the default cell; also the sort key sent to the API. */
  readonly key: string;
  /** Already translated header text. */
  readonly header: string;
  /** Opt-in: only columns the API can sort on. */
  readonly sortable?: boolean;
  readonly align?: 'start' | 'center' | 'end';
  readonly width?: ColumnWidth;
  /** Hidden on narrow screens: `medium` below 768px, `low` below 1024px. */
  readonly priority?: 'medium' | 'low';
  /** Default cell in the mono face (ids, codes, usernames). */
  readonly mono?: boolean;
}

export interface SSort {
  readonly key: string;
  readonly dir: 'asc' | 'desc';
}

/** Context of `s-cell` and `s-row-actions` templates. */
export interface SCellContext<T> {
  readonly $implicit: T;
  readonly row: T;
  readonly index: number;
}
