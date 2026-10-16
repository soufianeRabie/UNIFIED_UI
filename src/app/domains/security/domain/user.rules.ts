import type { User, UserDraft } from './user';

/** Permission page code of the users screen (security permission model). */
export const USERS_PAGE_CODE = 'USERS_MANAGEMENT';

export const USER_LIMITS = { username: 100, fullName: 200, email: 200, externalId: 200 } as const;

/** The form starting values: blank for a new user, the user own values for an edit. */
export function draftOf(user: User | null): UserDraft {
  return {
    username: user?.username ?? '',
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    externalId: user?.externalId ?? '',
    isActive: user?.isActive ?? true,
  };
}

/** Text fields trimmed, as they are sent. */
export function normalizeDraft(draft: UserDraft): UserDraft {
  return {
    ...draft,
    username: draft.username.trim(),
    fullName: draft.fullName.trim(),
    email: draft.email.trim(),
    externalId: draft.externalId.trim(),
  };
}
