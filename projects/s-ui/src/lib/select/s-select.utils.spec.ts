import type { SSelectOption } from './s-select.types';
import {
  filterOptions,
  normalizeText,
  selectedValues,
  selectionSummary,
  valueFromSelection,
} from './s-select.utils';

const options: SSelectOption<string>[] = [
  { value: 'A', label: 'Émilie' },
  { value: 'B', label: 'Ecole' },
  { value: 'C', label: 'Karim' },
];

describe('select utils', () => {
  it('ignores case and accents when filtering', () => {
    expect(normalizeText('ÉCOLE')).toBe('ecole');
    expect(filterOptions(options, ' e ').map((o) => o.value)).toEqual(['A', 'B']);
    expect(filterOptions(options, '')).toBe(options);
  });

  it('normalizes single and multiple values to a list and back', () => {
    expect(selectedValues(null)).toEqual([]);
    expect(selectedValues('A')).toEqual(['A']);
    expect(selectedValues(['A', 'C'])).toEqual(['A', 'C']);
    expect(valueFromSelection(['A'], false)).toBe('A');
    expect(valueFromSelection([], false)).toBeNull();
    expect(valueFromSelection(['A', 'B'], true)).toEqual(['A', 'B']);
  });

  it('summarizes the selection with labels, then a count', () => {
    const count = (n: number) => `${n} selected`;
    expect(selectionSummary(options, [], count)).toBeNull();
    expect(selectionSummary(options, ['C'], count)).toBe('Karim');
    expect(selectionSummary(options, ['A', 'C'], count)).toBe('Émilie, Karim');
    expect(selectionSummary(options, ['A', 'B', 'C'], count)).toBe('3 selected');
    expect(selectionSummary(options, ['Z'], count)).toBe('Z');
  });
});
