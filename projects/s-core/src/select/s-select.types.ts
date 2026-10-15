/** One choice of an `SSelect`. `label` is already translated. */
export interface SSelectOption<T> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}
