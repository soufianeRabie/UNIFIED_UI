import type { SSelectOption } from './s-select.types';

/** Options above this count get a filter box. */
export const SEARCHABLE_FROM = 8;

/** Case- and accent-insensitive text, so "e" finds "Émilie" and "Ecole". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

export function filterOptions<T>(
  options: readonly SSelectOption<T>[],
  term: string,
): readonly SSelectOption<T>[] {
  const needle = normalizeText(term.trim());
  return needle ? options.filter((o) => normalizeText(o.label).includes(needle)) : options;
}

/** The selected values as a list, whatever the mode (the listbox always works with lists). */
export function selectedValues<T>(value: T | readonly T[] | null | undefined): readonly T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

/** The value a listbox selection means in this mode. */
export function valueFromSelection<T>(
  selection: readonly T[],
  multiple: boolean,
): T | readonly T[] | null {
  return multiple ? selection : (selection[0] ?? null);
}

/**
 * What the closed select shows: the label of the selection, the labels joined when there are few, otherwise a
 * count (`formatCount`), or `null` when nothing is selected (the placeholder shows).
 */
export function selectionSummary<T>(
  options: readonly SSelectOption<T>[],
  selection: readonly T[],
  formatCount: (count: number) => string,
): string | null {
  if (selection.length === 0) return null;
  const labels = selection.map(
    (value) => options.find((o) => Object.is(o.value, value))?.label ?? String(value),
  );
  return labels.length <= 2 ? labels.join(', ') : formatCount(labels.length);
}
