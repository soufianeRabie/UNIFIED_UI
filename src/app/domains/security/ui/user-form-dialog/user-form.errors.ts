import type { ValidationErrors } from '@angular/forms';

/** What a field shows: server text (already translated) wins, else a translation key for a client-side rule. */
export interface FieldView {
  readonly text: string | null;
  readonly key: string | null;
}

const KEY_BY_RULE: Readonly<Record<string, string>> = {
  required: 'SECU.USERS.FORM.ERROR_REQUIRED',
  email: 'SECU.USERS.FORM.ERROR_EMAIL',
  maxlength: 'SECU.USERS.FORM.ERROR_TOO_LONG',
};

/** Client rules show only once the user tried to save, so an untouched form is never red. */
export function fieldView(
  errors: ValidationErrors | null,
  submitted: boolean,
  server: string | undefined,
): FieldView {
  if (server) return { text: server, key: null };
  const rule =
    submitted && errors ? Object.keys(errors).find((name) => name in KEY_BY_RULE) : undefined;
  return { text: null, key: rule ? KEY_BY_RULE[rule] : null };
}
