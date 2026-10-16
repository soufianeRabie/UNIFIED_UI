import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { setSearch, type SQuery } from '@s/core';
import {
  SButton,
  SCell,
  SConfirm,
  SDataTable,
  SFilterBar,
  SFilterChips,
  SIconButton,
  SNotice,
  SPageHeader,
  SPanel,
  SRowActions,
  SSearch,
  SStack,
  SStamp,
} from '@s/ui';
import { ErrorMessages } from '../../../../core/errors/app-error';
import { I18nStore } from '../../../../core/i18n';
import { PAGE_PERMISSIONS } from '../../../../core/permissions';
import { UsersStore } from '../../data-access/users.store';
import type { User, UserDraft } from '../../domain/user';
import { USERS_PAGE_CODE } from '../../domain/user.rules';
import { UserFormDialog } from '../../ui/user-form-dialog/user-form-dialog';
import { buildUserColumns, fieldKey, toUserRows } from './users-list.view';

/** Users page: wires the store to `@s/ui` and the form dialog. No rules, no HTTP, no styles. */
@Component({
  selector: 'secu-users-list',
  imports: [
    RouterLink,
    TranslatePipe,
    SButton,
    SCell,
    SDataTable,
    SFilterBar,
    SFilterChips,
    SIconButton,
    SNotice,
    SPageHeader,
    SPanel,
    SRowActions,
    SSearch,
    SStack,
    SStamp,
    UserFormDialog,
  ],
  templateUrl: './users-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersList {
  protected readonly store = inject(UsersStore);
  private readonly permissions = inject(PAGE_PERMISSIONS);
  private readonly confirm = inject(SConfirm);
  private readonly translate = inject(TranslateService);
  private readonly i18n = inject(I18nStore);
  private readonly errors = inject(ErrorMessages);

  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<User | null>(null);

  protected readonly can = computed(() => ({
    create: this.permissions.canCreate(USERS_PAGE_CODE),
    read: this.permissions.canRead(USERS_PAGE_CODE),
    update: this.permissions.canUpdate(USERS_PAGE_CODE),
    delete: this.permissions.canDelete(USERS_PAGE_CODE),
  }));

  protected readonly columns = computed(() => {
    this.i18n.current();
    return buildUserColumns((key) => this.translate.instant(key) as string);
  });
  protected readonly rows = computed(() => toUserRows(this.store.users(), this.i18n.locale()));

  protected readonly listError = computed(() => this.messageOf(this.store.error()));
  private readonly commandText = computed(() => this.messageOf(this.store.commandError()));
  protected readonly dialogError = computed(() => (this.editorOpen() ? this.commandText() : null));
  protected readonly pageError = computed(() => (this.editorOpen() ? null : this.commandText()));
  protected readonly fieldErrors = computed(() => {
    this.i18n.current();
    const fields = this.store.commandError()?.fieldErrors ?? [];
    return Object.fromEntries(fields.map((f) => [fieldKey(f.path), this.errors.text(f)]));
  });

  protected openCreate(): void {
    this.openEditor(null);
  }

  protected openEdit(user: User): void {
    this.openEditor(user);
  }

  protected save(draft: UserDraft): void {
    this.store.save(draft, this.editing()?.id ?? null, () => this.editorOpen.set(false));
  }

  protected async askRemove(user: User): Promise<void> {
    this.store.clearCommandError();
    const confirmed = await this.confirm.ask({
      tone: 'danger',
      title: this.translate.instant('SECU.USERS.DELETE.TITLE') as string,
      message: this.translate.instant('SECU.USERS.DELETE.CONFIRM', {
        name: user.username,
      }) as string,
    });
    if (confirmed) this.store.remove(user.id);
  }

  protected search(term: string): void {
    this.store.setQuery(setSearch(this.store.query(), term));
  }

  protected setQuery(query: SQuery | null): void {
    if (query) this.store.setQuery(query);
  }

  private openEditor(user: User | null): void {
    this.store.clearCommandError();
    this.editing.set(user);
    this.editorOpen.set(true);
  }

  private messageOf(error: Parameters<ErrorMessages['text']>[0] | null): string | null {
    this.i18n.current();
    return error ? this.errors.text(error) : null;
  }
}
