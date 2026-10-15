export interface SConfirmOptions {
  /** Already translated. */
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** `danger` for destructive actions: red confirm button, "Delete" by default. */
  readonly tone?: 'default' | 'danger';
}
