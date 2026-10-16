import type { SColumn } from '@s/core';
import type { User } from '../../domain/user';

/** A table row: the user plus text that depends on the language, ready to display. */
export interface UserRow {
  readonly user: User;
  readonly id: string;
  readonly username: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly externalId: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

/** Column definitions; `translate` turns a key into the active language. Keys match the server query fields. */
export function buildUserColumns(translate: (key: string) => string): readonly SColumn[] {
  return [
    { key: 'username', header: translate('SECU.USERS.COL.USERNAME'), sortable: true, mono: true },
    { key: 'fullName', header: translate('SECU.USERS.COL.FULL_NAME'), sortable: true },
    { key: 'email', header: translate('SECU.USERS.COL.EMAIL'), sortable: true, priority: 'medium' },
    {
      key: 'externalId',
      header: translate('SECU.USERS.COL.EXTERNAL_ID'),
      mono: true,
      priority: 'low',
    },
    { key: 'isActive', header: translate('COMMON.STATUS'), sortable: true },
    {
      key: 'createdAt',
      header: translate('COMMON.CREATED'),
      sortable: true,
      priority: 'low',
    },
  ];
}

export function toUserRows(users: readonly User[], locale: string): readonly UserRow[] {
  const format = new Intl.DateTimeFormat(locale || undefined, { dateStyle: 'medium' });
  return users.map((user) => ({
    user,
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    externalId: user.externalId,
    isActive: user.isActive,
    createdAt: format.format(user.createdAt),
  }));
}

/** `errors[].path` (`username`, `Username`, `filter.x`) → control name; first segment, first letter lower-case. */
export function fieldKey(path: string): string {
  const head = path.split(/[.[]/)[0];
  return head.charAt(0).toLowerCase() + head.slice(1);
}
