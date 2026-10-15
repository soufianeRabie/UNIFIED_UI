import { InjectionToken, type Signal, signal } from '@angular/core';

/**
 * How @s/ui gets text for the labels it renders itself (pagination, empty
 * states, dialog buttons, filters, calendars). The library has no i18n
 * dependency: the host app provides this contract through `provideSUi({ i18n })`.
 */
export interface SUiI18n {
  /** Changes whenever the active language changes; labels recompute on it. */
  readonly version: Signal<unknown>;
  /** Returns the translation, or the key itself when there is none. */
  translate(key: string, params?: Readonly<Record<string, unknown>>): string;
  /**
   * BCP 47 locale of the active language (`fr-FR`, `ar-MA`). Drives every `Intl` formatter: month and weekday
   * names, first day of the week, number and date formats (ADR 0008 §2). Defaults to `en-GB`.
   */
  readonly locale?: Signal<string>;
}

/** English defaults, used when the host has no translation for a key. */
export const S_UI_DEFAULT_LABELS = {
  'S.PAGINATION.RANGE': '{{from}}–{{to}} of {{total}}',
  'S.PAGINATION.NAV': 'Pagination',
  'S.PAGINATION.FIRST': 'First page',
  'S.PAGINATION.PREVIOUS': 'Previous page',
  'S.PAGINATION.NEXT': 'Next page',
  'S.PAGINATION.LAST': 'Last page',
  'S.PAGINATION.PAGE': 'Page {{page}}',
  'S.TABLE.EMPTY': 'Nothing to show yet.',
  'S.TABLE.ACTIONS': 'Actions',
  'S.SEARCH.PLACEHOLDER': 'Search…',
  'S.SEARCH.CLEAR': 'Clear search',
  'S.DIALOG.CLOSE': 'Close',
  'S.DIALOG.CANCEL': 'Cancel',
  'S.DIALOG.CONFIRM': 'Confirm',
  'S.DIALOG.DELETE': 'Delete',
  'S.SELECT.PLACEHOLDER': 'Select…',
  'S.SELECT.EMPTY': 'No options',
  'S.SELECT.FILTER': 'Filter options',
  'S.SELECT.COUNT': '{{count}} selected',
  'S.CALENDAR.PREVIOUS': 'Previous month',
  'S.CALENDAR.NEXT': 'Next month',
  'S.CALENDAR.TODAY': 'Today',
  'S.DATE.PLACEHOLDER': 'Choose a date',
  'S.DATE.RANGE_PLACEHOLDER': 'Choose dates',
  'S.DATE.CLEAR': 'Clear',
  'S.FILTER.OPEN': 'Filter by {{column}}',
  'S.FILTER.TITLE': 'Filter · {{column}}',
  'S.FILTER.OPERATOR': 'Condition',
  'S.FILTER.VALUE': 'Value',
  'S.FILTER.VALUES': 'Values (one per line)',
  'S.FILTER.FROM': 'From',
  'S.FILTER.TO': 'To',
  'S.FILTER.YES': 'Yes',
  'S.FILTER.NO': 'No',
  'S.FILTER.APPLY': 'Apply',
  'S.FILTER.CLEAR': 'Clear',
  'S.FILTER.ACTIVE': 'Active filters',
  'S.FILTER.REMOVE': 'Remove filter: {{label}}',
  'S.FILTER.CLEAR_ALL': 'Clear all',
  'S.FILTER.OP.EQ': 'Is',
  'S.FILTER.OP.NEQ': 'Is not',
  'S.FILTER.OP.CONTAINS': 'Contains',
  'S.FILTER.OP.NOT_CONTAINS': 'Does not contain',
  'S.FILTER.OP.STARTS_WITH': 'Starts with',
  'S.FILTER.OP.ENDS_WITH': 'Ends with',
  'S.FILTER.OP.GT': 'Greater than',
  'S.FILTER.OP.GTE': 'At least',
  'S.FILTER.OP.LT': 'Less than',
  'S.FILTER.OP.LTE': 'At most',
  'S.FILTER.OP.BETWEEN': 'Between',
  'S.FILTER.OP.IN': 'Is one of',
  'S.FILTER.OP.NOT_IN': 'Is none of',
  'S.FILTER.OP.IS_NULL': 'Is empty',
  'S.FILTER.OP.IS_NOT_NULL': 'Is not empty',
  'S.FILTER.OP.ON': 'On',
  'S.FILTER.OP.BEFORE': 'Before',
  'S.FILTER.OP.ON_OR_AFTER': 'On or after',
} as const;

export type SUiLabelKey = keyof typeof S_UI_DEFAULT_LABELS;

const ENGLISH_ONLY: SUiI18n = {
  version: signal(0).asReadonly(),
  translate: (key) => key,
};

export const S_UI_I18N = new InjectionToken<SUiI18n>('S_UI_I18N', {
  factory: () => ENGLISH_ONLY,
});
