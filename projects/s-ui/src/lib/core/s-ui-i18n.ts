import { InjectionToken, type Signal, signal } from '@angular/core';

/**
 * How @s/ui gets text for the labels it renders itself (pagination, empty
 * states, dialog buttons). The library has no i18n dependency: the host app
 * provides this contract through `provideSUi({ i18n })`.
 */
export interface SUiI18n {
  /** Changes whenever the active language changes; labels recompute on it. */
  readonly version: Signal<unknown>;
  /** Returns the translation, or the key itself when there is none. */
  translate(key: string, params?: Readonly<Record<string, unknown>>): string;
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
} as const;

export type SUiLabelKey = keyof typeof S_UI_DEFAULT_LABELS;

const ENGLISH_ONLY: SUiI18n = {
  version: signal(0).asReadonly(),
  translate: (key) => key,
};

export const S_UI_I18N = new InjectionToken<SUiI18n>('S_UI_I18N', {
  factory: () => ENGLISH_ONLY,
});
