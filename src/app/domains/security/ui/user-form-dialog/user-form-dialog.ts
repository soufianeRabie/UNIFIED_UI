import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SButton, SDialog, SField, SInput, SNotice, SStack, SSwitch } from '@s/ui';
import type { User, UserDraft } from '../../domain/user';
import { USER_LIMITS, draftOf } from '../../domain/user.rules';
import { fieldView } from './user-form.errors';

/**
 * Create / edit form in a dialog. Presentational: it receives the user to edit and the outcome of the last save as
 * already-translated text, and emits the draft. It never calls the API.
 */
@Component({
  selector: 'secu-user-form-dialog',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    SButton,
    SDialog,
    SField,
    SInput,
    SNotice,
    SStack,
    SSwitch,
  ],
  templateUrl: './user-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialog {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly open = model(false);
  /** The user being edited; `null` creates a new one. */
  readonly user = input<User | null>(null);
  readonly saving = input(false);
  /** Translated summary of the last failure (not tied to one field). */
  readonly errorText = input<string | null>(null);
  /** Translated message per form control name, from the server field errors. */
  readonly fieldErrors = input<Readonly<Record<string, string>>>({});

  readonly saved = output<UserDraft>();

  protected readonly limits = USER_LIMITS;
  protected readonly editing = computed(() => this.user() !== null);
  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(USER_LIMITS.username)]],
    fullName: ['', [Validators.required, Validators.maxLength(USER_LIMITS.fullName)]],
    email: ['', [Validators.email, Validators.maxLength(USER_LIMITS.email)]],
    externalId: ['', [Validators.maxLength(USER_LIMITS.externalId)]],
    isActive: [true],
  });

  private readonly submitted = signal(false);
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected readonly views = computed(() => {
    this.status();
    const submitted = this.submitted();
    const server = this.fieldErrors();
    const view = (name: 'username' | 'fullName' | 'email' | 'externalId') =>
      fieldView(this.form.controls[name].errors, submitted, server[name]);
    return {
      username: view('username'),
      fullName: view('fullName'),
      email: view('email'),
      externalId: view('externalId'),
    };
  });

  constructor() {
    // A fresh form every time the dialog opens (form state lives outside signals).
    effect(() => {
      if (!this.open()) return;
      this.submitted.set(false);
      this.form.reset(draftOf(this.user()));
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.valid) this.saved.emit(this.form.getRawValue());
  }
}
